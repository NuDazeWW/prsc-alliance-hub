import { usePrivateMedia } from "@/hooks/use-private-media";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MemberMeetings } from "@/components/portal/MemberMeetings";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Save, Sparkles, Upload } from "lucide-react";
import { getMyHeadshotUrl, getMyProfile, getPortalSession, saveMyProfile } from "@/lib/portal.functions";
import { draftMyProfileBio, draftMyProfileBioPreview } from "@/lib/why-you-draft.functions";
import { useHeadshotUpload } from "@/hooks/use-headshot-upload";
import { PortalShell } from "@/components/portal/PortalShell";
import { CommunicationIntake, FitIntake } from "@/components/portal/ProfileIntake";
import { isPreviewHost } from "@/routes/_authenticated/route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PORTAL_PROFILE_STAGES, PORTAL_FIT_TITLE, PORTAL_FIT_DESCRIPTION,
  PORTAL_COMMUNICATION_TITLE, PORTAL_COMMUNICATION_DESCRIPTION,
  communicationReadoutRows, fitReadoutRows, readCommunicationPreferences, readFitAnswers,
} from "@/lib/portal-profile-fields";
import { initialProfileForm, currentProfilePreferences, profileFieldStage, type ProfileForm } from "@/lib/portal-profile-form";
import { profileSchema, profileValidationMessage } from "@/lib/portal-profile-schema";
import { userFacingError } from "@/lib/user-facing-error";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  validateSearch: (q: Record<string, unknown>): { edit?: number } => (q.edit ? { edit: 1 } : {}),
  head: () => ({ meta: [{ title: "Private Profile | PRSC" }, { name: "description", content: "Private member profile for individualized PRSC and DIS materials." }, { name: "robots", content: "noindex,nofollow,noarchive" }, { property: "og:title", content: "Private Profile | PRSC" }, { property: "og:description", content: "Private member profile for individualized PRSC and DIS materials." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["portal-session"], queryFn: () => isPreviewHost() ? Promise.resolve(null) : getPortalSession(), retry: false });
  const profile = useQuery({ queryKey: ["portal-profile"], queryFn: () => isPreviewHost() ? Promise.resolve(null) : getMyProfile(), retry: false });
  const { edit } = Route.useSearch();
  const isSubmitted = Boolean(profile.data?.submitted_at);
  const [form, setForm] = useState<ProfileForm>(() => initialProfileForm());
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const initializedMember = useRef<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session.isLoading || profile.isLoading || session.isError || profile.isError) return;
    const memberKey = session.data?.member?.id ?? "builder-preview";
    if (initializedMember.current === memberKey) return;
    initializedMember.current = memberKey;
    setForm(initialProfileForm(profile.data, session.data?.member, Boolean(edit)));
  }, [session.data, session.isLoading, session.isError, profile.data, profile.isLoading, profile.isError, edit]);

  const stage = form.current_stage;
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [stage]);
  useEffect(() => { if (stage === 1 && emailError) emailRef.current?.focus(); }, [stage, emailError]);

  function validate(submit = false) {
    const result = profileSchema.safeParse({ ...form, submit, current_stage: submit ? 5 : stage });
    if (result.success) return result.data;
    const issue = result.error.issues[0];
    const targetStage = profileFieldStage(issue?.path ?? []);
    const message = profileValidationMessage(result.error);
    setStatus(message);
    setStatusError(true);
    setEmailError(issue?.path[0] === "preferred_email" ? message : "");
    setForm((current) => ({ ...current, current_stage: targetStage }));
    return null;
  }

  async function save(submit = false) {
    if (saving) return;
    const data = validate(submit);
    if (!data) return;
    setSaving(true);
    setStatusError(false);
    setStatus("Saving…");
    try {
      await saveMyProfile({ data });
      setStatus(submit ? "Profile received. Thank you for sharing your perspective." : isSubmitted ? "Changes saved." : "Progress saved.");
      if (submit) {
        setJustSubmitted(true);
        setForm((current) => ({ ...current, current_stage: 5 }));
      }
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["portal-session"] }), queryClient.invalidateQueries({ queryKey: ["portal-profile"] })]);
    } catch (error) {
      // A first submission can persist even if its subsequent notification fails.
      // A previously submitted record is never proof that a failed edit was saved.
      const refreshed = submit && !isSubmitted ? await profile.refetch().catch(() => null) : null;
      if (refreshed?.data?.submitted_at) {
        setForm((current) => ({ ...current, current_stage: 5 }));
        setJustSubmitted(true);
        setStatus("Profile received. Your submission was saved successfully.");
        await queryClient.invalidateQueries({ queryKey: ["portal-session"] });
      } else {
        const message = userFacingError(error, "Unable to save your profile. Please try again.");
        setStatus(message);
        setStatusError(true);
        if (message.includes("Stage 01")) setForm((current) => ({ ...current, current_stage: 1 }));
        else if (message.includes("Stage 02")) setForm((current) => ({ ...current, current_stage: 2 }));
        else if (message.includes("Stage 03")) setForm((current) => ({ ...current, current_stage: 3 }));
      }
    } finally { setSaving(false); }
  }
  function continueStage() {
    if (!validate()) return;
    setStatus("");
    setStatusError(false);
    setForm((current) => ({ ...current, current_stage: current.current_stage + 1 }));
  }
  function editProfile() {
    setStatus("");
    setJustSubmitted(false);
    setForm((current) => ({ ...currentProfilePreferences(current), current_stage: 1 }));
  }
  if (session.isLoading || profile.isLoading) return <PortalShell><div className="p-20 text-center text-gold">Opening your profile…</div></PortalShell>;
  if (session.isError || profile.isError) return <PortalShell><main className="mx-auto max-w-3xl p-10"><p role="alert" className="text-ivory/75">{userFacingError(session.error ?? profile.error, "We could not open your profile. Please try again.")}</p><Button asChild className="mt-6"><Link to="/portal">Return to Welcome Center</Link></Button></main></PortalShell>;

  return <PortalShell><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-14">
    <Link to="/portal" className="inline-flex items-center gap-2 text-xs uppercase text-ivory/55 hover:text-gold"><ArrowLeft className="h-4 w-4" />Welcome center</Link>
    <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
      <aside>
        <p className="text-xs uppercase text-gold">Private profile</p>
        <h1 className="mt-3 font-display text-4xl">Your perspective, in your words.</h1>
        <p className="mt-4 text-sm leading-6 text-ivory/55">Your private profile helps us understand your background, expertise and interests. It is not shared with other Forum participants and does not constitute an appointment or commitment to serve. You can postpone it and continue meeting availability and released Forum requirements.</p>
        <ol className="mt-6 grid grid-cols-5 gap-1 sm:mt-8 sm:block sm:space-y-3">{PORTAL_PROFILE_STAGES.map((title, index) => <li key={title} aria-current={stage === index + 1 ? "step" : undefined} className={`border-t-2 pt-2 text-center text-[10px] sm:border-l-2 sm:border-t-0 sm:py-1 sm:pl-3 sm:text-left sm:text-sm ${stage === index + 1 ? "border-gold text-gold" : "border-ivory/15 text-ivory/40"}`}><span className="sm:hidden">{String(index + 1).padStart(2, "0")}</span><span className="hidden sm:inline">{String(index + 1).padStart(2, "0")} · {title}</span></li>)}</ol>
      </aside>
      <section className="min-w-0 min-h-[620px] border border-gold/20 bg-ivory/[.025] p-6 sm:p-10 lg:p-14" aria-busy={saving}>
        <fieldset disabled={saving} className="min-w-0">
          {stage === 1 && <>
            <StepTitle n="01" title="Your information" copy="Confirm how we should address and contact you." />
            <HeadshotField />
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <Field label="Preferred name" value={form.preferred_name} maxLength={120} onChange={(preferred_name) => setForm({ ...form, preferred_name })} />
              <Field label="Professional role (optional)" value={form.professional_role} maxLength={160} onChange={(professional_role) => setForm({ ...form, professional_role })} />
              <Field label="Organization (optional)" value={form.current_organization} maxLength={180} onChange={(current_organization) => setForm({ ...form, current_organization })} />
              <Field label="Preferred email" type="email" inputRef={emailRef} error={emailError} value={form.preferred_email} maxLength={200} onChange={(preferred_email) => { setForm({ ...form, preferred_email }); setEmailError(""); }} />
              <Field label="Preferred phone" value={form.preferred_phone} maxLength={40} onChange={(preferred_phone) => setForm({ ...form, preferred_phone })} />
            </div>
            <BioDraft form={form} onUse={(bio) => setForm((current) => ({ ...current, bio }))} />
            <label className="mt-5 block text-xs uppercase text-ivory/55">Short bio <span className="normal-case text-ivory/40">(private draft; any use requires your approval)</span><Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength={3000} className="mt-2 min-h-28 border-ivory/20 normal-case text-ivory" /></label>
          </>}
          {stage === 2 && <><StepTitle n="02" title={PORTAL_FIT_TITLE} copy={PORTAL_FIT_DESCRIPTION} /><FitIntake value={readFitAnswers(form.experience_answers)} onChange={(answers) => setForm({ ...form, experience_answers: { ...form.experience_answers, ...answers } })} /></>}
          {stage === 3 && <><StepTitle n="03" title={PORTAL_COMMUNICATION_TITLE} copy={PORTAL_COMMUNICATION_DESCRIPTION} /><CommunicationIntake value={readCommunicationPreferences(form.visibility_instructions)} onChange={(preferences) => setForm({ ...form, visibility_instructions: { ...form.visibility_instructions, ...preferences } })} /></>}
          {stage === 4 && <>
            <StepTitle n="04" title="Final details" copy="Share any additional interests or questions. Sensitive conflict disclosures belong in your separate Conflict / Recusal Confirmation, not in this profile." />
            <label className="mt-10 block text-sm text-ivory/75">Package considerations<Textarea value={form.final_notes} maxLength={3000} onChange={(event) => setForm({ ...form, final_notes: event.target.value })} className="mt-3 min-h-32 border-ivory/20 text-ivory" /></label>
            <label className="mt-7 block text-sm text-ivory/75">Questions for the team<Textarea value={form.questions} maxLength={3000} onChange={(event) => setForm({ ...form, questions: event.target.value })} className="mt-3 min-h-32 border-ivory/20 text-ivory" /></label>
            <label className="mt-7 flex items-start gap-3 text-sm text-ivory/70"><input type="checkbox" checked={form.contact_requested} onChange={(event) => setForm({ ...form, contact_requested: event.target.checked })} className="mt-1 accent-gold" />I would like a member of the team to contact me.</label>
          </>}
          {stage === 5 && (justSubmitted ? <ReceivedConfirmation /> : <SubmittedProfileReview form={form} onEdit={editProfile} />)}
        </fieldset>
        {status && <p role={statusError ? "alert" : "status"} className={`mt-8 border-l-2 pl-3 text-sm ${statusError ? "border-rose-300 text-rose-200" : "border-gold text-ivory/65"}`}>{status}</p>}
        {stage < 5 && <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-gold/15 pt-7">
          <Button variant="ghost" disabled={stage === 1 || saving} onClick={() => { setStatus(""); setForm({ ...form, current_stage: stage - 1 }); }} className="text-ivory"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <div className="flex gap-3">
            <Button variant="outline" disabled={saving} onClick={() => void save(false)} className="rounded-none border-ivory/25 bg-ivory text-black hover:bg-ivory/90"><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save"}</Button>
            {stage < 4 ? <Button disabled={saving} onClick={continueStage} className="rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button disabled={saving} onClick={() => void save(!isSubmitted)} className="rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy">{saving ? isSubmitted ? "Saving…" : "Submitting…" : isSubmitted ? "Save changes" : "Submit profile"}<Check className="ml-2 h-4 w-4" /></Button>}
          </div>
        </div>}
      </section>
    </div>
  </main></PortalShell>;
}

