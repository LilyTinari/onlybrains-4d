import { lazy, Suspense, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useMounted, usePrefersReducedMotion } from "@/lib/utils";

const NeuralField = lazy(() => import("@/components/neural-field"));

export function FieldStage() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const setProgress = useAppStore((s) => s.setFieldProgress);
  const plateRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useAppStore.getState().setOpening(0);
  }, []);

  useEffect(() => {
    let raf = 0;
    const born = performance.now();
    let lastP = -1;

    const tick = (now: number) => {
      const h = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 1.7)));
      if (Math.abs(p - lastP) > 0.006) {
        lastP = p;
        setProgress(p);
      }
      const st = useAppStore.getState();
      const intro = reduced ? 1 : Math.min(1, (now - born) / 2600);
      const k = 1 - (1 - intro) ** 3;
      const t = (now - born) / 1000;
      const sway = reduced ? 0 : Math.sin(t * 0.13) * 9;
      const yaw = sway + Math.max(-30, Math.min(30, st.fieldYaw * (180 / Math.PI)));
      const pitch = 8 + Math.max(-14, Math.min(14, st.fieldPitch * (180 / Math.PI)));
      if (plateRef.current) {
        const scale = 1.22 - 0.12 * k + p * 0.2;
        plateRef.current.style.transform = `translate3d(0, ${p * -7}%, 0) scale(${scale}) rotateX(${pitch + p * 12}deg) rotateY(${yaw}deg)`;
        plateRef.current.style.opacity = String((0.08 + 0.82 * k) * (1 - p * 0.55));
      }
      if (fieldRef.current) {
        fieldRef.current.style.opacity = String((0.55 + 0.45 * k) * (1 - p * 0.84));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setProgress, reduced]);

  const live = mounted && !reduced;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ perspective: "1100px" }}>
        <div
          ref={plateRef}
          className="absolute inset-0 will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            transform: "scale(1.16) rotateX(8deg)",
          }}
        >
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/field-portrait.jpg" />
            <img
              src="/images/field.jpg"
              alt=""
              className="absolute inset-0 h-full w-full scale-125 object-cover"
            />
          </picture>
        </div>
      </div>
      {live ? (
        <div ref={fieldRef} className="absolute inset-0 mix-blend-screen">
          <Suspense fallback={null}>
            <NeuralField />
          </Suspense>
        </div>
      ) : null}
      <div className="absolute inset-0 veil-cinema" />
    </div>
  );
}
