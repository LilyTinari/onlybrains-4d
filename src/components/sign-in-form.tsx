import { FormEvent, useState } from "react";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProviderButtons({
  callbackURL = "/",
  className,
}: {
  callbackURL?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {GROK_PROVIDERS.map((p) => (
        <Button
          key={p.providerId}
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          disabled={busy !== null}
          onClick={() => {
            setError(null);
            setBusy(p.providerId);
            void signIn(p.providerId, { callbackURL }).catch((err: unknown) => {
              setBusy(null);
              setError(err instanceof Error ? err.message : "Sign-in failed.");
            });
          }}
        >
          {busy === p.providerId ? "Opening…" : `Continue with ${p.label}`}
        </Button>
      ))}
      {error ? <p className="text-sm text-muted">{error}</p> : null}
    </div>
  );
}

export function EmailAuthForm({
  callbackURL = "/",
  className,
}: {
  callbackURL?: string;
  className?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Learner",
          callbackURL,
        });
        if (err) throw new Error(err.message ?? "Could not create the account.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL,
        });
        if (err) throw new Error(err.message ?? "Could not sign in.");
      }
      if (typeof window !== "undefined") {
        const dest = new URL(callbackURL, window.location.origin);
        window.location.href = dest.pathname + dest.hash;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something failed.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "h-10 flex-1 rounded-full text-sm transition-colors duration-fast",
            mode === "signup" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
          )}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
        <button
          type="button"
          className={cn(
            "h-10 flex-1 rounded-full text-sm transition-colors duration-fast",
            mode === "signin" ? "bg-elevated text-fg" : "text-muted hover:text-fg",
          )}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
      </div>
      {mode === "signup" ? (
        <label className="block">
          <span className="sr-only">Name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="h-12 w-full rounded-lg bg-elevated px-4 text-sm text-fg outline-none ring-1 ring-line placeholder:text-subtle focus-visible:ring-fg/35"
            autoComplete="name"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="sr-only">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-12 w-full rounded-lg bg-elevated px-4 text-sm text-fg outline-none ring-1 ring-line placeholder:text-subtle focus-visible:ring-fg/35"
          autoComplete="email"
        />
      </label>
      <label className="block">
        <span className="sr-only">Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password · 8+ characters"
          className="h-12 w-full rounded-lg bg-elevated px-4 text-sm text-fg outline-none ring-1 ring-line placeholder:text-subtle focus-visible:ring-fg/35"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Working…" : mode === "signup" ? "Join the private preview" : "Sign in"}
      </Button>
    </form>
  );
}

export function SignInStack({
  callbackURL = "/",
  className,
}: {
  callbackURL?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full max-w-sm space-y-5", className)}>
      <ProviderButtons callbackURL={callbackURL} />
      <p className="kicker text-center">or email</p>
      <EmailAuthForm callbackURL={callbackURL} />
    </div>
  );
}
