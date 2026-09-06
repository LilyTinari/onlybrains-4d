import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Wordmark } from "@/components/mark";
import { SignInStack } from "@/components/sign-in-form";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <main className="grid min-h-svh place-items-center bg-bg px-5">
        <div className="h-12 w-48 animate-pulse rounded-full bg-elevated" />
      </main>
    );
  }

  if (user) return <Navigate to="/" />;

  return (
    <main className="relative min-h-svh overflow-hidden bg-bg text-fg">
      <img
        src="/images/lucien.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-bg/70" />
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-center px-5 py-16">
        <Link to="/" className="text-fg">
          <Wordmark />
        </Link>
        <p className="kicker mt-12">Private preview</p>
        <h1 className="font-sans text-display mt-4 font-medium tracking-tight">
          Join the cohort
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Invite-only. Create an account to generate a course, keep it, and speak
          with Lucien — a digital neural mentor.
        </p>
        <SignInStack callbackURL="/#generate" className="mt-10" />
        <Link
          to="/"
          className="mt-8 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Back to OnlyBrains
        </Link>
      </div>
    </main>
  );
}
