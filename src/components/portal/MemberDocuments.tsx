import { userFacingError } from "@/lib/user-facing-error";
import { usePrivateMedia } from "@/hooks/use-private-media";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Check, Lock, Mail } from "lucide-react";
import { STAGES, isOnboarding, lockedDocumentIds, lockReasonFor } from "@/lib/journey";
import { UNAVAILABLE_HELP, UNAVAILABLE_LABEL, type UnavailableNotice, type UnavailableReason } from "@/lib/document-availability";
import { documentProgress } from "@/lib/document-progress";
import { PROFILE_ENCOURAGEMENT, profileLinkLabel } from "@/lib/profile-encouragement";
import type { SigningUiState } from "@/lib/boldsign-records";

import { acknowledgeDocument, requestHardCopy } from "@/lib/portal.functions";
import { openBoldSign, refreshBoldSignStatus } from "@/lib/boldsign.functions";
import { Button } from "@/components/ui/button";
import { fetchPrivateFile } from "@/lib/private-file-client";

type Doc = {
  id: string;
  category: "sign" | "read";
  action: string;
  title: string;
  description: string;
  url: string | null;
  journey_stage: number | null;
  journey_track: "shared" | "prsc" | "dis" | null;
  sort_order: number;
  created_at: string;
  forum_role?: string | null;
  /** False when no approved signing request or administrator-recorded BoldSign document exists yet. */
  signing_ready?: boolean;
};
type Completion = { document_id: string; kind: string; signed_name: string | null; acknowledged_at: string };

type Props = {
  documents: Doc[]; completions: Completion[]; entity: string; forum?: boolean; forumOnly?: boolean; forumCleared?: boolean; entityReleased?: { prsc: boolean; dis: boolean };
  /** Safe reasons for what is not available yet (generic labels only). */
  unavailable?: UnavailableNotice[];
  signing?: { document_id: string; state: SigningUiState }[];
  profileComplete?: boolean;
};

const TRACK_LABEL = { shared: "Shared Forum", prsc: "PRSC", dis: "DIS" } as const;

function Unavailable({ reason, label }: { reason: UnavailableReason; label?: string }) {
  return (
    <div>
      {label && <h3 className="font-display text-[19px] leading-snug">{label}</h3>}
      <p className={`${label ? "mt-3" : ""} inline-flex items-center gap-2 text-[13px] font-medium text-gold`}><Lock className="h-4 w-4" /> {UNAVAILABLE_LABEL[reason]}</p>
      <p className="mt-1 text-[13px] leading-6 text-ivory/60">{UNAVAILABLE_HELP[reason]}</p>
    </div>
  );
}

