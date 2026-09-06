import { principles } from "@/lib/content";

export function Platform() {
  return (
    <section id="platform" className="scroll-mt-24">
      <div className="mx-auto grid max-w-6xl md:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden bg-surface md:min-h-[640px]">
          <img
            src="/images/helix.jpg"
            alt="A glass and silver double helix"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 veil-photo" />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="kicker">Cognitive DNA</p>
            <p className="font-display mt-2 max-w-sm text-2xl text-fg italic">
              You don’t have a profile. You have a living blueprint.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-5 py-16 md:px-14">
          <p className="kicker">The platform</p>
          <h2 className="font-sans text-display mt-4 font-medium tracking-tight">
            A fusion of mind, machine, and measure.
          </h2>
          <ol className="mt-10 space-y-8">
            {principles.map((p, i) => (
              <li key={p.title} className="border-t border-line pt-6">
                <p className="kicker">0{i + 1}</p>
                <h3 className="mt-2 text-lg text-fg">{p.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {p.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
