import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function Closing() {
  const setLucienOpen = useAppStore((s) => s.setLucienOpen);

  return (
    <section className="relative overflow-hidden">
      <img
        src="/images/field.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-bg/70" />
      <div className="relative mx-auto max-w-3xl px-5 py-28 text-center md:py-36">
        <p className="kicker">Ready to evolve</p>
        <h2 className="font-sans text-display mt-5 font-medium tracking-tight">
          Join the community of minds shaping the future.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted">
          Your evolution starts here. Generate a course, walk the field, or speak
          with Lucien — a digital neural mentor.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/login">Join the private preview</Link>
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setLucienOpen(true)}>
            Speak with Lucien
          </Button>
        </div>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs tracking-widest text-subtle uppercase">
          <li>Enterprise security</li>
          <li>Instant access</li>
          <li>Lifetime updates</li>
        </ul>
      </div>
    </section>
  );
}