export function MemberDocuments({ documents: all, completions, entity, forum = true, forumOnly = false, forumCleared = true, entityReleased = { prsc: false, dis: false }, unavailable = [], signing = [], profileComplete = false }: Props) {
  const documents = all.filter((d: any) => !d.superseded_at && (forum || d.journey_stage !== 1));
  const history = all.filter((d: any) => d.superseded_at);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = all.find((d) => d.id === openId) ?? null;
  const doneMap = new Map(completions.map((c) => [c.document_id, c]));
  const locked = lockedDocumentIds(documents, new Set(doneMap.keys()), entity, { released: entityReleased, forum });
  const s1 = documents.filter((d) => d.journey_stage === 1);
  const awaitingClearance = !forumCleared && s1.length > 0 && s1.every((d) => doneMap.has(d.id));
  const onboarding = documents.filter(isOnboarding);
  const ongoing = documents.filter((d) => !isOnboarding(d));
  const signingByDoc = new Map(signing.map((s) => [s.document_id, s.state]));
  // The count covers required journey actions only. Reference files, one-off records and historical
  // records are listed separately below and never change it.
  const progress = documentProgress(documents, history, new Set(doneMap.keys()));

  if (open) return <DocumentReader doc={open} completion={doneMap.get(open.id) ?? null} onBack={() => setOpenId(null)} />;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-gold/20 bg-ivory/[.03] px-5 py-4">
        <p className="text-[15px] text-ivory/75">
          Your required actions open one at a time. Complete each one and the next opens automatically
        </p>
        <div className="text-right">
          {progress.requiredLabel && <p className="text-[12px] uppercase tracking-[0.2em] text-gold">{progress.requiredLabel}</p>}
          {progress.alsoShownLabel && <p className="mt-1 text-[12px] text-ivory/55">{progress.alsoShownLabel}</p>}
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-6 text-ivory/65">
        {PROFILE_ENCOURAGEMENT}{" "}
        <Link to="/portal/profile" className="whitespace-nowrap text-gold underline underline-offset-4 hover:text-ivory">{profileLinkLabel(profileComplete)} →</Link>
      </p>
      {awaitingClearance && (
        <p className="mt-4 border border-gold/30 px-5 py-3 text-[14px] text-gold">Your Forum preparation is complete. Your clearance is now with the Secretariat for review{forumOnly ? "." : ", and we'll email you when the next stage opens"}</p>
      )}
      {STAGES.slice(0, 4).map((stage) => {
        const docs = onboarding.filter((d) => d.journey_stage === stage.n);
        if (!docs.length) return null;
        return (
          <div key={stage.n} className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Stage {forum ? stage.n : stage.n - 1} · {stage.label}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {docs.map((d) => <DocCard key={d.id} d={d} done={doneMap.get(d.id)} lockReason={locked.has(d.id) ? lockReasonFor(d, entity, entityReleased) : undefined} signingState={signingByDoc.get(d.id)} onOpen={setOpenId} />)}
            </div>
          </div>
        );
      })}
      {unavailable.length > 0 && (
        <div className="mt-10 border-t border-gold/20 pt-8">
          <div className="flex items-center gap-3">
            <Lock className="h-[18px] w-[18px] text-gold" />
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Not Available Yet</p>
          </div>
          <p className="mt-2 text-[14px] text-ivory/55">These are expected for you. Titles and contents of confidential items stay hidden until they open</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {unavailable.map((n) => <div key={n.key} className="border border-gold/20 bg-ivory/[.03] p-5 opacity-80"><Unavailable reason={n.reason} label={n.label} /></div>)}
          </div>
        </div>
      )}
      {ongoing.length > 0 && (
        <div className="mt-10 border-t border-gold/20 pt-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-[18px] w-[18px] text-gold" />
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Reference Files & One-Off Records</p>
          </div>
          <p className="mt-2 text-[14px] text-ivory/55">These are not counted in your required actions</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {ongoing.map((d) => <DocCard key={d.id} d={d} done={doneMap.get(d.id)} signingState={signingByDoc.get(d.id)} onOpen={setOpenId} />)}
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-10 border-t border-gold/20 pt-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Historical & Test Records</p>
          <p className="mt-2 text-[14px] text-ivory/55">Earlier versions and test records you completed, kept for your audit history. They are not part of your current requirements</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {history.map((d) => <DocCard key={d.id} d={d} done={doneMap.get(d.id)} signingState={signingByDoc.get(d.id)} onOpen={setOpenId} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function DocCard({ d, done, lockReason, signingState, onOpen }: { d: Doc; done?: Completion; lockReason?: "not_released" | "prior_action"; signingState?: SigningUiState; onOpen: (id: string) => void }) {
  const locked = Boolean(lockReason);
  return (
    <div className={`border border-gold/20 bg-ivory/[.03] p-5 ${locked ? "opacity-55" : ""}`}>
      {d.journey_track && <p className="text-[10px] uppercase tracking-[0.2em] text-ivory/45">{TRACK_LABEL[d.journey_track]}</p>}
      <h3 className="mt-1 font-display text-[19px] leading-snug">{d.title}</h3>
      {d.description && <p className="mt-2 text-[14px] leading-6 text-ivory/60">{d.description}</p>}
      {done && (
        <p className="mt-4 inline-flex items-center gap-2 text-[13px] text-gold">
          <Check className="h-4 w-4" /> {done.kind === "signed" ? "Signed" : done.kind === "external_confirmed" ? "Confirmed" : "Acknowledged"} on {new Date(done.acknowledged_at).toLocaleDateString()}
        </p>
      )}
      <div className="mt-4">
        {lockReason ? (
          <Unavailable reason={lockReason} />
        ) : (d.action === "boldsign" || d.action === "docusign") && !done && d.signing_ready === false && (!signingState || signingState === "none") ? (
          <Unavailable reason="awaiting_approved" />
        ) : d.action === "boldsign" || d.action === "docusign" ? (
          <BoldSignReader documentId={d.id} title={d.title} completed={!!done} signingState={signingState ?? "none"} isConflict={d.forum_role === "conflict"} />
        ) : (
          <button type="button" onClick={() => onOpen(d.id)} className="cta-glow-outline inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-[13px] transition-all">
            <span className="relative z-10 flex items-center gap-3">
              {done ? "View document" : d.category === "sign" ? "Read & sign" : "Read & acknowledge"} <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function BoldSignReader({ documentId, title, completed, signingState = "none", isConflict = false }: { documentId: string; title: string; completed: boolean; signingState?: SigningUiState; isConflict?: boolean }) {
  const [url, setUrl] = useState("");
  const [answer, setAnswer] = useState<"" | "none" | "changed" | "unsure">("");
  const [details, setDetails] = useState("");
  const client = useQueryClient();
  const refreshDocuments = () => client.invalidateQueries({ queryKey: ["my-documents"] });
  // Re-checks the signature with BoldSign itself (never trusted from the browser), then reloads the list.
  const refresh = useMutation({ mutationFn: () => refreshBoldSignStatus({ data: { document_id: documentId } }), onSettled: () => { void refreshDocuments(); } });
  const open = useMutation({
    mutationFn: () => openBoldSign({ data: { document_id: documentId, ...(isConflict && answer ? { disclosures: { conflict_answer: answer, conflict_details: details.trim() } } : {}) } }),
    onSuccess: result => { if (result.url) setUrl(result.url); else void refreshDocuments(); },
  });
  // Signed by this member but BoldSign has not completed the whole document (for example a required
  // countersignature is outstanding): it is not complete, and it cannot be opened for signing again.
  const awaiting = !completed && (signingState === "signed_awaiting" || (open.data && !open.data.url && open.data.state === "signed_awaiting"));
  const answersReady = !isConflict || completed || (answer !== "" && (answer === "none" || details.trim().length > 2));
  const evidence = useMutation({ mutationFn: async () => {
    const file = await fetchPrivateFile(`/api/public/portal-file?kind=executed&id=${documentId}`);
    const objectUrl = URL.createObjectURL(file); setUrl(objectUrl);
  } });
  useEffect(() => () => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); }, [url]);
  // The signing frame reports back when BoldSign sends the signer to /portal?signed=1: close it and re-check the signature with BoldSign.
  useEffect(() => {
    if (!url || url.startsWith("blob:")) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || (e.data as { type?: string } | null)?.type !== "prsc-boldsign-done") return;
      setUrl("");
      refresh.mutate();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>
    {isConflict && !completed && <div className="mb-4 space-y-2">
      <p className="text-sm text-ivory/70">Your answers are placed into the document you sign and kept with the signed record.</p>
      {([["none", "No conflict"], ["changed", "New or changed conflict"], ["unsure", "Unsure, please review"]] as const).map(([v, l]) => (
        <label key={v} className="flex items-center gap-2 text-base text-ivory/85"><input type="radio" name={`bs-conflict-${documentId}`} checked={answer === v} onChange={() => setAnswer(v)} className="h-4 w-4" /> {l}</label>
      ))}
      {answer && answer !== "none" && <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Please describe the conflict or question" className="w-full border border-gold/30 bg-transparent p-3 text-[16px] text-ivory outline-none focus:border-gold" />}
    </div>}
    {awaiting ? (
      <div className="space-y-3">
        <p className="text-[14px] leading-6 text-gold">You have signed this document. It will show as complete once BoldSign confirms every required signature. Nothing more is needed from you.</p>
        <Button type="button" variant="outline" disabled={refresh.isPending} onClick={() => refresh.mutate()}>{refresh.isPending ? "Checking…" : "Refresh status"}</Button>
        {refresh.error && <p className="text-sm text-gold">{userFacingError(refresh.error, "The status could not be refreshed. Please try again.")}</p>}
      </div>
    ) : (
      <Button type="button" variant="outline" disabled={open.isPending || evidence.isPending || !answersReady} onClick={() => completed ? evidence.mutate() : open.mutate()}><BookOpen className="h-4 w-4" /> {open.isPending || evidence.isPending ? "Opening…" : completed ? "View executed document" : signingState === "in_progress" ? "Continue signing" : "Review and Sign"}</Button>
    )}
    {open.error && <p className="mt-3 text-sm text-gold">{userFacingError(open.error, "The signing document could not be opened. Please try again.")}</p>}
    {evidence.error && <p className="mt-3 text-sm text-gold">{userFacingError(evidence.error, "The executed document could not be opened. Please try again.")}</p>}
    {url && <div role="dialog" aria-modal="true" aria-label={`Sign ${title}`} className="fixed inset-0 z-50 flex flex-col bg-navy-deep p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-xl">{title}</h3><a href={url} target="_blank" rel="noreferrer" className="text-gold underline">Open signing in a new tab</a><Button variant="outline" onClick={() => { setUrl(""); refresh.mutate(); }}>Return to Welcome Center</Button></div>
      <iframe src={url} title={`BoldSign: ${title}`} className="min-h-0 flex-1 border border-border bg-background" />
    </div>}
  </>;
}

function DocumentReader({ doc, completion, onBack }: { doc: Doc; completion: Completion | null; onBack: () => void }) {
  const queryClient = useQueryClient();
  const documentUrl = usePrivateMedia(doc.url);
  const [readConfirmed, setReadConfirmed] = useState(false);
  const [initials, setInitials] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [hardCopy, setHardCopy] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const isSign = doc.category === "sign";
  const isConflict = /conflict|recusal/i.test(doc.title);
  const [conflict, setConflict] = useState<"" | "none" | "changed" | "unsure">("");
  const [conflictDetails, setConflictDetails] = useState("");
  const conflictFields = isConflict ? { conflict_answer: conflict || undefined, conflict_details: conflictDetails.trim() || undefined } : {};

  const complete = useMutation({
    mutationFn: () =>
      acknowledgeDocument({
        data: isSign
          ? { document_id: doc.id, initials, kind: "signed", signed_name: name, signature_data: signature ?? undefined, consent, ...conflictFields }
          : { document_id: doc.id, initials, kind: "acknowledged", consent: true, ...conflictFields },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-session"] }),
      ]);
    },
  });

  async function askHardCopy() {
    setHardCopy("sending");
    try {
      await requestHardCopy({ data: { document_id: doc.id, note: "" } });
      setHardCopy("sent");
    } catch {
      setHardCopy("error");
    }
  }

  const canSubmit = readConfirmed && initials.trim().length > 0 && (!isSign || (name.trim().length > 1 && signature && consent)) && (!isConflict || (conflict !== "" && (conflict === "none" || conflictDetails.trim().length > 0)));

  return (
    <div className="mt-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-gold hover:text-ivory">
        <ArrowLeft className="h-4 w-4" /> All documents
      </button>
      <h3 className="mt-4 font-display text-[26px] leading-snug">{doc.title}</h3>
      {doc.description && <p className="mt-2 text-[14px] leading-6 text-ivory/60">{doc.description}</p>}

      <div className="mt-5 h-[60vh] border border-gold/25 bg-ivory" onContextMenu={(e) => e.preventDefault()}>
        {documentUrl ? (
          <iframe title={doc.title} src={`${documentUrl}#toolbar=0&navpanes=0`} className="h-full w-full" />
        ) : (
          <p className="p-6 text-navy-deep">This document is not available right now.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={askHardCopy} disabled={hardCopy === "sending" || hardCopy === "sent"} className="inline-flex items-center gap-2 text-[13px] text-ivory/70 underline-offset-4 hover:text-gold hover:underline disabled:opacity-60">
          <Mail className="h-4 w-4" /> Request a hard copy
        </button>
        {hardCopy === "sent" && <span className="text-[13px] text-gold">Request sent — we'll send you a hard copy.</span>}
        {hardCopy === "error" && <span className="text-[13px] text-gold">The request could not be sent. Please try again.</span>}
      </div>

      {completion ? (
        <p className="mt-6 inline-flex items-center gap-2 border border-gold/30 px-5 py-3 text-[14px] text-gold">
          <Check className="h-4 w-4" />
          {completion.kind === "signed" ? `Signed by ${completion.signed_name ?? "you"}` : "Acknowledged"} on {new Date(completion.acknowledged_at).toLocaleString()}
        </p>
      ) : (
        <div className="mt-6 space-y-5 border border-gold/20 bg-ivory/[.03] p-5">
          <label className="flex items-start gap-3 text-[15px] text-ivory/80">
            <input type="checkbox" checked={readConfirmed} onChange={(e) => setReadConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--color-gold)]" />
            I have read this document in full.
          </label>
          {isConflict && (
            <fieldset className="space-y-2">
              <legend className="text-[14px] text-ivory/70">Your conflict / recusal answer</legend>
              {([["none", "No conflict"], ["changed", "New or changed conflict"], ["unsure", "Unsure, please review"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-3 text-[15px] text-ivory/80">
                  <input type="radio" name="conflict" checked={conflict === v} onChange={() => setConflict(v)} className="h-4 w-4" /> {l}
                </label>
              ))}
              {conflict && conflict !== "none" && (
                <textarea value={conflictDetails} onChange={(e) => setConflictDetails(e.target.value)} rows={3} placeholder="Please describe the conflict or question" className="w-full border border-gold/30 bg-transparent p-3 text-[16px] text-ivory outline-none focus:border-gold" />
              )}
              <p className="text-[13px] text-ivory/55">The Secretariat reviews every confirmation before Forum clearance</p>
            </fieldset>
          )}
          {isSign && (
            <>
              <label className="block text-[14px] text-ivory/70">
                Full legal name
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full border border-gold/30 bg-transparent px-3 text-[16px] text-ivory outline-none focus:border-gold" />
              </label>
              <div>
                <p className="text-[14px] text-ivory/70">Signature</p>
                <SignaturePad onChange={setSignature} />
              </div>
            </>
          )}
          <label className="block text-[14px] text-ivory/70">
            Initials
            <input value={initials} onChange={(e) => setInitials(e.target.value.slice(0, 8))} className="mt-1 h-11 w-32 border border-gold/30 bg-transparent px-3 text-[16px] uppercase tracking-[0.18em] text-ivory outline-none focus:border-gold" />
          </label>
          {isSign && (
            <label className="flex items-start gap-3 text-[14px] leading-6 text-ivory/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
              I agree to sign this document electronically. My electronic signature has the same effect as my handwritten signature. The date, time, and device used are recorded.
            </label>
          )}
          <button type="button" disabled={!canSubmit || complete.isPending} onClick={() => complete.mutate()} className="cta-glow inline-flex items-center gap-3 rounded-full px-7 py-3 text-[15px] font-semibold transition-all disabled:opacity-40">
            <span className="relative z-10">{complete.isPending ? "Saving…" : isSign ? "Sign document" : "Confirm I have read this"}</span>
          </button>
          {complete.error && <p className="text-[14px] text-gold">{userFacingError(complete.error, "Something went wrong.")}</p>}
        </div>
      )}
    </div>
  );
}

function SignaturePad({ onChange }: { onChange: (data: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0A1322";
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  return (
    <div className="mt-1">
      <canvas
        ref={ref}
        className="h-36 w-full touch-none border border-gold/30 bg-ivory"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const p = point(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          dirty.current = true;
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          if (dirty.current) onChange(e.currentTarget.toDataURL("image/png"));
        }}
      />
      <button
        type="button"
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          dirty.current = false;
          onChange(null);
        }}
        className="mt-2 text-[12px] uppercase tracking-[0.18em] text-ivory/55 hover:text-gold"
      >
        Clear signature
      </button>
    </div>
  );
}
