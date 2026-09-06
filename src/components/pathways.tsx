import { useState } from "react";
import { pathways } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Pathways() {
  const [active, setActive] = useState<(typeof pathways)[number]["id"]>("intelligence");
  const current = pathways.find((p) => p.id === active) ?? pathways[2];

  return (
    <section id="pathways" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">Intelligence pathways</p>
            <h2 className="font-sans text-display mt-4 max-w-xl font-medium tracking-tight">
              Four interconnected domains of mastery.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted md:text-base">
            Choose your path or unlock them all. Health, wealth, intelligence,
            mastery — plus AI and creation.
          </p>
        </div>

        <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {pathways.map((p) => {
            const on = p.id === active;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p.id)}
                className={cn(
                  "group relative min-h-[280px] overflow-hidden rounded-xl text-left md:min-h-[340px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/35",
                )}
              >
                <img
                  src={p.image}
                  alt=""
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-smooth",
                    on ? "scale-105" : "scale-100 group-hover:scale-105",
                  )}
                />
                <div className="absolute inset-0 veil-card" />
                <div className="relative flex h-full min-h-[280px] flex-col justify-end p-6 md:min-h-[340px] md:p-7">
                  <p className="kicker">{p.kicker}</p>
                  <h3 className="font-sans mt-2 text-2xl font-medium tracking-tight text-fg md:text-3xl">
                    {p.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 max-w-sm text-sm leading-relaxed text-muted transition-opacity duration-fast",
                      on ? "opacity-100" : "opacity-0 md:opacity-80",
                    )}
                  >
                    {p.copy}
                  </p>
                  <p className="mt-4 text-xs tracking-widest text-subtle uppercase">
                    {p.modules}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="sr-only">{current.copy}</p>
      </div>
    </section>
  );
}
