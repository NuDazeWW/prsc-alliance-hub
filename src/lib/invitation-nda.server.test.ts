import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadInvitationNda, saveReviewedInvitationNda } from "./invitation-nda.server";
import type { DbClient } from "./db-types";
import {
  assertReviewedInvitationNda,
  invitationNdaReviewMatches,
  type InvitationNdaMember,
  type InvitationNdaEvidence,
} from "./invitation-nda";

// The in-memory double mirrors PostgREST's untyped JSON rows; assertions read nested JSON freely.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
type Result = { data: any; error: { message: string } | null };
/* eslint-enable @typescript-eslint/no-explicit-any */
type Table =
  "portal_members" | "invitation_nda_evidence" | "governance_reviews" | "portal_activity";
const oldDate = "2026-09-15T12:00:00+00:00";
const reviewDate = new Date("2026-10-28T15:00:00.000Z");
const originalAdmin = "11111111-1111-4111-8111-111111111111";
const reviewingAdmin = "22222222-2222-4222-8222-222222222222";
const clone = <T>(value: T): T => structuredClone(value);

/** SQL adapter only: evaluates actual orchestrator queries without implementing NDA eligibility/save decisions. */
class MemoryClient {
  tables: Record<Table, Row[]>;
  writes: { table: string; action: string; rows: Row[] }[] = [];
  rpcCalls: string[] = [];
  beforeUpdate?: (table: Table, client: MemoryClient) => void;
  failAuditInsert = false;
  private nextId = 1;
  constructor(members: InvitationNdaMember[], evidence: InvitationNdaEvidence[]) {
    this.tables = {
      portal_members: clone(members),
      invitation_nda_evidence: clone(evidence),
      governance_reviews: [],
      portal_activity: [],
    };
  }
  from(table: Table) {
    if (!(table in this.tables)) throw new Error(`Unexpected table ${table}`);
    return new MemoryQuery(this, table);
  }
  // This endpoint must never obtain credentials or send any invitation.
  get auth(): never {
    throw new Error("Auth/invitation calls are forbidden in this persistence test");
  }
  newId() {
    return `99999999-0000-4000-8000-${String(this.nextId++).padStart(12, "0")}`;
  }
  async rpc(name: string, values: Row): Promise<Result> {
    assert.equal(name, "bind_invitation_nda", "No unrelated operation is permitted");
    this.rpcCalls.push(name);
    const reference = String(values.p_reference).trim().toLowerCase();
    const expected = {
      reference,
      recipient_email: String(values.p_email).trim().toLowerCase(),
      recipient_name: values.p_name,
      entities: values.p_entities,
      scope: values.p_scope,
    };
    let evidence = this.tables.invitation_nda_evidence.find((row) => row.reference === reference);
    if (!evidence) {
      evidence = {
        ...expected,
        reviewer_id: values.p_reviewer,
        verified_at: reviewDate.toISOString().replace("Z", "+00:00"),
      };
      this.tables.invitation_nda_evidence.push(evidence);
      this.writes.push({
        table: "invitation_nda_evidence",
        action: "bind",
        rows: [clone(evidence)],
      });
    }
    return Object.entries(expected).every(([key, value]) => evidence![key] === value)
      ? { data: null, error: null }
      : { data: null, error: { message: "Existing binding cannot change recipient or scope" } };
  }
}
class MemoryQuery implements PromiseLike<Result> {
  private action: "read" | "insert" | "update" = "read";
  private values: Row[] = [];
  private filters: ((row: Row) => boolean)[] = [];
  private projection = "*";
  private returning = false;
  private ordering?: { key: string; ascending: boolean };
  private execution?: Promise<Result>;
  constructor(
    private client: MemoryClient,
    private table: Table,
  ) {}
  select(fields = "*") {
    this.projection = fields;
    this.returning = true;
    return this;
  }
  insert(value: Row | Row[]) {
    this.action = "insert";
    this.values = clone(Array.isArray(value) ? value : [value]);
    return this;
  }
  update(value: Row) {
    this.action = "update";
    this.values = [clone(value)];
    return this;
  }
  eq(key: string, value: unknown) {
    this.filters.push((row) => equalSqlValue(key, row[key], value));
    return this;
  }
  neq(key: string, value: unknown) {
    this.filters.push(
      (row) => row[key] !== null && row[key] !== undefined && !equalSqlValue(key, row[key], value),
    );
    return this;
  }
  ilike(key: string, pattern: string) {
    let expression = "";
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i];
      if (char === "\\" && i + 1 < pattern.length) expression += escapeRegex(pattern[++i]);
      else expression += char === "%" ? ".*" : char === "_" ? "." : escapeRegex(char);
    }
    const regex = new RegExp(`^${expression}$`, "i");
    this.filters.push((row) => typeof row[key] === "string" && regex.test(row[key]));
    return this;
  }
  order(key: string, options: { ascending: boolean }) {
    this.ordering = { key, ascending: options.ascending };
    return this;
  }
  async single(): Promise<Result> {
    const result = await this.run();
    if (result.error) return result;
    return result.data?.length === 1
      ? { data: result.data[0], error: null }
      : { data: null, error: { message: "Expected one row" } };
  }
  async maybeSingle(): Promise<Result> {
    const result = await this.run();
    if (result.error) return result;
    return result.data?.length > 1
      ? { data: null, error: { message: "More than one row" } }
      : { data: result.data?.[0] ?? null, error: null };
  }
  then<T1 = Result, T2 = never>(
    fulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    rejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    return this.run().then(fulfilled, rejected);
  }
  private run(): Promise<Result> {
    if (!this.execution)
      this.execution = Promise.resolve().then(() => {
        let rows: Row[];
        if (this.action === "insert") {
          if (this.table === "governance_reviews" && this.client.failAuditInsert)
            return { data: null, error: { message: "Injected audit outage" } };
          rows = this.values.map((row) => sqlRow({ id: this.client.newId(), ...row }));
          this.client.tables[this.table].push(...rows);
        } else {
          if (this.action === "update") this.client.beforeUpdate?.(this.table, this.client);
          rows = this.client.tables[this.table].filter((row) =>
            this.filters.every((filter) => filter(row)),
          );
          if (this.action === "update")
            rows.forEach((row) => Object.assign(row, sqlRow(this.values[0])));
        }
        if (this.action !== "read" && rows.length)
          this.client.writes.push({ table: this.table, action: this.action, rows: clone(rows) });
        if (this.ordering) {
          const { key, ascending } = this.ordering;
          rows = [...rows].sort(
            (a, b) => String(a[key]).localeCompare(String(b[key])) * (ascending ? 1 : -1),
          );
        }
        const projected =
          this.projection === "*"
            ? rows
            : rows.map((row) =>
                Object.fromEntries(this.projection.split(",").map((key) => [key, row[key]])),
              );
        return {
          data: this.action === "read" || this.returning ? clone(projected) : null,
          error: null,
        };
      });
    return this.execution;
  }
}
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function equalSqlValue(key: string, a: unknown, b: unknown) {
  if (key.endsWith("_at") && typeof a === "string" && typeof b === "string")
    return new Date(a).getTime() === new Date(b).getTime();
  return a === b;
}
function sqlRow(row: Row) {
  const result = clone(row);
  for (const key of ["nda_verified_at", "updated_at", "verified_at"])
    if (typeof result[key] === "string")
      result[key] = new Date(result[key]).toISOString().replace("Z", "+00:00");
  // JSON audit details deliberately keep their original ISO representation, like PostgreSQL JSONB.
  return result;
}
function fixture() {
  const members: InvitationNdaMember[] = [1, 2, 3, 4].map((n) => ({
    id: `${n}${n}${n}${n}${n}${n}${n}${n}-0000-4000-8000-000000000000`,
    first_name: `Fictional${n}`,
    last_name: "Candidate",
    email: `fictional${n}@example.test`,
    entity: n === 4 ? "both" : "prsc",
    is_candidate: true,
    status: "invited",
    updated_at: oldDate,
    nda_reference: n === 3 ? null : `nda-fictional-${n}`,
    nda_entities: n === 3 ? null : "prsc",
    nda_scope: n === 3 ? null : `Private information for fictional ${n}`,
    nda_verified_at: n === 3 ? null : oldDate,
    nda_verified_by: n === 3 ? null : originalAdmin,
  }));
  const evidence = members
    .filter((m) => m.nda_reference)
    .map((m) => ({
      reference: m.nda_reference!,
      recipient_email: m.email,
      recipient_name: `${m.first_name} ${m.last_name}`,
      entities: m.nda_entities!,
      scope: m.nda_scope!,
      verified_at: oldDate,
      reviewer_id: originalAdmin,
    }));
  return { members, client: new MemoryClient(members, evidence) };
}
function inputFor(member: InvitationNdaMember) {
  return {
    member_id: member.id,
    expected_updated_at: member.updated_at,
    reference: member.nda_reference ?? "",
    entities: member.nda_entities ?? "prsc",
    scope: member.nda_scope ?? "",
    confirmed: true,
  };
}
/** The in-memory mock implements only the query surface these helpers use. */
const db = (client: MemoryClient) => client as unknown as DbClient;

