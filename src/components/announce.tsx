import { ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoStage } from "@/components/video-stage";
import { stats } from "@/lib/content";

export function Announce() {
  return (
    <section className="relative px-5 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-sans text-hero font-medium tracking-tight text-fg">
          The future of
          <br />
          human intelligence
        </h1>
        <p className="font-display mt-5 text-2xl tracking-tight text-fg italic md:text-3xl">
          Upgrade your mind
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl md:mt-14">
        <VideoStage />
      </div>

      <div className="mx-auto mt-12 max-w-2xl md:mt-16">
        <p className="text-base leading-relaxed text-muted md:text-lg">
          The world’s first AI-augmented human intelligence platform. Neuroscience,
          longevity, finance, and real-world mastery — composed as one instrument.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild>
            <a href="#generate">Generate a course</a>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="#tour">
              Take the 90-second tour
              <ArrowDownRight className="size-4" />
            </a>
          </Button>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="kicker">{s.label}</dt>
              <dd className="mt-1 font-sans text-2xl font-medium tracking-tight text-fg tabular-nums md:text-3xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
