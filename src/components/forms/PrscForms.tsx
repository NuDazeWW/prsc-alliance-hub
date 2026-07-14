import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitBriefing, submitBoardInterest, submitVanguardInterest } from "@/lib/forms.functions";
import { Field, Input, Textarea, Select, SubmitButton, SuccessPanel } from "./fields";

function useFormState() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  return { pending, setPending, error, setError, done, setDone };
}

function getData(e: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
}

export function BriefingForm() {
  const call = useServerFn(submitBriefing);
  const s = useFormState();
  if (s.done) return <SuccessPanel title="Briefing request received." body="A member of the Council will be in touch within two business days." />;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        s.setError(null); s.setPending(true);
        try { await call({ data: getData(e) as never }); s.setDone(true); }
        catch (err) { s.setError((err as Error).message || "Something went wrong."); }
        finally { s.setPending(false); }
      }}
      className="grid gap-5 md:grid-cols-2"
    >
      <Field label="First name" htmlFor="first_name"><Input id="first_name" name="first_name" required /></Field>
      <Field label="Last name" htmlFor="last_name"><Input id="last_name" name="last_name" required /></Field>
      <Field label="Organization" htmlFor="organization"><Input id="organization" name="organization" required /></Field>
      <Field label="Role / Title" htmlFor="role"><Input id="role" name="role" required /></Field>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
      <Field label="How do you interact with the sponsorship market?" htmlFor="interaction">
        <Select id="interaction" name="interaction" required defaultValue="">
          <option value="" disabled>Select one…</option>
          <option value="property">Organization (rights holder, team, league, event)</option>
          <option value="demand">Demand (brand, agency, investor)</option>
          <option value="channel">Channel (media, platform, technology)</option>
          <option value="ecosystem">Ecosystem (advisor, academic, press)</option>
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Anything you'd like us to know" htmlFor="message">
          <Textarea id="message" name="message" placeholder="Optional context or specific questions." />
        </Field>
      </div>
      {s.error && <p className="md:col-span-2 text-sm text-destructive">{s.error}</p>}
      <div className="md:col-span-2 mt-2 flex justify-end">
        <SubmitButton pending={s.pending}>Request Briefing</SubmitButton>
      </div>
    </form>
  );
}

export function BoardInterestForm() {
  const call = useServerFn(submitBoardInterest);
  const s = useFormState();
  if (s.done) return <SuccessPanel title="Statement of interest received." body="The Council will review and respond within ten business days." />;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        s.setError(null); s.setPending(true);
        try { await call({ data: getData(e) as never }); s.setDone(true); }
        catch (err) { s.setError((err as Error).message || "Something went wrong."); }
        finally { s.setPending(false); }
      }}
      className="grid gap-5 md:grid-cols-2"
    >
      <Field label="Name" htmlFor="name"><Input id="name" name="name" required /></Field>
      <Field label="Title" htmlFor="title"><Input id="title" name="title" required /></Field>
      <Field label="Organization" htmlFor="organization"><Input id="organization" name="organization" required /></Field>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
      <div className="md:col-span-2">
        <Field label="LinkedIn URL" htmlFor="linkedin_url"><Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" /></Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Statement of interest" htmlFor="statement" hint="Briefly describe your perspective on partnership readiness and why you'd contribute to the governing body.">
          <Textarea id="statement" name="statement" required minLength={20} />
        </Field>
      </div>
      {s.error && <p className="md:col-span-2 text-sm text-destructive">{s.error}</p>}
      <div className="md:col-span-2 mt-2 flex justify-end">
        <SubmitButton pending={s.pending}>Submit Statement</SubmitButton>
      </div>
    </form>
  );
}

export function VanguardInterestForm() {
  const call = useServerFn(submitVanguardInterest);
  const s = useFormState();
  if (s.done) return <SuccessPanel title="Application received." body="The Council will review your Vanguard candidacy and be in touch within five business days." />;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        s.setError(null); s.setPending(true);
        try { await call({ data: getData(e) as never }); s.setDone(true); }
        catch (err) { s.setError((err as Error).message || "Something went wrong."); }
        finally { s.setPending(false); }
      }}
      className="grid gap-5 md:grid-cols-2"
    >
      <Field label="Your name" htmlFor="name"><Input id="name" name="name" required /></Field>
      <Field label="Organization / Team / Event" htmlFor="property"><Input id="property" name="property" required /></Field>
      <Field label="Role" htmlFor="role"><Input id="role" name="role" required /></Field>
      <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
      <div className="md:col-span-2">
        <Field label="Phone (optional)" htmlFor="phone"><Input id="phone" name="phone" type="tel" /></Field>
      </div>
      {s.error && <p className="md:col-span-2 text-sm text-destructive">{s.error}</p>}
      <div className="md:col-span-2 mt-2 flex justify-end">
        <SubmitButton pending={s.pending}>Apply to the Vanguard</SubmitButton>
      </div>
    </form>
  );
}
