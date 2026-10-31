import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ADMIN_GUIDE } from "@/lib/admin-guide";

/** Searchable how-to for administrators, opened from the left bar. */
export function AdminGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const hits = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return ADMIN_GUIDE;
    return ADMIN_GUIDE.filter((e) => {
      const hay = `${e.title} ${e.summary} ${e.group} ${e.keywords ?? ""} ${e.steps.join(" ")} ${(e.tips ?? []).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [q]);
  const groups = Array.from(new Set(hits.map((h) => h.group)));
  const searching = q.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-gold/30 bg-navy text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-ivory">Admin guide</DialogTitle>
          <DialogDescription className="text-ivory/60">Step-by-step instructions for everything in the admin area. Search for a task, such as "invite", "template", "agenda" or "questions".</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gold" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the guide" aria-label="Search the guide" className="h-11 pl-10" autoFocus />
        </div>
        {!hits.length && <p className="text-ivory/70">Nothing matches "{q}". Try a shorter word, such as "email" or "member".</p>}
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g}>
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{g}</p>
              <div className="mt-2 divide-y divide-gold/15 border border-gold/20">
                {hits.filter((h) => h.group === g).map((e) => {
                  const isOpen = searching || openId === e.id;
                  return (
                    <div key={e.id} className="p-4">
                      <button type="button" onClick={() => setOpenId(openId === e.id ? null : e.id)} aria-expanded={isOpen} className="block w-full text-left">
                        <span className="block font-serif text-xl text-ivory">{e.title}</span>
                        <span className="mt-1 block text-sm text-ivory/60">{e.summary}</span>
                      </button>
                      {isOpen && (
                        <div className="mt-3">
                          <ol className="list-decimal space-y-2 pl-5 text-base text-ivory/90">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                          {e.tips?.length ? <ul className="mt-3 space-y-1 border-l-2 border-gold/50 pl-3 text-sm text-ivory/70">{e.tips.map((t, i) => <li key={i}>{t}</li>)}</ul> : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-ivory/50">Still stuck? Email info@readinessterminal.com.</p>
      </DialogContent>
    </Dialog>
  );
}
