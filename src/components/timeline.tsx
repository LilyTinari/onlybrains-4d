import { milestones } from "@/lib/content";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Timeline() {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const active =
    milestones.reduce((best, m) => (m.year <= year ? m : best), milestones[0]!) ??
    milestones[0]!;

  return (
    <section id="future" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="kicker">Future of humanity</p>
        <h2 className="font-sans text-display mt-4 max-w-2xl font-medium tracking-tight">
          Pivotal moments, plotted in time.
        </h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
          The fourth dimension of the field. Select a year — the neural lattice
          in the observatory above rewires with it.
        </p>

        <div className="mt-12 flex gap-2 overflow-x-auto pb-2">
          {milestones.map((m) => {
            const on = m.year === active.year;
            return (
              <button
                key={m.year}
                type="button"
                onClick={() => setYear(m.year)}
                className={cn(
                  "flex h-12 shrink-0 items-center rounded-full px-4 text-sm tabular-nums transition-[background-color,color,border-color] duration-150",
                  on
                    ? "bg-accent text-accent-fg"
                    : "border border-line text-muted hover:text-fg",
                )}
              >
                {m.year}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-10 border-t border-line pt-10 md:grid-cols-[200px_minmax(0,1fr)]">
          <p className="font-sans text-6xl font-medium tracking-tight text-fg tabular-nums">
            {active.year}
          </p>
          <div>
            <h3 className="font-display text-3xl tracking-tight text-fg italic">
              {active.title}
            </h3>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              {active.copy}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
