import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function BabSection() {
  return (
    <section id="bab" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="kicker">Upcoming · BAB</p>
        <h2 className="font-sans text-display mt-4 max-w-3xl font-medium tracking-tight">
          Borrow A Brain.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          OnlyBrains predicts a specialist brain from a domain, a system, a company, or an agent —
          then streams it from the vault into your course. Not a person. A field you can inject
          when the path needs a different mind.
        </p>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          <li className="border-t border-line pt-6">
            <p className="kicker">01 · Domain</p>
            <h3 className="mt-3 text-lg text-fg">Where the brain is from</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Health, tech, capital, proof. We borrow the domain’s actual constraints — not a
              costume.
            </p>
          </li>
          <li className="border-t border-line pt-6">
            <p className="kicker">02 · Specialists, systems, companies, agents</p>
            <h3 className="mt-3 text-lg text-fg">Who thinks this way</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A specialist lens sitting on a living system — or a company DNA, or an agent that
              only runs a named job.
            </p>
          </li>
          <li className="border-t border-line pt-6">
            <p className="kicker">03 · Inject</p>
            <h3 className="mt-3 text-lg text-fg">Along the way</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Stream it from the vault, drop it into generate, or mid-lesson. Give it back.
            </p>
          </li>
        </ol>

        <div className="mt-12">
          <Button size="lg" asChild>
            <Link to="/bab">Enter the vault</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
