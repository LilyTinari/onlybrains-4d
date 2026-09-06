import { cn } from "@/lib/utils";

export function DigitalBrain({
  className,
  pulse = false,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <span
        className={cn(
          "absolute inset-1 rounded-full bg-neural/20",
          pulse && "animate-pulse",
        )}
      />
      <svg viewBox="0 0 64 64" className="relative size-full text-neural" aria-hidden="true">
        <ellipse cx="32" cy="34" rx="18" ry="20" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M32 14c-6 4-8 10-8 16 0 8 3 14 8 20 5-6 8-12 8-20 0-6-2-12-8-16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M18 30c4 1 8-1 12-1s8 2 16 1" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M20 40c5 .5 8-1 12-1s8 1.5 13 1" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="26" r="1.4" fill="currentColor" />
        <circle cx="40" cy="28" r="1.4" fill="currentColor" />
        <circle cx="32" cy="38" r="1.6" fill="currentColor" />
        <circle cx="28" cy="46" r="1.2" fill="currentColor" />
        <circle cx="38" cy="44" r="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}
