import { lazy, Suspense, useState } from "react";
import { journey } from "@/lib/content";
import { cn, useMediaQuery, useMounted, usePrefersReducedMotion } from "@/lib/utils";

const HoloRing = lazy(() => import("@/components/holo-ring"));

export function HoloTimeline() {
  const [active, setActive] = useState(0);
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const mobile = useMediaQuery("(max-width: 640px)");
  const live = mounted && !reduced && !mobile;
  const step = journey[active] ?? journey[0]!;

  return (
    <section id="journey" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="kicker">HoloTimeline</p>
        <h2 className="font-sans text-display mt-4 max-w-2xl font-medium tracking-tight">
          From curious to mastery
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          An 8-step evolution powered by AI. Drag to rotate. Click any node to
          see how OnlyBrains transforms the way you learn.
        </p>

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative min-h-96 overflow-hidden rounded-xl bg-surface ring-1 ring-line md:min-h-120">
            <img
              src="/images/holo.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            {live ? (
              <div className="absolute inset-0 mix-blend-screen">
                <Suspense fallback={null}>
                  <HoloRing active={active} onPick={setActive} />
                </Suspense>
              </div>
            ) : null}
            <div className="pointer-events-none absolute inset-0 veil-bottom" />
            <p className="absolute bottom-5 left-5 text-xs tracking-widest text-subtle uppercase">
              Drag to rotate · Click nodes
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="kicker">
              Step {step.step} {step.kicker}
            </p>
            <h3 className="font-display mt-3 text-3xl italic tracking-tight text-fg md:text-4xl">
              {step.title}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-muted">{step.copy}</p>
            <ul className="mt-6 space-y-2">
              {step.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-fg">
                  <span className="mt-2 block size-1 rounded-full bg-neural" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {journey.map((j, i) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "grid size-11 place-items-center rounded-full text-sm tabular-nums transition-colors duration-fast",
                    i === active
                      ? "bg-accent text-accent-fg"
                      : "border border-line text-muted hover:text-fg",
                  )}
                  aria-label={`Step ${j.step} ${j.title}`}
                >
                  {j.step}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
