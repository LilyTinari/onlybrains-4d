import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { LucienPanel } from "@/components/lucien-panel";
import { Dust } from "@/components/dust";
import { DNAHelix } from "@/components/dna-helix";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dna-molecule")({ component: DNAPage });

const NEURAL = "#9ec9d4";
const IVORY = "#eceae4";
const WARM = "#c8c4b8";
const STEEL = "#8b8d96";
const MIST = "#b7c4c8";
const FOG = "#d4d0c6";

const HERO_SKILLS = [
  { name: "Curiosity", progress: 85, color: NEURAL },
  { name: "Reasoning", progress: 72, color: IVORY },
  { name: "Creativity", progress: 60, color: WARM },
  { name: "Discipline", progress: 90, color: STEEL },
  { name: "Empathy", progress: 55, color: MIST },
  { name: "Resilience", progress: 78, color: FOG },
];

const STRANDS = [
  {
    n: "01",
    title: "Cognitive Signature",
    copy: "Your unique neural fingerprint — how you process, reason, and connect ideas. No two are identical.",
    long: "Your neural fingerprint — the unique way your brain processes patterns, abstracts concepts, and reasons through problems. This strand lights up brightest during deep analytical work.",
    metrics: [
      { label: "Pattern Recognition", value: 92 },
      { label: "Abstract Thinking", value: 78 },
      { label: "Spatial Reasoning", value: 65 },
    ],
    colors: [NEURAL, "#b7dbe3", "#7aa8b3"],
  },
  {
    n: "02",
    title: "Learning Velocity",
    copy: "Tracks how fast you absorb concepts across domains — adapting content speed to your cadence.",
    long: "How fast you absorb and integrate new knowledge. This strand measures your acceleration curve across different domains — some people sprint through math but stroll through language, and that's data we use.",
    metrics: [
      { label: "Absorption Rate", value: 88 },
      { label: "Retention Depth", value: 71 },
      { label: "Transfer Speed", value: 56 },
    ],
    colors: [IVORY, "#d8d4cc", "#a8a49c"],
  },
  {
    n: "03",
    title: "Curiosity Metabolism",
    copy: "Measures how your curiosity converts into action — from question to skill to application.",
    long: 'The fire in your gut. This strand measures how efficiently your curiosity converts into tangible skill and action — from the first "I wonder..." to mastery.',
    metrics: [
      { label: "Question Generation", value: 95 },
      { label: "Exploration Drive", value: 82 },
      { label: "Action Conversion", value: 68 },
    ],
    colors: [WARM, "#ddd6c4", "#9a9486"],
  },
  {
    n: "04",
    title: "Aha Engine",
    copy: '"Good confusion" tracker — moments where productive struggle creates breakthrough understanding.',
    long: 'Tracks "productive confusion" — those moments where struggle converts to sudden clarity. The best breakthroughs happen right at the edge of understanding, and this strand maps that frontier.',
    metrics: [
      { label: "Confusion Tolerance", value: 74 },
      { label: "Breakthrough Rate", value: 61 },
      { label: "Insight Depth", value: 83 },
    ],
    colors: [MIST, NEURAL, STEEL],
  },
  {
    n: "05",
    title: "Adaptive Resilience",
    copy: "How you recover from failure, reframe setbacks, and convert obstacles into acceleration fuel.",
    long: "How you bounce back — and bounce forward. This strand tracks your recovery velocity from setbacks and your ability to reframe failure as acceleration fuel.",
    metrics: [
      { label: "Recovery Speed", value: 80 },
      { label: "Failure Reframing", value: 67 },
      { label: "Obstacle Conversion", value: 73 },
    ],
    colors: [FOG, WARM, STEEL],
  },
  {
    n: "06",
    title: "Cross-Domain Synthesis",
    copy: "Your ability to pull insights from unrelated fields and create novel connections between them.",
    long: "The rarest strand — your ability to pull insights from unrelated fields and fuse them into novel ideas. This is the innovation gene, and OnlyBrains actively cultivates it.",
    metrics: [
      { label: "Domain Bridging", value: 59 },
      { label: "Novel Connections", value: 71 },
      { label: "Innovation Index", value: 64 },
    ],
    colors: [STEEL, IVORY, NEURAL],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Initial Calibration",
    copy: "When you join, Lucien — our AI mentor — conducts a gentle cognitive calibration through conversation, quizzes, and behavioral patterns.",
  },
  {
    n: "02",
    title: "Continuous Evolution",
    copy: "Every interaction refines your DNA — courses taken, questions asked, failures overcome, breakthroughs achieved. It never stops learning you.",
  },
  {
    n: "03",
    title: "Personalized Pathways",
    copy: "Your DNA drives everything: course recommendations, mentor matching, challenge difficulty, and even the pace of content delivery.",
  },
  {
    n: "04",
    title: "Lightcone Projection",
    copy: "Your DNA feeds into the Lightcone — a futures simulator that projects where your skills could take you across multiple possible timelines.",
  },
];

