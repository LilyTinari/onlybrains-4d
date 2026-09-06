import { FormEvent, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInStack } from "@/components/sign-in-form";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { courseTraits, generateSteps, science } from "@/lib/content";
import {
  generateCourse,
  listCourses,
  saveCourse,
  type GeneratedCourse,
  type SavedCourse,
} from "@/lib/course";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "onlybrains.course-draft";

type Draft = { topic: string; course: GeneratedCourse };

function readDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft | null) {
  if (typeof window === "undefined") return;
  try {
    if (!draft) window.sessionStorage.removeItem(DRAFT_KEY);
    else window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function CourseLab() {
  const { user, isPending } = useCurrentUserState();
  const setLucienOpen = useAppStore((s) => s.setLucienOpen);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    const existing = readDraft();
    if (existing) {
      setDraft(existing);
      setTopic(existing.topic);
    }
  }, []);

  useEffect(() => {
    if (isPending || !user) return;
    void listCourses()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, [isPending, user, savedId]);

  useEffect(() => {
    if (!draft) return;
    const el = document.getElementById("course-preview");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [draft]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    const next = topic.trim();
    if (!next || busy) return;
    setBusy(true);
    setError(null);
    setSavedId(null);
    try {
      const res = await generateCourse({ data: { topic: next } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const d = { topic: res.topic, course: res.course };
      setDraft(d);
      writeDraft(d);
    } catch {
      setError("The generator dropped. Try once more.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await saveCourse({ data: draft });
      if (res.ok) {
        setSavedId(res.id);
        writeDraft(null);
      }
    } catch {
      setError("Sign in to keep this course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="generate" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="kicker">Private preview</p>
        <h2 className="font-sans text-display mt-4 max-w-3xl font-medium tracking-tight">
          Generate a personalized course
          <br />
          in seconds.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          Tell us what you want to learn. We build the course. You start in 60
          seconds.
        </p>

        <form
          onSubmit={onGenerate}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block flex-1">
            <span className="sr-only">Topic</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Teach me React from scratch"
              className="h-14 w-full rounded-xl bg-elevated px-5 text-base text-fg outline-none ring-1 ring-line placeholder:text-subtle focus-visible:ring-fg/35"
              suppressHydrationWarning
            />
          </label>
          <Button type="submit" size="lg" className="h-14 px-8" disabled={busy || !topic.trim()}>
            {busy ? "Building…" : "Generate"}
          </Button>
        </form>
        <p className="mt-3 text-sm text-subtle">
          or{" "}
          <a href="#tour" className="text-fg underline-offset-4 hover:underline">
            take the 90-second tour
          </a>
        </p>
        {error ? <p className="mt-4 text-sm text-muted">{error}</p> : null}

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs tracking-widest text-subtle uppercase">
          <li>Personalized to your cognitive DNA</li>
          <li>Evidence-cited lessons</li>
          <li>Built to change how you think</li>
          <li>In development · early access</li>
        </ul>

        {draft ? (
          <CoursePreview
            draft={draft}
            saving={saving}
            savedId={savedId}
            onSave={onSave}
            onSpeak={() => setLucienOpen(true)}
          />
        ) : null}

        <div className="mt-20 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-3">
            <p className="kicker">How it works</p>
            <h3 className="font-sans mt-3 text-2xl font-medium tracking-tight md:text-3xl">
              From “I want to learn that” to your first lesson — in 60 seconds.
            </h3>
          </div>
          {generateSteps.map((s) => (
            <div key={s.n} className="border-t border-line pt-6">
              <p className="kicker">{s.n}</p>
              <h4 className="mt-3 text-lg text-fg">{s.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <p className="kicker">Grounded in peer-reviewed cognitive science</p>
          <h3 className="font-sans mt-3 max-w-xl text-2xl font-medium tracking-tight md:text-3xl">
            Why this isn’t another AI tutor
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            We don’t promise miracles. We build on the most replicated findings in
            learning science and let the methodology speak for itself.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {science.map((s) => (
              <article key={s.title} className="rounded-xl bg-surface p-6 ring-1 ring-line">
                <h4 className="text-lg text-fg">{s.title}</h4>
                <p className="mt-2 text-xs tracking-widest text-subtle uppercase">{s.source}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{s.copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <p className="kicker">Why it actually works</p>
          <h3 className="font-sans mt-3 max-w-xl text-2xl font-medium tracking-tight md:text-3xl">
            Six things every Lucien-generated course does — without you having to ask.
          </h3>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {courseTraits.map((t) => (
              <div key={t.title} className="border-t border-line pt-5">
                <h4 className="text-fg">{t.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.copy}</p>
              </div>
            ))}
          </div>
        </div>

        {saved.length > 0 ? (
          <div className="mt-16 border-t border-line pt-10">
            <p className="kicker">Your courses</p>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {saved.map((c) => (
                <li key={c.id} className="rounded-xl bg-surface p-5 ring-1 ring-line">
                  <p className="text-xs tracking-widest text-subtle uppercase">{c.mentor}</p>
                  <p className="mt-2 text-lg text-fg">{c.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {c.level} · {c.hours}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-16 max-w-xl text-sm leading-relaxed text-subtle">
          OnlyBrains is currently in private preview with a small cohort of
          learners and enterprise partners. We’re publishing real outcomes —
          including the ones that didn’t work — as our methodology matures.
          <span className="mt-2 block text-muted">
            — The OnlyBrains team. No paid testimonials. No invented stats.
          </span>
        </p>
      </div>
    </section>
  );
}

function CoursePreview({
  draft,
  saving,
  savedId,
  onSave,
  onSpeak,
}: {
  draft: Draft;
  saving: boolean;
  savedId: number | null;
  onSave: () => void;
  onSpeak: () => void;
}) {
  const { course } = draft;

  return (
    <div id="course-preview" className="mt-12 overflow-hidden rounded-xl bg-surface ring-1 ring-line">
      <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="p-6 md:p-8">
          <p className="kicker">{course.mentor}</p>
          <h3 className="font-sans mt-3 text-2xl font-medium tracking-tight text-fg md:text-3xl">
            {course.title}
          </h3>
          <p className="mt-3 text-sm text-muted">
            {course.level} · {course.hours}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{course.hook}</p>
          <ol className="mt-8 space-y-5">
            {course.modules.map((m, i) => (
              <li key={m.title} className="border-t border-line pt-4">
                <p className="text-xs tabular-nums text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-fg">{m.title}</p>
                <p className="mt-1 text-sm text-muted">{m.lessons.join(" → ")}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-line bg-elevated/40 p-6 md:border-t-0 md:border-l md:p-8">
          <div>
            <p className="kicker">Start this course</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Sign in to keep it, then speak with Lucien — a digital neural
              mentor, not a person.
            </p>
          </div>
          <SignInGate
            fallback={
              <div>
                <SignInStack callbackURL="/#generate" />
                <p className="mt-4 text-center text-xs text-subtle">
                  Invite-only cohort · end-to-end encrypted
                </p>
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              {savedId ? (
                <p className="text-sm text-fg">Saved to your mind. Begin when ready.</p>
              ) : (
                <Button size="lg" onClick={onSave} disabled={saving}>
                  {saving ? "Saving…" : "Save to my account"}
                </Button>
              )}
              <Button size="lg" variant="ghost" onClick={onSpeak}>
                Speak with Lucien
                <ArrowRight className="size-4" />
              </Button>
              <Link
                to="/tour"
                className={cn(
                  "text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline",
                )}
              >
                or enter the 3D walkthrough
              </Link>
            </div>
          </SignInGate>
        </div>
      </div>
    </div>
  );
}
