import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { campusStops } from "@/lib/content";
import { cn, useMediaQuery, useMounted, usePrefersReducedMotion } from "@/lib/utils";

const CampusScene = lazy(() => import("@/components/campus-scene"));

export function Walkthrough({ variant = "section" }: { variant?: "section" | "page" }) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const mobile = useMediaQuery("(max-width: 640px)");
  const [stop, setStop] = useState(0);
  const [touring, setTouring] = useState(true);
  const live = mounted && !reduced && !mobile;
  const current = campusStops[stop] ?? campusStops[0]!;

  useEffect(() => {
    if (!touring || !live) return;
    const id = window.setInterval(() => {
      setStop((s) => (s + 1) % campusStops.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [touring, live]);

  return (
    <section
      id="tour"
      className={cn("scroll-mt-24", variant === "page" && "min-h-svh pt-20")}
    >
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">3D walkthrough</p>
            <h2 className="font-sans text-display mt-4 max-w-xl font-medium tracking-tight">
              Ninety seconds inside the field.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted md:text-base">
            Drag to look. Click a ring. The core is Lucien — a glowing digital
            brain, not a person.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          <div className="relative aspect-video min-h-80 w-full md:min-h-120">
            <img
              src="/images/campus.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {live ? (
              <div className="absolute inset-0">
                <Suspense fallback={null}>
                  <CampusScene
                    stop={stop}
                    touring={touring}
                    onPick={(i) => {
                      setTouring(false);
                      setStop(i);
                    }}
                  />
                </Suspense>
              </div>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 veil-bottom" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between md:p-7">
              <div>
                <p className="kicker">{current.label}</p>
                <p className="mt-2 max-w-sm text-sm text-fg md:text-base">{current.copy}</p>
              </div>
              <div className="pointer-events-auto flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={touring ? "primary" : "ghost"}
                  onClick={() => setTouring((v) => !v)}
                >
                  {touring ? "Pause tour" : "Play tour"}
                </Button>
                {variant === "section" ? (
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/tour">Enter walkthrough</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" asChild>
                    <a href="/#generate">Generate a course</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {campusStops.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setTouring(false);
                setStop(i);
              }}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-sm transition-colors duration-fast",
                i === stop ? "bg-accent text-accent-fg" : "border border-line text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
