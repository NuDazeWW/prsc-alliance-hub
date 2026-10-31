import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateMyWhyYou } from "@/lib/portal.functions";
import { userFacingError } from "@/lib/user-facing-error";

/** The private note about why this member was invited. It fills in from the invitation and the member may reword it. */
export function MemberWhyYou({ text, canEdit, onSaved }: { text: string; canEdit: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      await updateMyWhyYou({ data: { why_you: draft } });
      setEditing(false);
      onSaved();
    } catch (error) {
      setMessage(userFacingError(error, "Your note could not be saved. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <>
        <p className="mt-5 text-[15px] leading-7 text-ivory/75">{text}</p>
        {canEdit && (
          <button type="button" onClick={() => { setDraft(text); setMessage(""); setEditing(true); }} className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold hover:underline">
            <Pencil className="h-3.5 w-3.5" /> Edit in your own words
          </button>
        )}
      </>
    );
  }
  return (
    <form onSubmit={save} className="mt-5 space-y-3">
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} minLength={20} maxLength={2000} required aria-label="Why you note" className="text-base" />
      <p className="text-xs text-ivory/55">This starts from the note the team wrote when inviting you. Change anything so it reads the way you would put it.</p>
      <div className="flex gap-3">
        <Button type="submit" disabled={busy || draft.trim().length < 20}>{busy ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
      </div>
      {message && <p role="status" className="text-sm text-gold">{message}</p>}
    </form>
  );
}