function reviewFor(client: MemoryClient, id: string) {
  return client.tables.governance_reviews.find((row) => row.id === id)!;
}

describe("isolated invitation NDA persistence", () => {
  it("requires explicit review before writes, then confirms unchanged proof while retaining its original verifier/date", async () => {
    const { client, members } = fixture();
    await assert.rejects(
      saveReviewedInvitationNda(
        db(client),
        reviewingAdmin,
        { ...inputFor(members[0]), confirmed: false },
        reviewDate,
      ),
    );
    assert.equal(client.writes.length, 0);
    const saved = await saveReviewedInvitationNda(
      db(client),
      reviewingAdmin,
      inputFor(members[0]),
      reviewDate,
    );
    const review = reviewFor(client, saved.reviewId);
    assert.equal(saved.verificationPreserved, true);
    assert.equal(new Date(saved.member.nda_verified_at!).getTime(), new Date(oldDate).getTime());
    assert.equal(saved.member.nda_verified_by, originalAdmin);
    assert.equal(review.reviewer_id, reviewingAdmin);
    assert.equal(review.decision, "verified");
    assert.equal(review.details.verification_preserved, true);
    assert.equal(client.tables.portal_activity[0].member_id, members[0].id);
    assert.equal(client.tables.portal_activity[0].metadata.review_id, saved.reviewId);
    assert.equal(
      client.writes.some((write) => write.table === "invitation_nda_evidence"),
      false,
    );
    assert.deepEqual(client.tables.portal_members.slice(1), members.slice(1));
  });
  it("saves a same-recipient scope correction, reloads it, and records before/after evidence usable by the invitation gate", async () => {
    const { client, members } = fixture();
    const correctedScope = "Corrected private PRSC information-sharing scope";
    const saved = await saveReviewedInvitationNda(
      db(client),
      reviewingAdmin,
      {
        ...inputFor(members[0]),
        scope: correctedScope,
        review_note: "Reviewed the recipient’s executed amendment.",
      },
      reviewDate,
    );
    const reloaded = await loadInvitationNda(db(client), members[0].id);
    const review = reviewFor(client, saved.reviewId);
    assert.equal(saved.proofChanged, true);
    assert.equal(saved.verificationPreserved, false);
    assert.equal(reloaded.member.nda_scope, correctedScope);
    assert.equal(reloaded.member.nda_verified_by, reviewingAdmin);
    assert.equal(reloaded.evidence?.scope, correctedScope);
    assert.equal(reloaded.evidence?.recipient_email, members[0].email);
    assert.equal(reloaded.evidence?.reference, members[0].nda_reference);
    assert.equal(review.details.previous.scope, members[0].nda_scope);
    assert.equal(review.details.evidence_previous.scope, members[0].nda_scope);
    assert.equal(review.details.saved.scope, correctedScope);
    assert.equal(review.decision, "verified");
    // PostgREST rereads timestamptz as +00:00; JSONB retains the original Z spelling.
    assert.equal(review.details.saved.verified_at.endsWith("Z"), true);
    assert.equal(reloaded.member.nda_verified_at!.endsWith("+00:00"), true);
    assert.equal(invitationNdaReviewMatches(review, reloaded.member), true);
    assert.doesNotThrow(() =>
      assertReviewedInvitationNda(
        {
          selected_member_id: members[0].id,
          first_name: members[0].first_name,
          last_name: members[0].last_name,
          email: members[0].email,
          nda_confirmed: true,
          nda_reference: reloaded.member.nda_reference!,
          nda_entities: reloaded.member.nda_entities!,
          nda_scope: correctedScope,
        },
        reloaded.member,
        review,
        reviewingAdmin,
      ),
    );
    assert.equal(reloaded.eligibilityProblem, null);
    assert.equal(client.tables.portal_activity.length, 1);
  });
  it("keeps absent or inadequate proof ineligible without creating invitations", async () => {
    const { client, members } = fixture();
    const missing = await loadInvitationNda(db(client), members[2].id);
    assert.match(missing.eligibilityProblem!, /verification date/);
    await assert.rejects(
      saveReviewedInvitationNda(db(client), reviewingAdmin, inputFor(members[2]), reviewDate),
    );
    assert.equal(client.writes.length, 0);
    const incompleteCoverage = await saveReviewedInvitationNda(
      db(client),
      reviewingAdmin,
      inputFor(members[3]),
      reviewDate,
    );
    assert.match(incompleteCoverage.eligibilityProblem!, /every entity/);
    assert.equal(incompleteCoverage.member.entity, "both");
    assert.equal(incompleteCoverage.member.nda_entities, "prsc");
    assert.deepEqual(client.rpcCalls, ["bind_invitation_nda"]);
  });
  it("creates a recipient-owned binding for missing proof only after a complete explicit review", async () => {
    const { client, members } = fixture();
    const saved = await saveReviewedInvitationNda(
      db(client),
      reviewingAdmin,
      {
        ...inputFor(members[2]),
        reference: "new-fictional-3-evidence",
        scope: "Fictional 3 private PRSC information",
      },
      reviewDate,
    );
    assert.equal(saved.member.id, members[2].id);
    assert.equal(saved.member.nda_verified_by, reviewingAdmin);
    assert.equal(new Date(saved.member.nda_verified_at!).getTime(), reviewDate.getTime());
    assert.equal(saved.evidence?.recipient_email, members[2].email);
    assert.equal(
      saved.evidence?.recipient_name,
      `${members[2].first_name} ${members[2].last_name}`,
    );
    assert.equal(saved.eligibilityProblem, null);
    const review = reviewFor(client, saved.reviewId);
    assert.equal(review.details.previous.verified_at, null);
    assert.equal(review.details.evidence_previous, null);
    assert.equal(review.decision, "verified");
    assert.equal(invitationNdaReviewMatches(review, saved.member), true);
    assert.deepEqual(
      client.tables.portal_members.filter((row) => row.id !== members[2].id),
      members.filter((row) => row.id !== members[2].id),
    );
    assert.equal(
      client.writes[0].table,
      "governance_reviews",
      "A durable review must precede the new binding",
    );
  });
  it("rejects a foreign reference before any mutation and never exposes that recipient's proof in the selected form", async () => {
    const { client, members } = fixture();
    const before = clone(client.tables);
    await assert.rejects(
      saveReviewedInvitationNda(
        db(client),
        reviewingAdmin,
        { ...inputFor(members[1]), reference: members[0].nda_reference! },
        reviewDate,
      ),
      /another recipient/,
    );
    assert.deepEqual(client.tables, before);
    assert.equal(client.writes.length, 0);
    assert.equal(client.rpcCalls.length, 0);
    client.tables.portal_members[1].nda_reference = members[0].nda_reference;
    const detail = await loadInvitationNda(db(client), members[1].id);
    assert.equal(detail.evidence, null);
    assert.equal(
      detail.evidenceOptions.every((row) => row.recipient_email === members[1].email),
      true,
    );
    assert.match(detail.eligibilityProblem!, /does not match/);
  });
  it("rejects an already-stale record before writes and loses a concurrent update safely at the member compare-and-set", async () => {
    const { client, members } = fixture();
    await assert.rejects(
      saveReviewedInvitationNda(
        db(client),
        reviewingAdmin,
        { ...inputFor(members[0]), expected_updated_at: "2026-01-01T00:00:00.000Z" },
        reviewDate,
      ),
      /record changed/,
    );
    assert.equal(client.writes.length, 0);
    const concurrentDate = "2026-10-28T15:00:01.000+00:00";
    client.beforeUpdate = (table, db) => {
      if (table !== "portal_members") return;
      db.tables.portal_members[0].updated_at = concurrentDate;
      db.beforeUpdate = undefined;
    };
    await assert.rejects(
      saveReviewedInvitationNda(db(client), reviewingAdmin, inputFor(members[0]), reviewDate),
      /could not be completed/,
    );
    assert.equal(client.tables.portal_members[0].updated_at, concurrentDate);
    assert.equal(client.tables.portal_members[0].nda_verified_by, originalAdmin);
    assert.equal(client.tables.governance_reviews[0].decision, "save_incomplete");
    assert.equal(
      invitationNdaReviewMatches(
        client.tables.governance_reviews[0],
        client.tables.portal_members[0] as InvitationNdaMember,
      ),
      false,
    );
    assert.equal(client.tables.portal_activity.length, 0);
  });
  it("does not mutate proof or member records when the durable audit cannot be written", async () => {
    const { client, members } = fixture();
    client.failAuditInsert = true;
    const before = clone(client.tables);
    await assert.rejects(
      saveReviewedInvitationNda(
        db(client),
        reviewingAdmin,
        { ...inputFor(members[0]), scope: "A proposed correction" },
        reviewDate,
      ),
      /review could not be recorded/,
    );
    assert.deepEqual(client.tables, before);
    assert.equal(client.rpcCalls.length, 0);
  });
});