function BioDraft({ form, onUse }: { form: ProfileForm; onUse: (bio: string) => void }) {
  const [open, setOpen] = useState(false);
  const [linkedin, setLinkedin] = useState("");
  const [background, setBackground] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function generate() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await (isPreviewHost() ? draftMyProfileBioPreview : draftMyProfileBio)({ data: { preferred_name: form.preferred_name, professional_role: form.professional_role, current_organization: form.current_organization, linkedin_url: linkedin, background } });
      setDraft(result.draft);
    } catch (error) { setMessage(userFacingError(error, "We could not draft your bio. Please try again or write it below.")); }
    finally { setBusy(false); }
  }
  return <div className="mt-8">
    <Button type="button" variant="outline" aria-expanded={open} onClick={() => setOpen(!open)} className="h-auto min-h-11 whitespace-normal rounded-none border-gold/40 text-gold hover:bg-gold/10"><Sparkles className="mr-2 h-4 w-4 shrink-0" />Draft “Why You” with AI</Button>
    {open && <div className="mt-4 space-y-4 border border-gold/20 bg-navy/40 p-4">
      <p className="text-sm leading-6 text-ivory/65">Draft a short professional bio using your profile details and optional LinkedIn About/Experience text. LinkedIn links are not read automatically. Review and edit the result before using it.</p>
      <label className="block text-sm text-ivory/75">LinkedIn profile URL (optional)<Input type="url" value={linkedin} maxLength={300} placeholder="https://www.linkedin.com/in/your-profile" onChange={(event) => setLinkedin(event.target.value)} className="mt-2 border-ivory/20 text-ivory" /></label>
      <label className="block text-sm text-ivory/75">Paste LinkedIn About / Experience (optional)<Textarea value={background} maxLength={8000} onChange={(event) => setBackground(event.target.value)} className="mt-2 min-h-28 border-ivory/20 text-ivory" /></label>
      <Button type="button" disabled={busy} onClick={() => void generate()} className="rounded-none bg-gold text-navy hover:bg-gold-light">{busy ? "Drafting…" : draft ? "Generate another draft" : "Generate bio draft"}</Button>
      {busy && <p role="status" className="text-sm text-ivory/60">Preparing your private bio draft…</p>}
      {message && <p role="alert" className="text-sm text-rose-200">{message}</p>}
      {draft && <div className="border-t border-gold/20 pt-4">
        <label className="block text-sm text-ivory/75">Your draft<Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={3000} className="mt-2 min-h-32 border-ivory/20 text-ivory" /></label>
        <p className="my-3 text-xs leading-5 text-ivory/55">Nothing has been saved or published. “Use draft” replaces the Short bio below; you can keep editing it before saving your profile.</p>
        <Button type="button" disabled={busy || !draft.trim()} onClick={() => { onUse(draft); setOpen(false); }} variant="outline" className="rounded-none border-gold/40 text-gold">Use draft</Button>
      </div>}
    </div>}
  </div>;
}

