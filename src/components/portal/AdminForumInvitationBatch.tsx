import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInvitationNda, saveInvitationNdaVerification } from "@/lib/invitation-nda.functions";
import { invitationNdaFormValues } from "@/lib/invitation-nda-form";
import { readIntendedDesignation } from "@/lib/intended-designation";
import { draftWhyYou, draftWhyYouPreview } from "@/lib/why-you-draft.functions";
import { invitePortalMember, saveMemberInvitationNotes } from "@/lib/portal.functions";
import { invitationNoteReady, saveMemberInvitationNotesSchema } from "@/lib/member-import-validation";
import { eligibleForumInvitee, forumBatchAsyncToken, forumBatchInvitationPayload, forumBatchNotesSaved, forumBatchReadyProblem, forumBatchRow, type ForumBatchRow, type ForumInviteMember } from "@/lib/forum-invitation-batch";
import { userFacingError } from "@/lib/user-facing-error";

type Props = { members: unknown[]; preview: boolean; onSaved: () => void };
type DraftSource = { kind: string; url?: string };

/** Saved roster preparation. Each recipient keeps a separate draft, NDA review, and explicit delivery action. */
export function AdminForumInvitationBatch({ members, preview, onSaved }: Props) {
  const candidates = useMemo(() => (members as ForumInviteMember[]).filter(eligibleForumInvitee), [members]);
  const [rows, setRows] = useState<Record<string, ForumBatchRow>>({});
  const rowsRef = useRef(rows);
  const epoch = useRef(0);
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; epoch.current += 1; }; }, []);
  function beginBusy(label: string) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(label); return true;
  }
  function endBusy() {
    busyRef.current = false;
    if (mounted.current) setBusy("");
  }

  function update(id: string, change: (row: ForumBatchRow) => ForumBatchRow) {
    const current = rowsRef.current[id];
    if (!mounted.current || !current) return;
    const next = { ...rowsRef.current, [id]: change(current) };
    rowsRef.current = next;
    setRows(next);
  }
  function put(row: ForumBatchRow) {
    const next = { ...rowsRef.current, [row.member.id]: row };
    rowsRef.current = next;
    setRows(next);
  }
  function edit(id: string, patch: Partial<ForumBatchRow>) {
    update(id, (row) => ({ ...row, ...patch, revision: row.revision + 1, nda_confirmed: false, ndaReviewId: null, error: "", message: patch.message ?? "" }));
  }
  function current(id: string, token: string) {
    const row = rowsRef.current[id];
    return mounted.current && row?.selected && forumBatchAsyncToken(row) === token ? row : null;
  }

  async function load(member: ForumInviteMember) {
    const initial = forumBatchRow(member, ++epoch.current);
    put(initial);
    const token = forumBatchAsyncToken(initial);
    try {
      if (preview) {
        const fields = invitationNdaFormValues(member, []);
        update(member.id, (row) => ({ ...row, loading: false, loaded: true, ...fields, error: "Sign in to load and save this recipient’s stored verification record." }));
        return;
      }
      const detail = await getInvitationNda({ data: { member_id: member.id } });
      if (!current(member.id, token)) return;
      const canonical = { ...member, ...detail.member } as ForumInviteMember;
      const fields = invitationNdaFormValues(canonical, detail.evidenceOptions);
      update(member.id, (row) => ({ ...row, member: canonical, loading: false, loaded: true,
        why_you: canonical.why_you ?? "", linkedin_url: canonical.linkedin_url ?? "", ...fields,
        ndaReviewId: null, eligibilityProblem: detail.eligibilityProblem, error: "", needsReload: false }));
    } catch (error) {
      if (current(member.id, token)) update(member.id, (row) => ({ ...row, loading: false, error: userFacingError(error, "The stored recipient record could not be loaded.") }));
    }
  }

  async function generate(id: string) {
    const row = rowsRef.current[id];
    if (!row?.selected || !row.loaded || row.deliveryAttempted) return;
    const token = forumBatchAsyncToken(row);
    try {
      const result = await (preview ? draftWhyYouPreview : draftWhyYou)({ data: {
        first_name: row.member.first_name, last_name: row.member.last_name,
        organization: row.member.organization ?? "", title: row.member.title ?? "",
        entity: row.member.entity as "prsc" | "dis" | "both", role: row.member.role,
        is_candidate: true, intended_designation: readIntendedDesignation(row.member),
        linkedin_url: row.linkedin_url, background: row.background,
      } }) as { draft: string; source?: DraftSource };
      if (!current(id, token)) return;
      const source = result.source?.kind === "administrator_background" ? "Drafted from supplied details and administrator-supplied background."
        : row.linkedin_url ? `Drafted from supplied details with profile-link reference: ${row.linkedin_url}` : "Drafted from supplied name, title and organization.";
      edit(id, { why_you: result.draft, source, message: "Draft ready. Review and save this note before reviewing the NDA." });
    } catch (error) {
      if (current(id, token)) update(id, (value) => ({ ...value, error: userFacingError(error, "This recipient’s note could not be drafted.") }));
    }
  }

  async function draftOne(id: string) {
    if (!beginBusy(`draft:${id}`)) return;
    try { await generate(id); } finally { endBusy(); }
  }
  async function draftSelected() {
    if (!beginBusy("draft-batch")) return;
    const targets = Object.values(rowsRef.current).filter((row) => row.selected && row.loaded && !row.deliveryAttempted && !invitationNoteReady(row.why_you));
    setMessage("");
    try {
      for (const [index, row] of targets.entries()) {
        if (!mounted.current) break;
        setMessage(`Drafting selected note ${index + 1} of ${targets.length}.`);
        await generate(row.member.id);
      }
      if (mounted.current) setMessage("Drafting finished. Review each result or source error, then save the notes. No invitations were sent.");
    } finally { endBusy(); }
  }

  async function saveNotes(id: string) {
    const row = rowsRef.current[id];
    if (!row || preview || !beginBusy(`notes:${id}`)) return;
    const token = forumBatchAsyncToken(row);
    try {
      const input = saveMemberInvitationNotesSchema.parse({ member_id: id, expected_updated_at: row.member.updated_at,
        why_you: row.why_you, linkedin_url: row.linkedin_url });
      const saved = await saveMemberInvitationNotes({ data: input });
      if (!current(id, token)) return;
      update(id, (value) => ({ ...value, member: { ...value.member, why_you: saved.why_you, linkedin_url: saved.linkedin_url, updated_at: saved.updated_at },
        why_you: saved.why_you, linkedin_url: saved.linkedin_url ?? "", nda_confirmed: false, ndaReviewId: null,
        revision: value.revision + 1, error: "", message: "Note and LinkedIn source saved. Review and confirm this recipient’s NDA next." }));
      onSaved();
    } catch (error) {
      if (current(id, token)) update(id, (value) => ({ ...value, nda_confirmed: false, ndaReviewId: null, error: userFacingError(error, "The note could not be saved. Reload this recipient’s record and try again.") }));
    } finally { endBusy(); }
  }

  async function saveNda(id: string) {
    const row = rowsRef.current[id];
    if (preview || !row?.nda_confirmed || !forumBatchNotesSaved(row) || !row.nda_entities || !beginBusy(`nda:${id}`)) return;
    const token = forumBatchAsyncToken(row);
    try {
      const saved = await saveInvitationNdaVerification({ data: { member_id: id, expected_updated_at: row.member.updated_at,
        reference: row.nda_reference, entities: row.nda_entities, scope: row.nda_scope, confirmed: true } });
      if (!current(id, token)) return;
      update(id, (value) => ({ ...value, member: { ...value.member, ...saved.member },
        nda_reference: saved.member.nda_reference ?? "", nda_entities: saved.member.nda_entities ?? "", nda_scope: saved.member.nda_scope ?? "",
        nda_confirmed: true, ndaReviewId: saved.reviewId, eligibilityProblem: saved.eligibilityProblem, revision: value.revision + 1,
        error: "", message: saved.eligibilityProblem ? "Review saved; the NDA still needs verification before invitation." : "This recipient’s NDA review was saved." }));
      onSaved();
    } catch (error) {
      if (current(id, token)) update(id, (value) => ({ ...value, nda_confirmed: false, ndaReviewId: null, error: userFacingError(error, "The NDA review could not be saved. Reload this recipient’s stored details.") }));
    } finally { endBusy(); }
  }

  async function sendReviewed() {
    if (preview || busyRef.current) return;
    const targets = Object.values(rowsRef.current).filter((row) => !forumBatchReadyProblem(row));
    if (!targets.length || !beginBusy("send-batch")) return;
    setMessage("");
    let sent = 0, failed = 0;
    try {
      for (const target of targets) {
        if (!mounted.current) break;
        const id = target.member.id;
        const token = forumBatchAsyncToken(target);
        try {
          // Reload once immediately before delivery: another administrator may have edited the saved note or designation.
          const detail = await getInvitationNda({ data: { member_id: id } });
          const row = current(id, token);
          if (!row) continue;
          if (detail.member.updated_at !== row.member.updated_at || detail.member.email !== row.member.email || detail.eligibilityProblem) {
            update(id, (value) => ({ ...value, nda_confirmed: false, ndaReviewId: null, needsReload: true,
              error: "This recipient’s stored record changed or is no longer eligible. Reload and review again; no invitation was sent." }));
            failed += 1; continue;
          }
          const payload = forumBatchInvitationPayload(row);
          update(id, (value) => ({ ...value, deliveryAttempted: true, error: "", message: "Sending the reviewed invitation…" }));
          await invitePortalMember({ data: payload });
          sent += 1;
          update(id, (value) => ({ ...value, sent: true, selected: false, message: "Invitation sent. This row is locked against another send in this session." }));
        } catch (error) {
          failed += 1;
          update(id, (value) => ({ ...value, error: userFacingError(error, "The invitation could not be completed.") + (value.deliveryAttempted ? " Check invitation history before any further attempt." : ""), message: "" }));
        }
      }
      if (mounted.current) { setMessage(`${sent} invitation${sent === 1 ? "" : "s"} sent${failed ? `; ${failed} recipient${failed === 1 ? "" : "s"} need attention` : ""}.`); onSaved(); }
    } finally { endBusy(); }
  }

  const selected = Object.values(rows).filter((row) => row.selected);
  const ready = selected.filter((row) => !forumBatchReadyProblem(row));
  const missingNotes = selected.filter((row) => row.loaded && !row.deliveryAttempted && !invitationNoteReady(row.why_you));
  return <section className="space-y-5 border border-gold/25 bg-navy-light/20 p-5 md:p-7" aria-labelledby="forum-batch-title">
    <div>
      <h2 id="forum-batch-title" className="font-heading text-2xl text-ivory">Prepare saved United Forum invitations</h2>
      <p className="mt-2 text-base leading-7 text-ivory/65">Select saved Forum-only invitees with Entity None. Draft and save each personal note, then review and save each recipient’s own NDA. Only the final send button delivers invitations.</p>
      {preview && <p className="mt-2 text-sm text-gold">Preview: sign in to save records, verify NDAs, and send invitations.</p>}
    </div>
    {!candidates.length && <p className="text-base text-ivory/65">No saved Forum-only invitees are available. Save the roster first, with invitations turned off.</p>}
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" disabled={!!busy || !missingNotes.length} onClick={() => void draftSelected()} className="rounded-none">Generate from AI ({missingNotes.length} missing notes)</Button>
      <span className="text-sm text-ivory/60">{selected.length} selected · {ready.length} reviewed and ready</span>
    </div>
    <div className="space-y-4">
      {candidates.map((member) => {
        const row = rows[member.id];
        const active = Boolean(row?.selected || row?.deliveryAttempted);
        const disabled = !!busy || Boolean(row?.loading || row?.deliveryAttempted);
        const savedNotes = row ? forumBatchNotesSaved(row) : false;
        const problem = row ? forumBatchReadyProblem(row) : null;
        return <article key={member.id} className="border border-gold/20 p-4">
          <label className="flex items-start gap-3 text-base text-ivory">
            <input type="checkbox" checked={Boolean(row?.selected)} disabled={!!busy || Boolean(row?.deliveryAttempted)} className="mt-1 h-4 w-4 accent-[#d4af37]" onChange={(event) => {
              if (event.target.checked) void load(member);
              else update(member.id, (value) => ({ ...value, selected: false, epoch: ++epoch.current, nda_confirmed: false, ndaReviewId: null }));
            }} />
            <span><strong>{member.first_name} {member.last_name}</strong><span className="block text-sm text-ivory/60">{member.email} · United Forum invitee · Entity None</span></span>
          </label>
          {active && row && <div className="mt-4 space-y-4">
            {row.loading ? <p role="status" className="text-sm text-gold">Loading this recipient’s stored information…</p> : row.loaded && <>
              <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
                <label className="block text-base text-ivory/80">Public LinkedIn profile URL
                  <Input value={row.linkedin_url} maxLength={300} onChange={(event) => edit(member.id, { linkedin_url: event.target.value, source: "" })} className="mt-1 text-base" placeholder="https://www.linkedin.com/in/…" />
                </label>
                <label className="block text-base text-ivory/80">Optional supplied background · not saved
                  <Textarea value={row.background} maxLength={8000} onChange={(event) => edit(member.id, { background: event.target.value, source: "" })} className="mt-1 text-base" placeholder="Optional: paste this person’s LinkedIn About / Experience text for a more detailed draft." />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void draftOne(member.id)} className="rounded-none">{row.why_you.trim() ? "Regenerate from AI" : "Generate from AI"}</Button>
                </div>
                {row.source && <p className="break-words text-sm text-ivory/60">{row.source}</p>}
                <label className="block text-base text-ivory/80">Why you · review before saving
                  <Textarea value={row.why_you} maxLength={2000} rows={5} onChange={(event) => edit(member.id, { why_you: event.target.value })} className="mt-1 text-base" />
                </label>
                <p className="text-sm text-ivory/60">A blank note can be saved while preparing the roster. Invitations require at least 20 characters.</p>
                <Button type="button" disabled={preview} onClick={() => void saveNotes(member.id)} className="rounded-none">Save reviewed note and LinkedIn source</Button>
                <span className="ml-3 text-sm text-ivory/60">{savedNotes ? "Current note and source are saved." : "Unsaved note or source changes."}</span>
              </fieldset>
              <fieldset disabled={disabled} className="space-y-3 border-t border-gold/15 pt-4 disabled:opacity-60">
                <legend className="pt-4 text-base text-ivory">Recipient-specific NDA · {row.ndaReviewId && !row.eligibilityProblem ? "Review saved" : "Needs Verification"}</legend>
                {row.member.nda_verified_at && <p className="text-sm text-ivory/60">Stored verification: {row.member.nda_verified_at} · Reviewer: {row.member.nda_verified_by || "Not recorded"}</p>}
                <label className="block text-base text-ivory/80">Executed NDA reference
                  <Input value={row.nda_reference} maxLength={400} onChange={(event) => edit(member.id, { nda_reference: event.target.value })} className="mt-1 text-base" />
                </label>
                <label className="block text-base text-ivory/80">NDA entity coverage
                  <select value={row.nda_entities} onChange={(event) => edit(member.id, { nda_entities: event.target.value as ForumBatchRow["nda_entities"] })} className="mt-1 h-10 w-full rounded-md border border-input bg-navy px-3 text-base">
                    <option value="">Needs Verification</option><option value="prsc">PRSC</option><option value="dis">DIS</option><option value="both">Both</option>
                  </select>
                </label>
                <label className="block text-base text-ivory/80">Executed NDA scope
                  <Textarea value={row.nda_scope} maxLength={600} onChange={(event) => edit(member.id, { nda_scope: event.target.value })} className="mt-1 text-base" />
                </label>
                <label className="flex items-start gap-3 text-base text-ivory/80">
                  <input type="checkbox" checked={row.nda_confirmed} disabled={!savedNotes || preview} onChange={(event) => {
                    edit(member.id, {});
                    update(member.id, (value) => ({ ...value, nda_confirmed: event.target.checked }));
                  }} className="mt-1 h-4 w-4 accent-[#d4af37]" />
                  <span>I reviewed the executed NDA and verified that it applies to {row.member.first_name} {row.member.last_name} ({row.member.email}) and this intended Forum invitation.</span>
                </label>
                {!savedNotes && <p className="text-sm text-gold">Save the note and source before confirming this NDA review.</p>}
                {row.eligibilityProblem && <p className="text-sm text-gold">Needs Verification: {row.eligibilityProblem}</p>}
                <Button type="button" disabled={preview || !savedNotes || !row.nda_confirmed || !row.nda_entities || row.nda_reference.trim().length < 3 || row.nda_scope.trim().length < 3} onClick={() => void saveNda(member.id)} className="rounded-none">Save this recipient’s NDA review</Button>
              </fieldset>
              <Button type="button" variant="ghost" disabled={disabled} onClick={() => void load(row.member)} className="rounded-none">Reload stored record · clears unsaved edits</Button>
              {problem && !row.deliveryAttempted && <p className="text-sm text-ivory/60">Before invitation: {problem}</p>}
            </>}
            {!row.loaded && !row.loading && <Button type="button" variant="outline" disabled={!!busy} onClick={() => void load(member)} className="rounded-none">Reload stored record</Button>}
            {row.message && <p role="status" className="text-sm text-gold">{row.message}</p>}
            {row.error && <p role="alert" className="text-sm text-red-300">{row.error}</p>}
          </div>}
        </article>;
      })}
    </div>
    <div className="space-y-2 border-t border-gold/20 pt-4">
      <p className="text-sm text-ivory/65">This sends only the {ready.length} selected recipients whose saved notes and individual NDA reviews are ready. {selected.length - ready.length > 0 ? `${selected.length - ready.length} selected recipients still need attention and will be skipped.` : ""}</p>
      <Button type="button" disabled={preview || !!busy || !ready.length} onClick={() => void sendReviewed()} className="rounded-none bg-gold text-navy hover:bg-gold-light">{busy === "send-batch" ? "Sending reviewed invitations…" : `Send ${ready.length} reviewed Forum invitation${ready.length === 1 ? "" : "s"}`}</Button>
      {message && <p role="status" className="text-sm text-gold">{message}</p>}
    </div>
  </section>;
}