const SHIFTS = [
  {
    title: "Truly Personalized",
    copy: "No more one-size-fits-all learning. Your DNA ensures every course, mentor, and challenge is calibrated to YOUR cognitive profile — not an average.",
  },
  {
    title: "Measurable Growth",
    copy: "Watch your strands evolve in real-time. See exactly where you're growing, where you're plateauing, and what to do about it.",
  },
  {
    title: "Privacy-First Design",
    copy: "Your cognitive data is encrypted and owned by you. We never sell your profile. You control what's visible on your Holotimeline.",
  },
  {
    title: "AI-Powered Evolution",
    copy: "Lucien, your AI mentor, uses your DNA to generate personalized courses, predict career paths, and identify hidden strengths you didn't know you had.",
  },
];

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-muted">{label}</span>
      <div className="h-px flex-1 overflow-hidden bg-line">
        <div className="h-full bg-fg/80" style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted">{value}%</span>
    </div>
  );
}

function DNAPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [active, setActive] = useState(0);

  return (
    <div className="min-h-svh overflow-x-hidden bg-bg text-fg">
      <Dust />
      <Nav />
      <main className="relative z-10 pt-20 md:pt-24">
        <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="kicker">OnlyBrains Cognitive DNA™</p>
              <h1 className="mt-4 text-4xl font-medium tracking-tight md:text-5xl md:leading-[1.08]">
                This is how <em className="font-display not-italic md:italic">you</em> learn.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted md:text-lg">
                Your Cognitive DNA is a living blueprint of your mind — how you think, absorb,
                struggle, and break through. It’s not a test. It’s <em>you</em>, quantified.
              </p>
              <div className="mt-8 max-w-sm rounded-xl bg-elevated/40 p-5 ring-1 ring-line">
                <p className="text-sm">Lily’s Cognitive DNA</p>
                <p className="mt-1 text-xs tracking-widest text-subtle uppercase">Updated 2 hours ago</p>
                <div className="mt-4 space-y-3">
                  <MetricRow label="Learning Speed" value={92} />
                  <MetricRow label="Curiosity Index" value={88} />
                  <MetricRow label="Retention Depth" value={71} />
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/login">Build my DNA profile</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <a href="#how-it-works">How it works</a>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-line sm:aspect-square lg:aspect-[4/5] lg:min-h-[560px]">
              <DNAHelix skillAreas={HERO_SKILLS} fill interactive />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/85 to-transparent px-4 pb-4 pt-16">
                <p className="kicker">Double helix · 36 base pairs</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {HERO_SKILLS.map((s) => (
                    <span key={s.name} className="text-[10px] tracking-widest text-subtle uppercase">
                      {s.name} · {s.progress}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <p className="kicker">Six cognitive strands</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
              What composes your DNA.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              Each strand represents a dimension of your intellectual identity. Together, they form a
              molecule as unique as your fingerprint — and it evolves with every learning moment.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {STRANDS.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="border-t border-line pt-5 text-left"
                >
                  <p className="kicker">Strand {s.n}</p>
                  <h3 className="mt-3">{s.title}</h3>
                  <p className={cn("mt-2 text-sm leading-relaxed text-muted", open === i ? "" : "line-clamp-3")}>
                    {s.copy}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="kicker">The molecule</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
            Explore each strand in 3D.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted md:text-base">
            Each cognitive strand manifests differently in the molecule. Select a strand to light that band of the helix.
          </p>

          <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="order-2 space-y-2 lg:order-1">
              {STRANDS.map((s, i) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full border-t border-line py-5 text-left transition-colors",
                    active === i ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  <p className="kicker">Strand {s.n}</p>
                  <h3 className="mt-2 text-xl">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{active === i ? s.long : s.copy}</p>
                  {active === i && (
                    <div className="mt-5 space-y-3">
                      {s.metrics.map((m) => (
                        <MetricRow key={m.label} label={m.label} value={m.value} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="relative order-1 aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-line sm:aspect-square lg:sticky lg:top-24 lg:order-2 lg:aspect-auto lg:h-[min(72vh,640px)]">
              <DNAHelix
                skillAreas={STRANDS[active].metrics.map((m, idx) => ({
                  name: m.label,
                  progress: m.value,
                  color: STRANDS[active].colors[idx] ?? NEURAL,
                }))}
                highlight={active}
                fill
                interactive
              />
              <p className="pointer-events-none absolute bottom-4 left-4 kicker">
                Strand {STRANDS[active].n} · {STRANDS[active].title}
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <p className="kicker">How it works</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
              How your DNA gets built.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted md:text-base">
              It’s not a one-time assessment. It’s a living system that evolves with you.
            </p>
            <ol className="mt-12 grid gap-10 md:grid-cols-2">
              {STEPS.map((step) => (
                <li key={step.n} className="border-t border-line pt-6">
                  <p className="kicker">Step {step.n}</p>
                  <h3 className="mt-3 text-xl">{step.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="kicker">The shift</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-tight md:text-4xl">
            Why this changes everything.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {SHIFTS.map((item, i) => (
              <article key={item.title} className="border-t border-line pt-6">
                <p className="kicker">0{i + 1}</p>
                <h3 className="mt-3 text-xl">{item.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl md:grid-cols-2">
          <div className="relative min-h-[320px] overflow-hidden bg-elevated md:min-h-[480px]">
            <img src="/images/helix.jpg" alt="Cognitive DNA helix" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
          </div>
          <div className="flex flex-col justify-center px-5 py-16 md:px-14">
            <p className="kicker">Intellectual property</p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
              Built & protected by OnlyBrains.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
              <p>
                The <span className="text-fg">Cognitive DNA Molecule™</span> is a proprietary system
                conceived, designed, and built entirely by the OnlyBrains team. It represents years of
                research into cognitive science, adaptive learning, and AI-driven personalization.
              </p>
              <p>
                All algorithms, data structures, visualizations, and the concept itself are protected
                under intellectual property law. The DNA Molecule system, including its six-strand
                architecture, Aha Engine, Failure Fertilizer composting, and Lightcone integration, is
                the exclusive creation and copyright of OnlyBrains, Inc.
              </p>
              <p>
                © {new Date().getFullYear()} OnlyBrains, Inc. All rights reserved. Unauthorized
                reproduction, reverse engineering, or derivative works based on the Cognitive DNA
                system are strictly prohibited.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <p className="kicker">Begin</p>
          <h2 className="mt-4 max-w-xl text-3xl font-medium tracking-tight md:text-4xl">
            Discover your Cognitive DNA.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
            Join OnlyBrains and let our AI build your unique molecular profile. The future of learning
            starts with understanding how <em>you</em> think.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/login">Start your journey</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/" hash="generate">
                Generate a course
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
      <LucienPanel />
    </div>
  );
}
