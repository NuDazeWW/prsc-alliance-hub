import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import prscCrest from "@/assets/prsc-logo-only.png.asset.json";
import scoreGauge from "@/assets/prsc-score-gauge.png.asset.json";
import disLogo from "@/assets/dis-logo-hub.png";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ALL_TOPICS, AUDIENCES, AVAILABILITY, COMPETITIVE_CONTEXT, DIMENSIONS, FLYWHEEL, GROUPS, GUIDED, HUB_INTRO, HUB_SCOPE, HUB_TITLE,
  INTELLIGENCE, IP_STACK, SITE_LINKS, PAGE_LABELS, RELATIONSHIP, ROLE_CARDS, type Block, type Tone, type Topic,
} from "@/data/orientation-hub";

type View = { kind: "hub" } | { kind: "guided"; step: number } | { kind: "explore" } | { kind: "topic"; id: string } | { kind: "materials" };

const toneText: Record<Tone, string> = { prsc: "text-gold", dis: "text-dis-cyan", bridge: "text-gold-light" };
const toneBorder: Record<Tone, string> = { prsc: "border-gold/40", dis: "border-dis-cyan/40", bridge: "border-dis-silver/30" };

export function OrientationHub({ onClose, onOpenDocuments }: { onClose: () => void; onOpenDocuments: () => void }) {
  const [view, setView] = useState<View>({ kind: "hub" });
  const top = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const body = document.body;
    const y = window.scrollY;
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      Object.assign(body.style, previous);
      window.scrollTo({ top: y, behavior: "instant" });
    };
  }, []);
  useLayoutEffect(() => {
    top.current?.closest("[role=dialog]")?.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  const btn = "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-8 text-[12.5px] font-semibold uppercase tracking-[0.14em]";

  return (
    <div ref={top}>
      {view.kind !== "hub" && (
        <button type="button" onClick={() => setView({ kind: "hub" })} className="mb-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold hover:text-ivory">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orientation Hub
        </button>
      )}

      {view.kind === "hub" && (
        <>
          <DialogHeader className="space-y-0 text-left">
            <p className="label-caps text-gold">The Orientation Hub</p>
            <DialogTitle className="mt-4 font-display text-[clamp(2rem,2.6vw,2.9rem)] font-normal leading-[1.1]">{HUB_TITLE}</DialogTitle>
          </DialogHeader>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-ivory/80">{HUB_INTRO}</p>
          <p className="mt-3 text-xs text-ivory/50">{HUB_SCOPE}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ROLE_CARDS.map((c) => (
              <div key={c.title} className={`${c.tone === "dis" ? "hub-card-dis" : "hub-card"} rounded-lg p-5`}>
                <RoleVisual v={c.visual} />
                <p className={`mt-4 font-display text-xl ${toneText[c.tone]}`}>{c.title}</p>
                <p className="mt-2 text-sm leading-6 text-ivory/75">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => setView({ kind: "guided", step: 0 })} className={`${btn} cta-glow`}><span>Take the 5-Minute Orientation</span></button>
            <button type="button" onClick={() => setView({ kind: "explore" })} className={`${btn} cta-glow-outline`}><span>Explore the System</span></button>
            <button type="button" onClick={() => setView({ kind: "materials" })} className={`${btn} cta-glow-outline`}><span>View Current Materials</span></button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {PAGE_LABELS.map((l) => <span key={l} className="rounded-full border border-ivory/15 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory/55">{l}</span>)}
          </div>
        </>
      )}

      {view.kind === "guided" && (
        <Guided step={view.step} setStep={(s) => setView({ kind: "guided", step: s })} onExplore={() => setView({ kind: "explore" })} onMaterials={() => setView({ kind: "materials" })} onClose={onClose} btn={btn} />
      )}

      {view.kind === "explore" && (
        <>
          <p className="label-caps text-gold">Explore by Topic</p>
          <h2 className="mt-3 font-display text-[clamp(1.8rem,2.4vw,2.5rem)] leading-tight">Open any chapter.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {GROUPS.map((g) => (
              <div key={g.id} className="rounded-md border border-gold/20 bg-navy-deep/50 p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{g.letter} · {g.title}</p>
                <ul className="mt-3 space-y-1">
                  {g.topics.map((tp) => (
                    <li key={tp.id}>
                      <button type="button" onClick={() => setView({ kind: "topic", id: tp.id })} className="flex w-full items-center justify-between py-1.5 text-left text-sm text-ivory/85 hover:text-gold">
                        {tp.title} <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {view.kind === "topic" && <TopicView key={view.id} id={view.id} onPick={(id) => setView({ kind: "topic", id })} />}

      {view.kind === "materials" && (
        <>
          <p className="label-caps text-gold">Current Materials</p>
          <h2 className="mt-3 font-display text-[clamp(1.8rem,2.4vw,2.5rem)] leading-tight">Your documents and references.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/75">Materials released to you, including items to read or sign, live in Your Documents.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={onOpenDocuments} className={`${btn} cta-glow`}><span>Open Your Documents</span></button>
          </div>
          <SiteLinks ids={["score", "governance", "charter", "standards", "vanguard"]} />
        </>
      )}
    </div>
  );
}

function Guided({ step, setStep, onExplore, onMaterials, onClose, btn }: { step: number; setStep: (n: number) => void; onExplore: () => void; onMaterials: () => void; onClose: () => void; btn: string }) {
  const ch = GUIDED[step];
  const last = step === GUIDED.length - 1;
  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <aside>
        <select value={step} onChange={(e) => setStep(Number(e.target.value))} className="w-full rounded-md border border-gold/30 bg-navy-deep p-2 text-sm text-ivory lg:hidden" aria-label="Chapter">
          {GUIDED.map((g, i) => <option key={g.title} value={i}>{String(i + 1).padStart(2, "0")} {g.title}</option>)}
        </select>
        <ol className="hidden space-y-1 lg:block">
          {GUIDED.map((g, i) => (
            <li key={g.title}>
              <button type="button" onClick={() => setStep(i)} className={`w-full border-l-2 py-1.5 pl-3 text-left text-[13px] ${i === step ? "border-gold text-gold" : "border-ivory/10 text-ivory/55 hover:text-ivory"}`}>
                {String(i + 1).padStart(2, "0")} {g.title}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ivory/55">
          <span>Chapter {step + 1} of {GUIDED.length}</span>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-ivory/10">
          <div className="h-1 rounded-full bg-gradient-to-r from-gold to-dis-cyan transition-all" style={{ width: `${((step + 1) / GUIDED.length) * 100}%` }} />
        </div>
        <p className="mt-6 label-caps text-gold">{ch.title}</p>
        <TopicBody key={step} topic={ch.topic} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className={`${btn} cta-glow-outline`}><span>Previous</span></button>}
          {!last && <button type="button" onClick={() => setStep(step + 1)} className={`${btn} cta-glow`}><span>Next chapter</span></button>}
          {last && (
            <>
              <button type="button" onClick={onExplore} className={`${btn} cta-glow`}><span>Explore the full system</span></button>
              <button type="button" onClick={onMaterials} className={`${btn} cta-glow-outline`}><span>View documents and materials</span></button>
              <button type="button" onClick={onClose} className={`${btn} cta-glow-outline`}><span>Return to portal</span></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicView({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const topic = ALL_TOPICS.find((t) => t.id === id);
  if (!topic) return null;
  const idx = ALL_TOPICS.indexOf(topic);
  const group = GROUPS.find((g) => g.topics.includes(topic));
  if (!group) return null;
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <select value={id} onChange={(e) => onPick(e.target.value)} className="w-full rounded-md border border-gold/30 bg-navy-deep p-2 text-sm text-ivory lg:hidden" aria-label="Chapter">
          {GROUPS.map((g) => (
            <optgroup key={g.id} label={`${g.letter} · ${g.title}`}>
              {g.topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="hidden space-y-4 lg:block">
          {GROUPS.map((g) => (
            <div key={g.id}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ivory/40">{g.letter} · {g.title}</p>
              {g.topics.map((t) => (
                <button key={t.id} type="button" onClick={() => onPick(t.id)} className={`block w-full border-l-2 py-1 pl-3 text-left text-[12.5px] ${t.id === id ? "border-gold text-gold" : "border-ivory/10 text-ivory/55 hover:text-ivory"}`}>
                  {t.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/55">Chapter {idx + 1} of {ALL_TOPICS.length} · {group.title}</p>
        <div className="mt-2 h-1 w-full rounded-full bg-ivory/10">
          <div className="h-1 rounded-full bg-gradient-to-r from-gold to-dis-cyan" style={{ width: `${((idx + 1) / ALL_TOPICS.length) * 100}%` }} />
        </div>
        <p className={`mt-6 label-caps ${toneText[topic.tone]}`}>{topic.title}</p>
        <TopicBody topic={topic} />
        <div className="mt-8 flex justify-between gap-3 text-[12px] uppercase tracking-[0.14em]">
          {idx > 0 ? <button type="button" onClick={() => onPick(ALL_TOPICS[idx - 1].id)} className="text-ivory/60 hover:text-gold">← {ALL_TOPICS[idx - 1].title}</button> : <span />}
          {idx < ALL_TOPICS.length - 1 && <button type="button" onClick={() => onPick(ALL_TOPICS[idx + 1].id)} className="text-right text-gold hover:text-ivory">{ALL_TOPICS[idx + 1].title} →</button>}
        </div>
      </div>
    </div>
  );
}

function TopicBody({ topic }: { topic: Topic }) {
  return (
    <>
      <h2 className="mt-3 font-display text-[clamp(1.6rem,2.2vw,2.3rem)] leading-tight text-ivory">{topic.heading}</h2>
      <div className="mt-5 space-y-5">{topic.blocks.map((b, i) => <BlockView key={i} b={b} tone={topic.tone} />)}</div>
      {topic.links && <SiteLinks ids={topic.links} />}
    </>
  );
}

function BlockView({ b, tone }: { b: Block; tone: Tone }) {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  switch (b.kind) {
    case "p":
      return <p className="text-[15px] leading-7 text-ivory/80">{b.text}</p>;
    case "quote":
      return <blockquote className={`border-l-2 ${tone === "dis" ? "border-dis-cyan" : "border-gold"} pl-4 font-display text-lg italic leading-8 text-ivory/90`}>{b.text}</blockquote>;
    case "label":
      return <p className="rounded-md border border-ivory/15 bg-ivory/5 px-4 py-3 text-xs uppercase tracking-[0.12em] text-ivory/70">{b.text}</p>;
    case "soon":
      return (
        <div>
          <ul className="grid gap-2 sm:grid-cols-2">{b.items.map((it) => <li key={it} className="flex items-center justify-between gap-3 rounded-md border border-ivory/10 bg-navy-deep/40 px-4 py-3 text-[14px] text-ivory/80">{it}<span className="shrink-0 rounded-full border border-gold/40 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.14em] text-gold">Coming soon</span></li>)}</ul>
        </div>
      );
    case "list":
      return (
        <div>
          {b.title && <p className={`mb-2 text-sm font-semibold ${toneText[tone]}`}>{b.title}</p>}
          <ul className="space-y-1.5">{b.items.map((it) => <li key={it} className="flex gap-3 text-[14.5px] leading-6 text-ivory/80"><span className={`mt-2.5 h-1 w-1 shrink-0 rounded-full ${tone === "dis" ? "bg-dis-cyan" : "bg-gold"}`} />{it}</li>)}</ul>
        </div>
      );
    case "pairs":
      return (
        <dl className="grid gap-3">
          {b.rows.map((r) => (
            <div key={r.term} className={`rounded-md border ${toneBorder[tone]} bg-navy-deep/40 p-4`}>
              <dt className={`text-sm font-semibold ${toneText[tone]}`}>{r.term}</dt>
              <dd className="mt-1 text-[14px] leading-6 text-ivory/78">{r.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "relationship":
      return (
        <div>
          <div className="grid gap-3 md:grid-cols-3">
            {RELATIONSHIP.columns.map((c) => (
              <div key={c.title} className={`rounded-md border ${toneBorder[c.tone]} bg-navy-deep/60 p-4`}>
                <p className={`font-display text-xl ${toneText[c.tone]}`}>{c.title}</p>
                <ul className="mt-3 space-y-2">{c.rows.map((r) => <li key={r} className="text-[13.5px] leading-6 text-ivory/80">{r}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mt-2 h-px bg-gradient-to-r from-gold via-dis-silver/40 to-dis-cyan" />
          <div className="mt-4 space-y-3">{RELATIONSHIP.lines.map((l) => <blockquote key={l} className="border-l-2 border-gold pl-4 font-display text-lg italic leading-8 text-ivory/90">{l}</blockquote>)}</div>
        </div>
      );
    case "dimensions":
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map((d, i) => (
            <button key={d.name} type="button" onClick={() => setOpen(open === i ? null : i)} className={`rounded-md border p-4 text-left transition-colors ${open === i ? "border-gold bg-gold/10" : "border-gold/25 bg-navy-deep/50 hover:border-gold/60"}`}>
              <p className="text-sm font-semibold text-gold">{d.name}</p>
              <p className="mt-2 text-[13.5px] leading-6 text-ivory/80">{open === i ? d.q : "Tap to see the question it answers"}</p>
            </button>
          ))}
        </div>
      );
    case "audiences": {
      const a = AUDIENCES[tab];
      return (
        <div>
          <div className="flex flex-wrap gap-2" role="tablist">
            {AUDIENCES.map((x, i) => (
              <button key={x.name} role="tab" aria-selected={i === tab} type="button" onClick={() => setTab(i)} className={`rounded-full border px-4 py-2 text-[12px] ${i === tab ? "border-dis-cyan bg-dis-cyan/10 text-dis-cyan" : "border-ivory/15 text-ivory/65 hover:text-ivory"}`}>{x.name}</button>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-dis-cyan/30 bg-dis-navy/60 p-5">
            {a.future && <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-dis-silver">Future-state / not yet a market promise</p>}
            <p className="text-sm font-semibold text-dis-cyan">What they receive</p>
            <ul className="mt-2 space-y-1.5">{a.receives.map((r) => <li key={r} className="text-[14px] leading-6 text-ivory/80">· {r}</li>)}</ul>
            <p className="mt-4 text-sm font-semibold text-dis-cyan">What it helps them do</p>
            <p className="mt-1 text-[14px] leading-6 text-ivory/80">{a.helps}</p>
            <p className="mt-4 rounded-md border border-gold/30 bg-navy-deep/60 px-4 py-3 text-[13px] leading-6 text-ivory/80"><span className="font-semibold text-gold">Boundary · </span>{a.boundary}</p>
          </div>
        </div>
      );
    }
    case "intelligence":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {INTELLIGENCE.map((x) => (
            <div key={x.name} className="rounded-md border border-dis-cyan/25 bg-dis-navy/50 p-4">
              <p className="text-sm font-semibold text-dis-cyan">{x.name}</p>
              <p className="mt-1 text-[13.5px] leading-6 text-ivory/78">{x.q}</p>
            </div>
          ))}
        </div>
      );
    case "availability":
      return (
        <div>
          <p className="mb-2 text-sm font-semibold text-dis-silver">Availability key</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((a, i) => (
              <span key={a} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1.5 text-[12px] text-ivory/75">
                <span className="h-2 w-2 rounded-full bg-dis-cyan" style={{ opacity: 1 - i * 0.22 }} />{a}
              </span>
            ))}
          </div>
        </div>
      );
    case "ipstack":
      return (
        <ol className="space-y-1.5">
          {IP_STACK.map((l, i) => (
            <li key={l.name} className="flex gap-4 rounded-md border border-gold/20 bg-navy-deep/50 p-3" style={{ marginLeft: `${Math.min(i, 6) * 6}px` }}>
              <span className="font-display text-lg text-gold">{String(i + 1).padStart(2, "0")}</span>
              <div><p className="text-sm font-semibold text-ivory">{l.name}</p><p className="text-[13px] leading-6 text-ivory/70">{l.text}</p></div>
            </li>
          ))}
        </ol>
      );
    case "competitive":
      return (
        <section className="rounded-md border border-gold/25 bg-navy-deep/50 p-4 sm:p-5">
          <h3 className="font-display text-xl text-gold">Competitive Context</h3>
          <div className="mt-4 hidden grid-cols-3 gap-4 border-b border-gold/20 pb-3 text-xs font-semibold text-gold sm:grid">
            <span>Existing category</span><span>What it does</span><span>What PRSC and DIS add</span>
          </div>
          <dl className="divide-y divide-ivory/10">
            {COMPETITIVE_CONTEXT.map((row) => (
              <div key={row.category} className="grid gap-3 py-4 text-sm leading-6 sm:grid-cols-3 sm:gap-4">
                <dt className="font-semibold text-ivory">{row.category}</dt>
                <dd className="text-ivory/75"><span className="block text-xs font-semibold text-gold sm:hidden">What it does</span>{row.does}</dd>
                <dd className="text-ivory/80"><span className="block text-xs font-semibold text-gold sm:hidden">What PRSC and DIS add</span>{row.adds}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-gold/20 pt-4 text-sm leading-7 text-ivory/85">There are companies that measure sponsorship and companies that manage sponsorship. There is no clear direct competitor combining an independent motorsport readiness standard, a privately issued Score, governed evidence rules, and a multi-audience intelligence platform.</p>
        </section>
      );
    case "flywheel":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {FLYWHEEL.map((f, i) => (
            <li key={f} className="flex gap-3 rounded-md border border-dis-silver/25 bg-navy-deep/50 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dis-cyan/60 text-sm text-dis-cyan">{i + 1}</span>
              <span className="text-[13.5px] leading-6 text-ivory/80">{f}</span>
            </li>
          ))}
        </ol>
      );
  }
}

function SiteLinks({ ids }: { ids: string[] }) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ivory/50">Related pages</p>
      <div className="flex flex-wrap gap-2">
        {SITE_LINKS.filter((l) => ids.includes(l.id)).map((l) => (
          <a key={l.id} href={l.href} target="_blank" rel="noreferrer" onClick={(event) => event.currentTarget.closest("[role=dialog]")?.scrollTo({ top: 0, behavior: "instant" })} className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-[12px] text-gold transition-colors hover:bg-gold/10">
            {l.label} <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

function RoleVisual({ v }: { v: "shield" | "ring" | "signal" }) {
  const src = v === "shield" ? prscCrest.url : v === "ring" ? scoreGauge.url : disLogo;
  const alt = v === "shield" ? "PRSC crest" : v === "ring" ? "PRSC Readiness Score gauge" : "DIS — Decision Intelligence Systems";
  return (
    <div className="grid h-24 place-items-center">
      <img src={src} alt={alt} className={`max-h-24 object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)] ${v === "signal" ? "w-[88%]" : "h-24 w-auto"}`} />
    </div>
  );
}
