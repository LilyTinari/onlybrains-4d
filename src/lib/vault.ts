import { createServerFn } from "@tanstack/react-start";
import {
  KINDS,
  brains as catalog,
  type BorrowedBrain,
  type BrainKind,
} from "@/lib/bab";

export type VaultSnapshot = {
  ok: boolean;
  live: boolean;
  source: "vault" | "catalog";
  brains: BorrowedBrain[];
  error?: string;
  hooked: boolean;
};

function env(key: string) {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function clip(s: unknown, n: number) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function num(obj: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function kindOf(raw: Record<string, unknown>): BrainKind {
  const k = str(raw, ["kind", "type", "brain_kind", "class"]).toLowerCase();
  if (KINDS.includes(k as BrainKind)) return k as BrainKind;
  if (raw.agent || raw.agent_id) return "agent";
  if (raw.company || raw.org || raw.organization) return "company";
  if (raw.system && !raw.specialist) return "system";
  if (raw.domain && !raw.specialist) return "domain";
  return "specialist";
}

function lessonsOf(raw: Record<string, unknown>): string[] {
  const inject = rec(raw.inject);
  const list =
    (Array.isArray(raw.injectLessons) && raw.injectLessons) ||
    (Array.isArray(raw.lessons) && raw.lessons) ||
    (inject && Array.isArray(inject.lessons) && inject.lessons) ||
    [];
  return list
    .map((l) => clip(l, 90))
    .filter(Boolean)
    .slice(0, 5);
}

export function normalizeBrain(raw: unknown, fallbackIndex = 0): BorrowedBrain | null {
  const obj = rec(raw);
  if (!obj) return null;
  const inner = rec(obj.brain) ?? obj;
  const name = clip(str(inner, ["name", "title", "label", "brain_name"]), 48);
  if (!name) return null;
  const id = clip(str(inner, ["id", "brain_id", "slug", "key"]), 64) || slug(name) || `vault-${fallbackIndex}`;
  const inject = rec(inner.inject);
  const injectTitle =
    clip(str(inner, ["injectTitle", "inject_title"]), 80) ||
    (inject ? clip(str(inject, ["title"]), 80) : "") ||
    `${name} lens · injected`;
  const lessons = lessonsOf(inner);
  const minutes = num(inner, ["injectMinutes", "inject_minutes", "minutes"]) ?? num(inject ?? {}, ["minutes"]) ?? 16;
  const groundedRaw = inner.grounded;
  const grounded =
    groundedRaw === true ||
    groundedRaw === "true" ||
    (typeof groundedRaw === "object" && groundedRaw !== null);
  return {
    id,
    name,
    kind: kindOf(inner),
    domain: clip(str(inner, ["domain", "field", "vertical"]), 48) || "Unspecified",
    specialist: clip(str(inner, ["specialist", "role", "lens_name"]), 80) || name,
    system: clip(str(inner, ["system", "loop", "architecture"]), 80) || "Predicted field",
    company: clip(str(inner, ["company", "org", "organization"]), 80) || undefined,
    agent: clip(str(inner, ["agent", "agent_name"]), 80) || undefined,
    predictedFrom: clip(str(inner, ["predictedFrom", "predicted_from", "source_graph", "from"]), 160) || "Brain vault",
    lens: clip(str(inner, ["lens", "thesis", "rule", "summary"]), 220) || "A borrowed field. Not a person.",
    injectTitle,
    injectLessons: lessons.length ? lessons : ["Name the constraint", "Inject it into the next guess", "Give it back"],
    injectMinutes: Math.min(90, Math.max(8, Math.round(minutes))),
    source: "vault",
    nodes: num(inner, ["nodes", "node_count", "size"]),
    grounded,
    streamedAt: clip(str(inner, ["streamedAt", "streamed_at", "updated_at", "ts"]), 40) || new Date().toISOString(),
  };
}

export function normalizePayload(raw: unknown): BorrowedBrain[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((row, i) => normalizeBrain(row, i)).filter((b): b is BorrowedBrain => Boolean(b));
  }
  const obj = rec(raw);
  if (!obj) return [];
  const list =
    (Array.isArray(obj.brains) && obj.brains) ||
    (Array.isArray(obj.items) && obj.items) ||
    (Array.isArray(obj.data) && obj.data) ||
    (Array.isArray(obj.records) && obj.records) ||
    (Array.isArray(obj.vault) && obj.vault) ||
    (Array.isArray(obj.results) && obj.results) ||
    [];
  const agents =
    (Array.isArray(obj.agents) && obj.agents) ||
    (Array.isArray(obj.mentors) && obj.mentors) ||
    [];
  const rows = [...list, ...agents];
  return rows.map((row, i) => {
    const brain = normalizeBrain(row, i);
    if (!brain) return null;
    const fromAgentList = i >= list.length && brain.kind !== "company";
    return fromAgentList && brain.kind === "specialist" ? { ...brain, kind: "agent" as const, agent: brain.agent || brain.name } : brain;
  }).filter((b): b is BorrowedBrain => Boolean(b));
}

async function fetchVault(url: string, key: string): Promise<VaultSnapshot> {
  try {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${key}`,
        "x-api-key": key,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        ok: false,
        live: false,
        source: "catalog",
        brains: catalog,
        hooked: true,
        error: `Vault ${res.status}`,
      };
    }
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line) as unknown;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
    const brains = normalizePayload(parsed);
    if (!brains.length) {
      return {
        ok: true,
        live: true,
        source: "vault",
        brains: catalog,
        hooked: true,
        error: "Vault returned no brains — showing catalog",
      };
    }
    return { ok: true, live: true, source: "vault", brains, hooked: true };
  } catch (err) {
    return {
      ok: false,
      live: false,
      source: "catalog",
      brains: catalog,
      hooked: true,
      error: err instanceof Error ? err.message : "Vault unreachable",
    };
  }
}

async function pullVault(): Promise<VaultSnapshot> {
  const url = env("BRAIN_VAULT_URL");
  const key = env("BRAIN_VAULT_KEY") || env("BRAIN_VAULT_API_KEY");
  if (!url || !key) {
    return { ok: true, live: false, source: "catalog", brains: catalog, hooked: false };
  }
  return fetchVault(url, key);
}

export const loadVault = createServerFn({ method: "GET" }).handler(async () => pullVault());

export const connectVault = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { url?: string; key?: string };
    const url = clip(data?.url, 400);
    const key = clip(data?.key, 500);
    if (!/^https?:\/\//i.test(url)) throw new Error("Vault URL must start with http.");
    if (key.length < 4) throw new Error("Paste the vault API key.");
    return { url, key };
  })
  .handler(async ({ data }) => fetchVault(data.url, data.key));

export async function vaultSseResponse() {
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const snap = await pullVault();
      send("status", {
        live: snap.live,
        hooked: snap.hooked,
        source: snap.source,
        error: snap.error ?? null,
        count: snap.brains.length,
      });
      for (const brain of snap.brains) {
        send("brain", brain);
        await new Promise((r) => setTimeout(r, snap.live ? 80 : 220));
        if (closed) return;
      }
      send("idle", { live: snap.live, source: snap.source });
      if (!snap.live) {
        closed = true;
        controller.close();
        return;
      }
      const tick = setInterval(async () => {
        if (closed) {
          clearInterval(tick);
          return;
        }
        const next = await pullVault();
        send("status", {
          live: next.live,
          hooked: next.hooked,
          source: next.source,
          error: next.error ?? null,
          count: next.brains.length,
        });
        for (const brain of next.brains) send("brain", brain);
      }, 12000);
      const keepalive = setInterval(() => send("ping", { t: Date.now() }), 15000);
      const stop = () => {
        closed = true;
        clearInterval(tick);
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      // @ts-expect-error attach for cancel
      controller._stop = stop;
    },
    cancel() {
      closed = true;
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
