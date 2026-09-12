import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentBrain } from "@/components/agent-brain";
import { agents } from "@/lib/content";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Agents() {
  const [all, setAll] = useState(false);
  const setLucienOpen = useAppStore((s) => s.setLucienOpen);
  const list = all ? agents : agents.filter((a) => a.featured);

  return (
    <section id="mentors" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="kicker">AI Mentors</p>
        <h2 className="font-sans text-display mt-4 max-w-2xl font-medium tracking-tight">
          Meet the minds that never sleep
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          Each mentor is a specialized lens of the same OnlyBrains engine — a
          defined domain, its own reasoning style, and clear limits on what it
          will and won’t do. None of them are human. Each is a digital neural
          field.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <article
              key={a.id}
              className={cn(
                "overflow-hidden rounded-xl bg-surface ring-1 ring-line",
                a.id === "lucien" && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <AgentBrain
                id={a.id}
                className="aspect-[5/4] w-full"
                interactive
                selected
                count={a.id === "lucien" ? 4200 : 2600}
              />
              <div className="p-6">
                <p className="kicker">{a.domain}</p>
                <h3 className="font-display mt-3 text-3xl italic tracking-tight text-fg">
                  {a.name}
                </h3>
                <p className="mt-1 text-sm text-fg">{a.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{a.copy}</p>
                <p className="mt-4 text-xs tracking-widest text-subtle uppercase">
                  {a.epithet}
                </p>
                {a.id === "lucien" ? (
                  <Button size="sm" className="mt-6" onClick={() => setLucienOpen(true)}>
                    Chat with Lucien
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Button size="lg" variant="ghost" onClick={() => setAll((v) => !v)}>
            {all ? "Show flagship twelve" : "Explore all 24 mentors"}
          </Button>
        </div>
      </div>
    </section>
  );
}
