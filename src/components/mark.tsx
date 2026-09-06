import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-fg", className)}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-baseline gap-1.5", className)}>
      <Mark className="size-4 translate-y-px" />
      <span className="font-display text-xl italic font-medium tracking-tight">
        Only
      </span>
      <span className="font-sans text-xs font-medium tracking-widest uppercase">
        Brains
      </span>
    </span>
  );
}
