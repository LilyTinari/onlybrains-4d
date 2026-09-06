import { Wordmark } from "@/components/mark";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
        <Wordmark />
        <p className="max-w-sm text-sm leading-relaxed text-subtle">
          OnlyBrains — AI-augmented human intelligence. Neuroscience, longevity,
          wealth, and real-world mastery.
        </p>
        <p className="text-xs tracking-widest text-subtle uppercase">
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
