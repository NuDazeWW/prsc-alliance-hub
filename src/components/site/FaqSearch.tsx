import { useMemo, useState, type ReactNode } from "react";
import { Search, ChevronDown } from "lucide-react";
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqItem } from "@/data/faq";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterFaq(items: FaqItem[], query: string, category: string | null) {
  const base = category ? items.filter((i) => i.category === category) : items;
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return base;
  const scored: { item: FaqItem; score: number }[] = [];
  for (const item of base) {
    const q = normalize(item.question);
    const a = normalize(item.answer);
    const inQ = terms.every((t) => q.includes(t));
    const inAll = terms.every((t) => q.includes(t) || a.includes(t));
    if (inQ) scored.push({ item, score: 0 });
    else if (inAll) scored.push({ item, score: 1 });
  }
  scored.sort((x, y) => x.score - y.score || x.item.id - y.item.id);
  return scored.map((s) => s.item);
}

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((p, i) =>
        pattern.test(p) && normalize(p) !== "" && terms.includes(normalize(p)) ? (
          <mark key={i} className="bg-gold/25 text-inherit rounded-[2px] px-0.5">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function AccordionRow({
  item,
  query,
  open,
  onToggle,
}: {
  item: FaqItem;
  query: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-navy/10">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-4 py-4 text-left group"
        >
          <span className="font-medium text-navy leading-snug group-hover:text-gold transition-colors">
            <Highlight text={item.question} query={query} />
          </span>
          <ChevronDown
            size={18}
            className={`mt-0.5 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      {open && (
        <div className="pb-5 pr-8 text-stone leading-relaxed text-[0.95rem]">{item.answer}</div>
      )}
    </div>
  );
}

/** Search + category chips + accordion list, shared by the overlay and /faq. */
export function FaqSearch({ footer }: { footer?: ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const results = useMemo(() => filterFaq(FAQ_ITEMS, query, category), [query, category]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-navy/10 bg-card px-5 md:px-8 pt-4 pb-3">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenId(null);
            }}
            placeholder="Search questions…"
            aria-label="Search frequently asked questions"
            className="w-full rounded-sm border border-navy/15 bg-background py-3 pl-10 pr-4 text-navy placeholder:text-stone/70 outline-none focus:border-gold focus:ring-1 focus:ring-gold/40"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[null, ...FAQ_CATEGORIES].map((c) => {
            const active = category === c;
            return (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setOpenId(null);
                }}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "border-gold bg-gold/15 text-navy"
                    : "border-navy/15 text-stone hover:border-gold/60 hover:text-navy"
                }`}
              >
                {c ?? "All"}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-stone">
          {results.length} of {FAQ_ITEMS.length} questions
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 md:px-8">
        {results.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-navy font-medium">No questions match that search.</p>
            <p className="mt-2 text-sm text-stone">
              Try a different word, or{" "}
              <a href="/request-briefing" className="text-gold underline underline-offset-4">
                request a briefing
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="pb-6">
            {results.map((item) => (
              <AccordionRow
                key={item.id}
                item={item}
                query={query}
                open={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-navy/10 bg-card px-5 md:px-8 py-3 text-center text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}
