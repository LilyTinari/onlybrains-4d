import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AgentBrain } from "@/components/agent-brain";
import { VaultField } from "@/components/vault-field";
import {
  KINDS,
  allBrains,
  brains as catalog,
  kindLabel,
  rememberVault,
  writeBorrowed,
  type BorrowedBrain,
  type BrainKind,
} from "@/lib/bab";
import { connectVault, loadVault } from "@/lib/vault";
import { cn } from "@/lib/utils";

type LogLine = { t: string; text: string };

const URL_KEY = "onlybrains.vault-url";
const KEY_KEY = "onlybrains.vault-key";

function stamp() {
  return new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function maskKey(key: string) {
  if (key.length < 6) return "Hooked";
  return `···${key.slice(-4)}`;
}

function readSession() {
  if (typeof window === "undefined") return { url: "", key: "" };
  try {
    return {
      url: window.sessionStorage.getItem(URL_KEY) ?? "",
      key: window.sessionStorage.getItem(KEY_KEY) ?? "",
    };
  } catch {
    return { url: "", key: "" };
  }
}

export function BabVault() {
  const [kind, setKind] = useState<BrainKind | "all">("all");
  const [list, setList] = useState<BorrowedBrain[]>([]);
  const [selected, setSelected] = useState<BorrowedBrain | null>(null);
  const [live, setLive] = useState(false);
  const [hooked, setHooked] = useState(false);
  const [source, setSource] = useState<"vault" | "catalog">("catalog");
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [connecting, setConnecting] = useState(false);

  function pushLog(text: string) {
    setLog((prev) => [{ t: stamp(), text }, ...prev].slice(0, 18));
  }

  function applySnap(
    snap: {
      live: boolean;
      hooked: boolean;
      source: "vault" | "catalog";
      brains: BorrowedBrain[];
      error?: string;
    },
    note?: string,
  ) {
    setLive(snap.live);
    setHooked(snap.hooked);
    setSource(snap.source);
    setError(snap.error ?? null);
    const merged = mergeBrains(snap.brains);
    rememberVault(merged);
    setList(merged);
    setSelected((cur) => merged.find((b) => b.id === cur?.id) ?? merged[0] ?? null);
    if (note) pushLog(note);
  }

  async function runConnect(nextUrl: string, nextKey: string, silent = false) {
    const trimmedUrl = nextUrl.trim();
    const trimmedKey = nextKey.trim();
    if (trimmedUrl.length < 8 || trimmedKey.length < 4) return;
    setConnecting(true);
    try {
      const snap = await connectVault({ data: { url: trimmedUrl, key: trimmedKey } });
      try {
        window.sessionStorage.setItem(URL_KEY, trimmedUrl);
        window.sessionStorage.setItem(KEY_KEY, trimmedKey);
      } catch {
        /* ignore */
      }
      const uploaded = snap.brains.filter((b) => b.source === "vault").length;
      applySnap(
        snap,
        snap.live
          ? `Vault live · ${uploaded || snap.brains.length} brains uploaded`
          : snap.error ?? "Vault did not accept the key",
      );
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Could not reach the vault");
      pushLog("Connect failed · key never stored in the log");
    } finally {
      setConnecting(false);
      setStreaming(false);
    }
  }

  useEffect(() => {
    let es: EventSource | null = null;
    let cancelled = false;
    const existing = readSession();
    if (existing.url) setUrl(existing.url);
    if (existing.key) setKey(existing.key);

    loadVault()
      .then((snap) => {
        if (cancelled) return;
        if (existing.url && existing.key && !snap.live) {
          void runConnect(existing.url, existing.key, true);
          return;
        }
        applySnap(
          snap,
          snap.live
            ? `Host key live · ${snap.brains.length} brains`
            : "Catalog open · paste your vault URL and API key to upload agents",
        );
        setStreaming(false);
      })
      .catch(() => {
        if (!cancelled) {
          applySnap({ live: false, hooked: false, source: "catalog", brains: catalog }, "Catalog open");
          setStreaming(false);
        }
      });

    try {
      es = new EventSource("/api/vault/stream");
      es.addEventListener("brain", (e) => {
        const brain = JSON.parse((e as MessageEvent).data) as BorrowedBrain;
        if (!brain?.id) return;
        setList((prev) => {
          const map = new Map(prev.map((b) => [b.id, b]));
          map.set(brain.id, brain);
          const next = [...map.values()];
          rememberVault(next);
          return next;
        });
      });
    } catch {
      /* snapshot is enough */
    }

    return () => {
      cancelled = true;
      es?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onConnect(e: FormEvent) {
    e.preventDefault();
    void runConnect(url, key);
  }

  const visible = useMemo(() => {
    const rows = list.length ? list : allBrains();
    if (kind === "all") return rows;
    return rows.filter((b) => b.kind === kind);
  }, [list, kind]);

  const active = selected && visible.find((b) => b.id === selected.id) ? selected : visible[0] ?? null;

  return (
    <section id="bab" className="scroll-mt-24">
      <div className="relative h-[min(82vh,860px)] min-h-[520px] w-full border-b border-line">
        <VaultField brains={visible} selected={active} onSelect={setSelected} />
        <form
          onSubmit={onConnect}
          className="absolute bottom-6 left-5 right-5 z-10 max-w-xl rounded-xl bg-surface/90 p-4 ring-1 ring-line backdrop-blur-md md:left-8"
        >
          <p className="kicker">Plug in the vault</p>
          <p className="mt-2 text-sm text-muted">
            Paste the cloud URL and API key. Agents stream into this field. The key stays in this
            session only — it is never written to the log.
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Vault URL</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-cloud/v1/brains"
              autoComplete="off"
              className="h-11 w-full rounded-full bg-elevated px-4 text-sm text-fg ring-1 ring-line outline-none placeholder:text-subtle focus:ring-fg/40"
            />
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <label className="block flex-1">
              <span className="sr-only">API key</span>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="API key"
                autoComplete="off"
                className="h-11 w-full rounded-full bg-elevated px-4 text-sm text-fg ring-1 ring-line outline-none placeholder:text-subtle focus:ring-fg/40"
              />
            </label>
            <Button type="submit" disabled={connecting} className="sm:h-11">
              {connecting ? "Uploading…" : hooked && live ? "Refresh vault" : "Connect & upload"}
            </Button>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <p className="kicker">BAB · Brain vault</p>
        <h1 className="font-sans text-display mt-4 max-w-3xl font-medium tracking-tight">
          Borrow A Brain.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Drag the field. Click a satellite. Inject a domain, specialist, system, company, or agent
          brain into a course. Not a person — a field you can give back.
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat k="Source" v={source === "vault" ? "Cloud vault" : "Catalog"} />
          <Stat k="Key" v={hooked ? (key ? maskKey(key) : "Host") : "Not set"} />
          <Stat k="Stream" v={live ? "Live" : streaming ? "Opening" : "Idle"} />
          <Stat k="Brains" v={String(visible.length)} />
        </dl>
        <p className="mt-6 text-sm text-subtle">
          {error
            ? error
            : hooked && live
              ? "Agents from your vault are on the field. Catalog brains remain as fallback if a record cannot be normalized."
              : "Host env still works (BRAIN_VAULT_URL + BRAIN_VAULT_KEY). Or paste the key above."}
        </p>

        <div className="mt-12 flex flex-wrap gap-2">
          <FilterChip on={() => setKind("all")} active={kind === "all"} label="All" />
          {KINDS.map((k) => (
            <FilterChip key={k} on={() => setKind(k)} active={kind === k} label={kindLabel(k)} />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((b) => (
              <li key={b.id}>
                <article
                  className={cn(
                    "overflow-hidden rounded-xl bg-surface ring-1 transition-colors",
                    active?.id === b.id ? "ring-neural/50" : "ring-line",
                  )}
                >
                  <AgentBrain
                    id={b.id}
                    className="aspect-[5/4] w-full"
                    interactive
                    selected={active?.id === b.id}
                    count={2400}
                  />
                  <button
                    type="button"
                    onClick={() => setSelected(b)}
                    className="w-full p-5 text-left hover:bg-elevated"
                  >
                    <span className="kicker">{kindLabel(b.kind)}</span>
                    <h2 className="font-display mt-3 text-3xl italic tracking-tight">{b.name}</h2>
                    <p className="mt-1 text-sm text-fg">{b.specialist}</p>
                    <p className="mt-1 text-xs tracking-widest text-subtle uppercase">{b.domain}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{b.lens}</p>
                  </button>
                </article>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-24">
            {active ? (
              <div className="rounded-xl bg-surface p-6 ring-1 ring-line">
                <AgentBrain
                  id={active.id}
                  className="mb-5 aspect-square w-full overflow-hidden rounded-lg ring-1 ring-line"
                  interactive
                  selected
                  count={4800}
                />
                <p className="kicker">
                  {kindLabel(active.kind)} · {active.source === "vault" ? "Vault" : "Catalog"}
                </p>
                <h2 className="font-display mt-3 text-4xl italic tracking-tight">{active.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{active.lens}</p>
                <dl className="mt-6 space-y-3 text-sm">
                  <Row k="Domain" v={active.domain} />
                  <Row k="Specialist" v={active.specialist} />
                  <Row k="System" v={active.system} />
                  {active.company ? <Row k="Company" v={active.company} /> : null}
                  {active.agent ? <Row k="Agent" v={active.agent} /> : null}
                  <Row k="Predicted from" v={active.predictedFrom} />
                  <Row k="Grounded" v={active.grounded ? "Yes — inject wears a module" : "Predicted only"} />
                </dl>
                <p className="kicker mt-8">Inject module</p>
                <p className="mt-2 text-sm text-fg">{active.injectTitle}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-muted">
                  {active.injectLessons.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ol>
                <div className="mt-8 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link to="/" hash="generate" onClick={() => writeBorrowed(active)}>
                      Inject into a course
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/" hash="generate" onClick={() => writeBorrowed(active)}>
                      Inject mid-lesson
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Waiting for the first brain on the stream.</p>
            )}

            <div className="mt-4 rounded-xl bg-elevated p-5 ring-1 ring-line">
              <p className="kicker">Vault log</p>
              <ul className="mt-4 space-y-2 font-sans text-xs leading-relaxed text-subtle">
                {log.length === 0 ? <li>Opening stream…</li> : null}
                {log.map((l, i) => (
                  <li key={`${l.t}-${i}`} className="tabular-nums">
                    <span className="text-muted">{l.t}</span> · {l.text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <p className="mt-16 max-w-2xl text-sm leading-relaxed text-subtle">
          A borrowed brain is a predicted field from the vault or the curriculum graph — not a
          downloaded person. If the vault cannot normalize a record, it is dropped rather than
          displayed.
        </p>
      </div>
    </section>
  );
}

function mergeBrains(incoming: BorrowedBrain[]) {
  const map = new Map<string, BorrowedBrain>();
  for (const b of catalog) map.set(b.id, b);
  for (const b of incoming) map.set(b.id, b);
  return [...map.values()];
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="kicker">{k}</dt>
      <dd className="mt-1 text-lg tracking-tight text-fg">{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line pt-3">
      <dt className="text-subtle">{k}</dt>
      <dd className="text-right text-fg">{v}</dd>
    </div>
  );
}

function FilterChip({ label, active, on }: { label: string; active: boolean; on: () => void }) {
  return (
    <button
      type="button"
      onClick={on}
      className={cn(
        "h-10 rounded-full px-4 text-sm ring-1 transition-colors",
        active ? "bg-fg text-bg ring-fg" : "bg-transparent text-fg ring-line hover:bg-elevated",
      )}
    >
      {label}
    </button>
  );
}