function ReceivedConfirmation() {
  return <div className="flex min-h-[480px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold text-gold"><Check className="h-7 w-7" /></div><p className="mt-8 text-xs uppercase text-gold">Received</p><h2 className="mt-4 max-w-xl font-display text-5xl">Thank you for sharing your perspective.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-ivory/55">Your private Executive Profile is on file. This does not constitute an appointment or commitment to serve. Meeting availability and released Forum requirements remain available. Questions can be sent to info@readinessterminal.com.</p><div className="mt-10 w-full max-w-3xl text-left"><MemberMeetings hideWhenEmpty /></div><Button asChild className="mt-8 rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy"><Link to="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Return to Welcome Center</Link></Button></div>;
}
function SubmittedProfileReview({ form, onEdit }: { form: ProfileForm; onEdit: () => void }) {
  return <div><p className="text-xs uppercase text-gold">Submitted profile</p><h2 className="mt-3 font-display text-4xl sm:text-5xl">Your profile, on file.</h2><p className="mt-4 text-sm leading-7 text-ivory/55">Review the information you submitted below, or edit it at any time.</p><Button type="button" onClick={onEdit} className="mt-6 rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy"><Save className="mr-2 h-4 w-4" />Edit profile</Button>
    <div className="mt-10 space-y-10">
      <ReviewSection title="Your information"><ReviewItem label="Preferred name" value={form.preferred_name} /><ReviewItem label="Professional role (optional)" value={form.professional_role} /><ReviewItem label="Organization (optional)" value={form.current_organization} /><ReviewItem label="Preferred email" value={form.preferred_email} /><ReviewItem label="Preferred phone" value={form.preferred_phone} /><ReviewItem label="Short bio" value={form.bio} /></ReviewSection>
      <ReviewSection title={PORTAL_FIT_TITLE}>{fitReadoutRows(form.experience_answers).map((row) => <ReviewItem key={row.label} {...row} />)}</ReviewSection>
      <ReviewSection title={PORTAL_COMMUNICATION_TITLE}>{communicationReadoutRows(form.visibility_instructions).map((row) => <ReviewItem key={row.label} {...row} />)}{form.restriction_details && <ReviewItem label="Previous restrictions or considerations" value={form.restriction_details} />}</ReviewSection>
      <ReviewSection title="Final details"><ReviewItem label="Package considerations" value={form.final_notes} /><ReviewItem label="Questions for the team" value={form.questions} /><ReviewItem label="Contact requested" value={form.contact_requested ? "Yes" : "No"} /></ReviewSection>
    </div><Button asChild className="mt-10 rounded-none bg-gold text-navy hover:bg-gold-light hover:text-navy"><Link to="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Return to Welcome Center</Link></Button></div>;
}
function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-t border-gold/20 pt-6"><h3 className="font-display text-2xl text-gold">{title}</h3><dl className="mt-5 grid gap-6 sm:grid-cols-2">{children}</dl></section>; }
function ReviewItem({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs uppercase text-ivory/45">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ivory/80">{value?.trim() || "Not provided"}</dd></div>; }
function StepTitle({ n, title, copy }: { n: string; title: string; copy: string }) { return <div><p className="text-xs uppercase text-gold">Stage {n}</p><h2 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h2><p className="mt-4 text-sm text-ivory/55">{copy}</p></div>; }
function HeadshotField() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, busy, msg } = useHeadshotUpload();
  const url = useQuery({ queryKey: ["my-headshot"], queryFn: () => isPreviewHost() ? Promise.resolve(null) : getMyHeadshotUrl(), retry: false });
  const src = usePrivateMedia(url.data?.url);
  return <div className="mt-10 flex flex-wrap items-center gap-6 border border-gold/15 bg-navy/40 p-5">
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-ivory/5 text-gold">{src ? <img src={src} alt="Your headshot" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6" />}</div>
    <div><p className="text-xs uppercase text-ivory/55">Headshot</p><p className="mt-1 text-sm text-ivory/50">Used only for your individualized materials. JPG or PNG, up to 5 MB.</p>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
      <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="mt-3 rounded-none border-gold/40 text-gold hover:bg-gold hover:text-navy">{busy ? "Uploading…" : src ? "Replace headshot" : "Upload headshot"}</Button>
      {msg && <p role="status" className="mt-2 text-xs text-ivory/55">{msg}</p>}
    </div>
  </div>;
}
function Field({ label, value, onChange, type = "text", maxLength, error, inputRef }: { label: string; value: string; onChange: (value: string) => void; type?: string; maxLength: number; error?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  return <label className="text-xs uppercase text-ivory/55">{label}<Input ref={inputRef} type={type} value={value} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? "preferred-email-error" : undefined} onChange={(event) => onChange(event.target.value)} className={`mt-2 h-12 text-ivory ${error ? "border-rose-300" : "border-ivory/20"}`} />{error && <span id="preferred-email-error" className="mt-2 block normal-case text-rose-200">{error}</span>}</label>;
}
