import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askLucien, type ChatTurn } from "@/lib/lucien";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const GREETING: ChatTurn = {
  role: "assistant",
  content:
    "I am Lucien — a digital neural field, not a person. Tell me what you are trying to become: a sharper mind, a longer healthspan, a quieter fortune, or a skill that compounds. I will find the shortest honest path.",
};

export function LucienPanel() {
  const open = useAppStore((s) => s.lucienOpen);
  const setOpen = useAppStore((s) => s.setLucienOpen);
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, setOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const res = await askLucien({ data: { messages: next } });
      if (res.ok) {
        setMessages([...next, { role: "assistant", content: res.text }]);
      } else {
        setError(res.error);
      }
    } catch {
      setError("The link to Lucien dropped. Try once more.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-bg/50 transition-opacity duration-fast",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface ring-1 ring-fg/10 transition-transform duration-panel ease-smooth",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucien-title"
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/lucien-core.jpg"
              alt=""
              className="size-11 rounded-full object-cover ring-1 ring-neural/40"
            />
            <div>
              <p className="kicker">Digital mentor</p>
              <h2 id="lucien-title" className="font-display text-2xl italic text-fg">
                Lucien
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center text-muted hover:text-fg"
            aria-label="Close Lucien"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
          {messages.map((m, i) => (
            <div key={`${m.role}-${i}`}>
              {m.role === "assistant" ? (
                <p className="font-display text-xl leading-snug text-fg italic">
                  {m.content}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-muted">{m.content}</p>
              )}
            </div>
          ))}
          {busy ? <p className="shimmer text-sm">Listening…</p> : null}
          {error ? <p className="text-sm text-muted">{error}</p> : null}
        </div>

        <form onSubmit={onSubmit} className="border-t border-line p-4">
          <label htmlFor="lucien-input" className="sr-only">
            Message Lucien
          </label>
          <div className="flex items-end gap-2 rounded-lg bg-elevated p-2 pl-3">
            <textarea
              id="lucien-input"
              ref={inputRef}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="What are you training for?"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-sm text-fg outline-none placeholder:text-subtle"
              suppressHydrationWarning
            />
            <Button
              type="submit"
              size="sm"
              className="size-11 shrink-0 px-0"
              disabled={busy || !draft.trim()}
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
