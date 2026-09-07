import { useEffect, useRef } from "react";
import { YEAR_MAX, YEAR_MIN, useAppStore } from "@/lib/store";
import { cn, usePrefersReducedMotion } from "@/lib/utils";

function FieldGrab() {
  const reduced = usePrefersReducedMotion();
  const dragging = useAppStore((s) => s.fieldDragging);
  const setDragging = useAppStore((s) => s.setFieldDragging);
  const nudge = useAppStore((s) => s.nudgeField);
  const mark = useAppStore((s) => s.markFieldTouched);
  const lucienOpen = useAppStore((s) => s.lucienOpen);
  const menuOpen = useAppStore((s) => s.menuOpen);
  const progress = useAppStore((s) => s.fieldProgress);
  const last = useRef({ x: 0, y: 0, t: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const coastRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(coastRef.current), []);

  useEffect(() => {
    if (reduced || lucienOpen || menuOpen || progress > 0.55) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        return;
      }
      const step = e.shiftKey ? 0.14 : 0.07;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(-step, 0);
        mark();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(step, 0);
        mark();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nudge(0, -step);
        mark();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nudge(0, step);
        mark();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reduced, lucienOpen, menuOpen, progress, nudge, mark]);

  if (reduced || lucienOpen || menuOpen) return null;

  function stopCoast() {
    cancelAnimationFrame(coastRef.current);
    vel.current.x = 0;
    vel.current.y = 0;
  }

  function startCoast() {
    const step = () => {
      vel.current.x *= 0.88;
      vel.current.y *= 0.88;
      if (Math.abs(vel.current.x) + Math.abs(vel.current.y) < 0.002) return;
      nudge(vel.current.x * 7, vel.current.y * 7);
      coastRef.current = requestAnimationFrame(step);
    };
    coastRef.current = requestAnimationFrame(step);
  }

  return (
    <div
      role="img"
      aria-label="Interactive 4D neural field. Drag to orbit, arrow keys to turn, scroll to continue."
      className={cn(
        "absolute inset-0 z-10 select-none",
        dragging ? "cursor-grabbing touch-none" : "cursor-grab touch-pan-y",
      )}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        stopCoast();
        draggingRef.current = true;
        setDragging(true);
        mark();
        last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        const now = performance.now();
        const dt = Math.max(8, now - last.current.t);
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        vel.current.x = Math.max(-0.12, Math.min(0.12, dx / dt));
        vel.current.y = Math.max(-0.12, Math.min(0.12, dy / dt));
        last.current = { x: e.clientX, y: e.clientY, t: now };
        nudge(dx * 0.00215, dy * 0.00145);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
        setDragging(false);
        startCoast();
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
        setDragging(false);
      }}
    />
  );
}

export function Hero() {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const progress = useAppStore((s) => s.fieldProgress);
  const touched = useAppStore((s) => s.fieldTouched);
  const opening = useAppStore((s) => s.opening);
  const reduced = usePrefersReducedMotion();
  const labelFade = Math.max(0, 1 - progress * 1.85);
  const hintFade = touched || progress > 0.12 ? 0 : 1;
  const onlyIn = reduced ? 1 : Math.max(0, Math.min(1, (opening - 0.42) / 0.28));
  const brainsIn = reduced ? 1 : Math.max(0, Math.min(1, (opening - 0.56) / 0.28));
  const markIn = reduced ? 1 : Math.max(0, Math.min(1, (opening - 0.28) / 0.22));

  return (
    <section id="field" className="relative min-h-svh overflow-hidden">
      <FieldGrab />

      <div
        className="pointer-events-none absolute inset-x-0 top-[46%] z-20 flex justify-center px-5 md:top-[40%]"
        style={{
          opacity: markIn * labelFade * (1 - brainsIn * 0.85),
          transform: `translateY(${(1 - markIn) * 12}px)`,
        }}
      >
        <p className="font-display text-4xl italic tracking-tight text-fg md:text-6xl lg:text-7xl">
          OnlyBrains
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex items-center justify-between px-4 md:top-[42%] md:px-16 lg:px-24"
        style={{
          opacity: labelFade,
          transform: `translateY(calc(-50% - ${progress * 28}px))`,
        }}
      >
        <p
          className="font-display text-2xl italic tracking-tight text-fg md:text-5xl lg:text-6xl"
          style={{
            opacity: onlyIn,
            transform: `translateX(${(1 - onlyIn) * -28}px)`,
          }}
        >
          Only
        </p>
        <p
          className="font-sans text-xs font-medium tracking-widest text-fg uppercase md:text-sm"
          style={{
            opacity: brainsIn,
            transform: `translateX(${(1 - brainsIn) * 28}px)`,
          }}
        >
          Brains
        </p>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-2/3 z-20 flex justify-center px-5 transition-opacity duration-700 ease-smooth"
        style={{ opacity: reduced ? 0 : hintFade * brainsIn }}
      >
        <p className="kicker rise-late">Drag to orbit</p>
      </div>

      <div
        className="pointer-events-none relative z-20 mx-auto flex min-h-svh max-w-6xl flex-col justify-end px-5 pb-10 md:px-8 md:pb-14"
        style={{ opacity: labelFade }}
      >
        <div className="pointer-events-auto max-w-md">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="kicker">4D neural field</p>
            <p className="font-sans text-sm tabular-nums text-fg">{year}</p>
          </div>
          <input
            className="year-range"
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            value={year}
            aria-label="Scrub the neural field through time"
            onChange={(e) => setYear(Number(e.target.value))}
            suppressHydrationWarning
          />
          <p className="mt-3 max-w-md text-sm leading-relaxed text-subtle">
            Time is the fourth axis. Scrub from the AI revolution to universal
            prosperity and watch the lattice densify.
          </p>
        </div>
      </div>
    </section>
  );
}
