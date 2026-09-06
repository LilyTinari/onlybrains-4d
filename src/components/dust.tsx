import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/utils";

type Speck = { x: number; y: number; r: number; s: number; a: number };

export function Dust() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let specks: Speck[] = [];

    const neural = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-neural")
      .trim() || "#9ec9d4";

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 48 : 90;
      specks = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        s: 0.04 + Math.random() * 0.12,
        a: 0.08 + Math.random() * 0.18,
      }));
    }

    function tick() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of specks) {
        p.y -= p.s;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
        ctx!.beginPath();
        ctx!.fillStyle = neural;
        ctx!.globalAlpha = p.a;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
