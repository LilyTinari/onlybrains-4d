import { Button } from "@/components/ui/button";
import { AgentBrain } from "@/components/agent-brain";
import { useAppStore } from "@/lib/store";

const traits = [
  "Natural conversation in 95+ languages",
  "Adaptive learning algorithms",
  "Real-time knowledge synthesis",
];

export function LucienSection() {
  const setLucienOpen = useAppStore((s) => s.setLucienOpen);

  return (
    <section id="lucien" className="scroll-mt-24">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="relative min-h-120 overflow-hidden bg-bg md:min-h-170">
          <AgentBrain id="lucien" className="absolute inset-0 h-full w-full" interactive selected count={7200} />
          <div className="pointer-events-none absolute inset-0 veil-bottom" />
          <div className="pointer-events-none absolute bottom-6 left-6 right-6">
            <p className="kicker">Digital neural mentor</p>
            <p className="font-display mt-2 text-3xl text-fg italic">Lucien</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-16 md:px-14 md:py-20">
          <p className="kicker">Holographic presence</p>
          <h2 className="font-sans text-display mt-4 font-medium tracking-tight">
            Meet Lucien
          </h2>
          <p className="mt-3 text-sm text-muted">
            Not a chatbot. Not a person. A cognitive companion that understands
            how you think.
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Lucien learns your unique cognitive patterns, adapts to your learning
            style, and guides you through personalized intelligence pathways.
            Experience education that evolves with you.
          </p>
          <ul className="mt-8 space-y-3">
            {traits.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-fg">
                <span className="mt-2 block size-1 rounded-full bg-neural" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button size="lg" onClick={() => setLucienOpen(true)}>
              Chat with Lucien
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
