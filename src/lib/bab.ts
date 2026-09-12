export const KINDS = ["domain", "specialist", "system", "company", "agent"] as const;
export type BrainKind = (typeof KINDS)[number];

export type BorrowedBrain = {
  id: string;
  name: string;
  kind: BrainKind;
  domain: string;
  specialist: string;
  system: string;
  company?: string;
  agent?: string;
  predictedFrom: string;
  lens: string;
  injectTitle: string;
  injectLessons: string[];
  injectMinutes: number;
  source: "catalog" | "vault";
  nodes?: number;
  grounded?: boolean;
  streamedAt?: string;
};

export const brains: BorrowedBrain[] = [
  {
    id: "helix",
    name: "Helix",
    kind: "specialist",
    domain: "Health",
    specialist: "Cellular energy",
    system: "Mitochondrial quality-control loop",
    predictedFrom: "Longevity protocols, bioenergetics, recovery systems",
    lens: "Every claim has to survive a cell, not a slide.",
    injectTitle: "Helix lens · energy before advice",
    injectLessons: [
      "What the cell would refuse",
      "Signal vs noise in a protocol",
      "Inject this into the next habit",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 128,
    grounded: true,
  },
  {
    id: "forge",
    name: "Forge",
    kind: "system",
    domain: "Tech",
    specialist: "Systems architecture",
    system: "Constraint-driven engineering",
    predictedFrom: "Failure modes, interfaces, load-bearing structure",
    lens: "If it cannot fail loudly, it is not a system.",
    injectTitle: "Forge lens · make the failure visible",
    injectLessons: [
      "Name the constraint",
      "The interface that will break first",
      "A test the system cannot cheat",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 96,
    grounded: true,
  },
  {
    id: "atlas",
    name: "Atlas",
    kind: "specialist",
    domain: "Business",
    specialist: "Venture construction",
    system: "Zero-to-funded decision graph",
    predictedFrom: "Sequencing, leverage, irreversible moves",
    lens: "Sequence beats inspiration. The next move has a cost.",
    injectTitle: "Atlas lens · the next irreversible move",
    injectLessons: [
      "What becomes expensive if you're wrong",
      "A move you can reverse vs one you cannot",
      "Who has to believe this by Friday",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 84,
    grounded: true,
  },
  {
    id: "meridian",
    name: "Meridian",
    kind: "domain",
    domain: "Finance",
    specialist: "Compounding",
    system: "Multi-decade capital loop",
    predictedFrom: "Time, risk, and what not to touch",
    lens: "Think in decades. Refuse theatre.",
    injectTitle: "Meridian lens · time as the real asset",
    injectLessons: [
      "What compounds vs what performs",
      "The cost of looking active",
      "A rule you keep when bored",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 72,
    grounded: true,
  },
  {
    id: "synapse",
    name: "Synapse",
    kind: "specialist",
    domain: "Mind",
    specialist: "Retrieval architecture",
    system: "Spaced recall + desirable difficulty",
    predictedFrom: "Cognitive science canon, not learning styles",
    lens: "Fluency is not learning. Make them retrieve.",
    injectTitle: "Synapse lens · retrieve before you explain",
    injectLessons: [
      "A guess that has to be wrong first",
      "Spacing the evolution beat",
      "What we refuse to collect",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 110,
    grounded: true,
  },
  {
    id: "axiom",
    name: "Axiom",
    kind: "system",
    domain: "Proof",
    specialist: "Evidence gates",
    system: "Curriculum graph + dual-source verifier",
    predictedFrom: "Proof cards, blocked claims, honest gaps",
    lens: "If it isn't on a card, it isn't grounded.",
    injectTitle: "Axiom lens · demand the receipt",
    injectLessons: [
      "What would falsify this module",
      "A citation that does not support the sentence",
      "How to challenge the card",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 64,
    grounded: true,
  },
  {
    id: "ledger",
    name: "Ledger",
    kind: "company",
    domain: "Brand",
    specialist: "International consistency",
    system: "Company DNA drift graph",
    company: "Your org graph",
    predictedFrom: "Voice, policy, and regional output that has to match",
    lens: "If a region drifts, name the module. Don't call it a vibe.",
    injectTitle: "Ledger lens · find the drift",
    injectLessons: [
      "What the brand actually forbids",
      "A fluctuation that has a root cause",
      "The card that would catch it next time",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 58,
    grounded: true,
  },
  {
    id: "praxis",
    name: "Praxis",
    kind: "agent",
    domain: "Ops",
    specialist: "Admin handling",
    system: "Mentor-agent shadow loop",
    agent: "Praxis",
    predictedFrom: "Named admin jobs with a proof card — not a replacement speech",
    lens: "An agent only runs a job it can show.",
    injectTitle: "Praxis lens · name the job",
    injectLessons: [
      "What Praxis is allowed to touch",
      "A call that still needs a human",
      "How the shadow gets more accurate",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 44,
    grounded: true,
  },
  {
    id: "neuro",
    name: "Neuro",
    kind: "agent",
    domain: "Mind",
    specialist: "Personal graph",
    system: "Memory-grounded replies",
    agent: "Neuro",
    predictedFrom: "Your sessions and notes — never someone else's",
    lens: "If nothing in the graph fits, the tag does not appear.",
    injectTitle: "Neuro lens · ground it in you",
    injectLessons: [
      "What this learner already covered",
      "A memory that would change the next module",
      "When to stay silent instead of inventing a source",
    ],
    injectMinutes: 16,
    source: "catalog",
    nodes: 90,
    grounded: true,
  },
];

const BAB_KEY = "onlybrains.borrowed-brain";
const BAB_JSON = "onlybrains.borrowed-brain.json";
const VAULT_KEY = "onlybrains.vault-brains";

function parseList(raw: string | null): BorrowedBrain[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b) => b && typeof b === "object" && typeof (b as BorrowedBrain).id === "string") as BorrowedBrain[];
  } catch {
    return [];
  }
}

export function rememberVault(list: BorrowedBrain[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VAULT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function readVault(): BorrowedBrain[] {
  if (typeof window === "undefined") return [];
  try {
    return parseList(window.sessionStorage.getItem(VAULT_KEY));
  } catch {
    return [];
  }
}

export function allBrains(): BorrowedBrain[] {
  const vault = readVault();
  const map = new Map<string, BorrowedBrain>();
  for (const b of brains) map.set(b.id, b);
  for (const b of vault) map.set(b.id, b);
  return [...map.values()];
}

export function brainById(id: string | null | undefined) {
  if (!id) return null;
  return allBrains().find((b) => b.id === id) ?? null;
}

export function writeBorrowed(brain: BorrowedBrain | string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!brain) {
      window.sessionStorage.removeItem(BAB_KEY);
      window.sessionStorage.removeItem(BAB_JSON);
      return;
    }
    const rec = typeof brain === "string" ? brainById(brain) : brain;
    if (!rec) return;
    window.sessionStorage.setItem(BAB_KEY, rec.id);
    window.sessionStorage.setItem(BAB_JSON, JSON.stringify(rec));
  } catch {
    /* ignore */
  }
}

export function readBorrowed(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(BAB_KEY);
  } catch {
    return null;
  }
}

export function readBorrowedBrain(): BorrowedBrain | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BAB_JSON);
    if (raw) {
      const parsed = JSON.parse(raw) as BorrowedBrain;
      if (parsed?.id) return parsed;
    }
    return brainById(window.sessionStorage.getItem(BAB_KEY));
  } catch {
    return brainById(readBorrowed());
  }
}

export function kindLabel(kind: BrainKind) {
  if (kind === "domain") return "Domain";
  if (kind === "specialist") return "Specialist";
  if (kind === "system") return "System";
  if (kind === "company") return "Company";
  return "Agent";
}
