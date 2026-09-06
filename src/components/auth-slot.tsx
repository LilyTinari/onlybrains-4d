import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-elevated" />;
  }

  if (user) {
    return (
      <div className="hidden items-center gap-2 text-fg md:flex [&_span]:bg-elevated [&_span]:text-fg [&_button]:text-muted">
        <UserButton />
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" asChild className="hidden md:inline-flex">
      <Link to="/login">Sign in</Link>
    </Button>
  );
}
