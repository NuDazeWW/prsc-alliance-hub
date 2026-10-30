import { usePrivateMedia } from "@/hooks/use-private-media";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getLeadershipTeam, type LeaderRow } from "@/lib/leadership.functions";
import { isPreviewHost } from "@/routes/_authenticated/route";
import l1 from "@/assets/leaders/leader1.jpg";
import l2 from "@/assets/leaders/leader2.jpg";
import l3 from "@/assets/leaders/leader3.jpg";
import l4 from "@/assets/leaders/leader4.jpg";
import l5 from "@/assets/leaders/leader5.jpg";
import l6 from "@/assets/leaders/leader6.jpg";
import placeholder from "@/assets/leaders/placeholder.png";

const DEMO: Pick<LeaderRow, "id" | "name" | "title" | "bio" | "photo_url" | "affiliation">[] = [
  ["Jonathan Reeves", "Chairman", l1],
  ["Dr. Elena Park", "Board Member", l2],
  ["Marcus Ellison", "Board Member", l3],
  ["Victoria Chen", "Board Member", l4],
  ["Daniel Brooks", "Board Member", l5],
  ["Angela Kim", "Board Member", l6],
].map(([name, title, photo], i) => ({ id: `demo-${i}`, name, title, bio: null, photo_url: photo, affiliation: null }));

const DEFAULT_SETTINGS = {
  eyebrow: "Our Leadership Team",
  heading: "Our Leadership Team",
  subtext: "A distinguished group of advisors and executives guiding PRSC's mission and industry impact.",
};

export function LeadershipTeam() {
  const q = useQuery({
    queryKey: ["leadership-team"],
    queryFn: async () => {
      try {
        const res = await getLeadershipTeam();
        if (isPreviewHost() && res.team.length === 0) return { team: DEMO, settings: res.settings };
        return { team: res.team.filter((t) => t.visible), settings: res.settings };
      } catch (e) {
        if (isPreviewHost()) return { team: DEMO, settings: DEFAULT_SETTINGS };
        throw e;
      }
    },
    retry: false,
  });
  const [open, setOpen] = useState<string | null>(null);
  const settings = q.data?.settings ?? DEFAULT_SETTINGS;
  const team = q.data?.team ?? [];

  return (
    <div className="h-full border border-gold/25 bg-[linear-gradient(135deg,var(--color-midnight),var(--color-navy))] p-6 sm:p-8">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{settings.eyebrow}</p>
      <h2 className="mt-3 font-display text-[clamp(1.75rem,2.2vw,2.4rem)] leading-tight">{settings.heading}</h2>
      {settings.subtext && <p className="mt-2 text-sm leading-6 text-ivory/60">{settings.subtext}</p>}
      {q.isLoading && <p className="mt-6 text-sm text-ivory/50">Loading…</p>}
      <ul className="mt-6 space-y-3">
        {team.map((p) => {
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="border border-ivory/15 bg-navy-deep/40">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 pr-5 text-left transition-colors hover:bg-ivory/[.03]"
              >
                {p.photo_url ? (
                  <LeaderPhoto url={p.photo_url} name={p.name} />
                ) : (
                  <img src={placeholder} alt="" aria-hidden="true" width={80} height={64} className="h-16 w-20 shrink-0 bg-navy-deep object-contain p-1" />
                )}
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate font-display text-[17px] text-ivory">{p.name}</span>
                  <span className="block truncate text-xs text-gold/85">{p.title}</span>
                  {p.affiliation && <span className="block truncate text-xs text-ivory/55">{p.affiliation}</span>}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <p className="whitespace-pre-wrap border-t border-ivory/10 px-5 py-4 text-sm leading-6 text-ivory/70">
                  {p.bio?.trim() || "Biography coming soon."}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LeaderPhoto({ url, name }: { url: string; name: string }) {
  const src = usePrivateMedia(url);
  return src ? <img src={src} alt={name} loading="lazy" width={80} height={64} className="h-16 w-20 shrink-0 object-cover" /> : <span className="h-16 w-20 shrink-0 bg-ivory/5" />;
}
