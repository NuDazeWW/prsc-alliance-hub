import { Link } from "@tanstack/react-router";

type LinkItem = { to: string; label: string };

export function ContinueReading({ links }: { links: LinkItem[] }) {
  return (
    <section className="bg-midnight text-ivory py-10 md:py-12 border-t border-ivory/5">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
        <p
          className="label-caps text-[0.7rem] tracking-[0.18em] flex-shrink-0"
          style={{ color: "#7A7F87" }}
        >
          Explore the Council
        </p>
        <nav className="flex flex-wrap gap-x-10 gap-y-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group inline-flex items-center gap-3 text-ivory hover:text-gold transition-colors text-base md:text-lg"
            >
              <span className="text-gold transition-transform group-hover:translate-x-0.5">→</span>
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
