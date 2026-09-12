export type LatticeKind = "cloud" | "helix" | "forge" | "atlas" | "ring" | "sparse" | "grid" | "quantum";

export type BrainSignature = {
  id: string;
  lattice: LatticeKind;
  lobes: 1 | 2;
  split: number;
  rx: number;
  ry: number;
  rz: number;
  gyri: [number, number, number];
  spin: number;
  phase: number;
  syn: number;
  ivory: number;
  pulse: number;
};

const KNOWN: Record<string, Partial<BrainSignature>> = {
  lucien: { lattice: "cloud", lobes: 2, syn: 0.95, ivory: 0.32, pulse: 1, spin: 0.055 },
  helix: { lattice: "helix", lobes: 2, ry: 1.05, syn: 0.7, ivory: 0.2, pulse: 1.15 },
  forge: { lattice: "forge", lobes: 1, syn: 0.35, ivory: 0.12, pulse: 0.7, spin: 0.04 },
  atlas: { lattice: "atlas", lobes: 1, ry: 0.72, syn: 0.45, ivory: 0.28, spin: 0.03 },
  meridian: { lattice: "ring", lobes: 1, syn: 0.5, ivory: 0.55, pulse: 0.55, spin: 0.025 },
  muse: { lattice: "cloud", lobes: 2, gyri: [9, 5, 13], ivory: 0.62, pulse: 1.3, spin: 0.11 },
  synapse: { lattice: "cloud", lobes: 2, syn: 1, ivory: 0.22, pulse: 1.4, gyri: [11, 8, 6] },
  quanta: { lattice: "quantum", lobes: 2, syn: 0.6, ivory: 0.45, pulse: 1.6, spin: 0.14 },
  nova: { lattice: "sparse", lobes: 1, rx: 0.95, ry: 0.95, rz: 0.95, syn: 0.25, ivory: 0.4 },
  genome: { lattice: "helix", lobes: 2, gyri: [14, 9, 4], syn: 0.8, ivory: 0.18 },
  terra: { lattice: "cloud", lobes: 2, ry: 0.7, rz: 0.85, ivory: 0.3, pulse: 0.65 },
  axiom: { lattice: "sparse", lobes: 1, syn: 0.2, ivory: 0.72, pulse: 0.5, spin: 0.02 },
  ledger: { lattice: "grid", lobes: 1, syn: 0.3, ivory: 0.5, spin: 0.02 },
  praxis: { lattice: "atlas", lobes: 1, syn: 0.4, ivory: 0.25, pulse: 0.9 },
  neuro: { lattice: "cloud", lobes: 2, syn: 0.95, ivory: 0.15, pulse: 1.25, gyri: [8, 12, 7] },
  lyra: { lattice: "helix", lobes: 1, syn: 0.55, ivory: 0.48 },
  prism: { lattice: "quantum", lobes: 2, ivory: 0.6, pulse: 1.2 },
  solace: { lattice: "cloud", lobes: 2, pulse: 0.4, spin: 0.02, ivory: 0.4 },
  cipher: { lattice: "forge", lobes: 1, syn: 0.15, ivory: 0.2, pulse: 0.6 },
  vesper: { lattice: "sparse", lobes: 1, ivory: 0.7, pulse: 0.35, spin: 0.015 },
  pulse: { lattice: "ring", lobes: 1, pulse: 1.7, syn: 0.6 },
  loom: { lattice: "helix", lobes: 2, ivory: 0.55, gyri: [5, 14, 8] },
  nadir: { lattice: "sparse", lobes: 1, ry: 0.55, ivory: 0.35, spin: 0.02 },
  ember: { lattice: "ring", lobes: 1, pulse: 1.35, ivory: 0.42 },
  halo: { lattice: "ring", lobes: 1, ivory: 0.8, pulse: 0.5, syn: 0.7 },
  origin: { lattice: "forge", lobes: 1, syn: 0.25, ivory: 0.15, pulse: 0.55, spin: 0.02 },
  kepler: { lattice: "ring", lobes: 1, ivory: 0.38, pulse: 0.7, syn: 0.5, spin: 0.03 },
};

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

const LATTICES: LatticeKind[] = ["cloud", "helix", "forge", "atlas", "ring", "sparse", "grid", "quantum"];

export function signatureFor(id: string): BrainSignature {
  const n = hash(id || "brain");
  const fallback: BrainSignature = {
    id,
    lattice: LATTICES[n % LATTICES.length]!,
    lobes: n % 5 === 0 ? 1 : 2,
    split: 0.18 + ((n >> 3) % 10) / 80,
    rx: 0.68 + ((n >> 5) % 12) / 80,
    ry: 0.86 + ((n >> 7) % 14) / 80,
    rz: 0.58 + ((n >> 9) % 12) / 80,
    gyri: [6 + (n % 8), 7 + ((n >> 2) % 7), 5 + ((n >> 4) % 9)],
    spin: 0.025 + ((n >> 6) % 10) / 220,
    phase: (n % 628) / 100,
    syn: 0.35 + ((n >> 8) % 8) / 12,
    ivory: ((n >> 4) % 70) / 100,
    pulse: 0.6 + ((n >> 1) % 10) / 12,
  };
  return { ...fallback, ...KNOWN[id], id };
}

function gyriWarp(theta: number, phi: number, gyri: [number, number, number], seed: number) {
  return (
    1 +
    0.11 * Math.sin(theta * gyri[0] + seed) +
    0.07 * Math.sin(phi * gyri[1] - seed * 3) +
    0.045 * Math.sin(theta * gyri[2] + phi * 5)
  );
}

function sampleCloud(
  rnd: () => number,
  sig: BrainSignature,
  rind: boolean,
): { x: number; y: number; z: number; lobe: number; seed: number } {
  const seed = rnd();
  const lobe = sig.lobes === 1 ? 0 : seed > 0.5 ? 1 : -1;
  const theta = rnd() * Math.PI * 2;
  const phi = Math.acos(2 * rnd() - 1);
  const g = gyriWarp(theta, phi, sig.gyri, seed);
  const r = rind ? 0.92 + rnd() * 0.1 : Math.pow(rnd(), 0.72) * 0.78;
  return {
    x: Math.sin(phi) * Math.cos(theta) * sig.rx * r * g + lobe * sig.split,
    y: Math.cos(phi) * sig.ry * r * g,
    z: Math.sin(phi) * Math.sin(theta) * sig.rz * r * g,
    lobe,
    seed,
  };
}

function growArbor(
  rnd: () => number,
  sig: BrainSignature,
  start: { x: number; y: number; z: number },
  steps: number,
): number[] {
  const out: number[] = [];
  const branches: { x: number; y: number; z: number; dx: number; dy: number; dz: number; left: number }[] = [];
  let x = start.x;
  let y = start.y;
  let z = start.z;
  const inward = Math.hypot(x - (start.x > 0 ? sig.split : -sig.split), y, z) || 1;
  let dx = -(x - (start.x > 0 ? sig.split : -sig.split)) / inward;
  let dy = -y / inward;
  let dz = -z / inward;
  for (let s = 0; s < steps; s++) {
    const nx = x + dx * 0.055 + (rnd() - 0.5) * 0.018;
    const ny = y + dy * 0.055 + (rnd() - 0.5) * 0.018;
    const nz = z + dz * 0.055 + (rnd() - 0.5) * 0.018;
    out.push(x, y, z, nx, ny, nz);
    x = nx;
    y = ny;
    z = nz;
    const curl = 0.18 * Math.sin(s * 0.35 + sig.phase);
    dx = dx * 0.86 + curl * 0.2 + (rnd() - 0.5) * 0.12;
    dy = dy * 0.86 + (rnd() - 0.5) * 0.1;
    dz = dz * 0.86 - curl * 0.2 + (rnd() - 0.5) * 0.12;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len;
    dy /= len;
    dz /= len;
    if (rnd() < 0.16 && s > 4 && s < steps - 6) {
      branches.push({
        x,
        y,
        z,
        dx: dx + (rnd() - 0.5) * 0.8,
        dy: dy + (rnd() - 0.5) * 0.8,
        dz: dz + (rnd() - 0.5) * 0.8,
        left: 8 + Math.floor(rnd() * 10),
      });
    }
  }
  for (const b of branches) {
    let bx = b.x;
    let by = b.y;
    let bz = b.z;
    let bdx = b.dx;
    let bdy = b.dy;
    let bdz = b.dz;
    const bl = Math.hypot(bdx, bdy, bdz) || 1;
    bdx /= bl;
    bdy /= bl;
    bdz /= bl;
    for (let s = 0; s < b.left; s++) {
      const nx = bx + bdx * 0.04 + (rnd() - 0.5) * 0.012;
      const ny = by + bdy * 0.04 + (rnd() - 0.5) * 0.012;
      const nz = bz + bdz * 0.04 + (rnd() - 0.5) * 0.012;
      out.push(bx, by, bz, nx, ny, nz);
      bx = nx;
      by = ny;
      bz = nz;
    }
  }
  return out;
}

export function buildLattice(sig: BrainSignature, count: number) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const lobes = new Float32Array(count);
  const roles = new Float32Array(count);
  const rnd = mulberry(hash(sig.id) || 1);
  const somaCount = Math.floor(count * 0.22);

  for (let i = 0; i < count; i++) {
    const rind = i < somaCount;
    let x = 0;
    let y = 0;
    let z = 0;
    let seed = rnd();
    let lobe = 0;

    if (sig.lattice === "forge") {
      const g = 0.11;
      x = (Math.floor(rnd() * 7) - 3) * g;
      y = (Math.floor(rnd() * 7) - 3) * g;
      z = (Math.floor(rnd() * 7) - 3) * g;
      if (rnd() > 0.55) {
        x += (rnd() - 0.5) * 0.04;
        y += (rnd() - 0.5) * 0.04;
        z += (rnd() - 0.5) * 0.04;
      }
    } else if (sig.lattice === "grid") {
      const g = 0.13;
      x = (Math.floor(rnd() * 6) - 2.5) * g;
      y = (Math.floor(rnd() * 5) - 2) * g;
      z = (Math.floor(rnd() * 4) - 1.5) * g;
    } else if (sig.lattice === "atlas") {
      const layer = Math.floor(rnd() * 5);
      const a = rnd() * Math.PI * 2;
      const r = 0.18 + rnd() * 0.42;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = (layer - 2) * 0.16 + (rnd() - 0.5) * 0.03;
    } else if (sig.lattice === "ring") {
      const a = rnd() * Math.PI * 2;
      const tube = 0.16 + rnd() * 0.08;
      const R = 0.48;
      const ta = rnd() * Math.PI * 2;
      x = (R + tube * Math.cos(ta)) * Math.cos(a);
      y = tube * Math.sin(ta) * 0.7;
      z = (R + tube * Math.cos(ta)) * Math.sin(a);
    } else if (sig.lattice === "helix") {
      lobe = sig.lobes === 1 ? 0 : seed > 0.5 ? 1 : -1;
      const t = rnd();
      const a = t * Math.PI * 6 + (lobe > 0 ? 0 : Math.PI);
      const r = 0.28 + 0.08 * Math.sin(t * Math.PI * sig.gyri[0]);
      x = Math.cos(a) * r + lobe * sig.split * 0.4;
      y = (t - 0.5) * 1.35;
      z = Math.sin(a) * r;
    } else {
      const s = sampleCloud(rnd, sig, rind);
      x = s.x;
      y = s.y;
      z = s.z;
      lobe = s.lobe;
      seed = s.seed;
      if (sig.lattice === "quantum" && seed > 0.55) {
        x += 0.18;
        y += 0.06;
      }
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    seeds[i] = seed;
    lobes[i] = lobe > 0 ? 1 : 0;
    roles[i] = rind ? 1 : 0;
  }

  const syn: number[] = [];
  const tracts = Math.floor(18 + sig.syn * 28);
  for (let t = 0; t < tracts; t++) {
    const a = t % somaCount;
    const b = Math.floor(rnd() * somaCount);
    const steps = 8;
    const ax = positions[a * 3]!;
    const ay = positions[a * 3 + 1]!;
    const az = positions[a * 3 + 2]!;
    const bx = positions[b * 3]!;
    const by = positions[b * 3 + 1]!;
    const bz = positions[b * 3 + 2]!;
    for (let s = 0; s < steps; s++) {
      const u0 = s / steps;
      const u1 = (s + 1) / steps;
      const dip = Math.sin(u0 * Math.PI) * 0.12;
      syn.push(
        ax + (bx - ax) * u0,
        ay + (by - ay) * u0 - dip,
        az + (bz - az) * u0,
        ax + (bx - ax) * u1,
        ay + (by - ay) * u1 - Math.sin(u1 * Math.PI) * 0.12,
        az + (bz - az) * u1,
      );
    }
  }

  const local = Math.floor(count * sig.syn * 0.05);
  for (let s = 0; s < local; s++) {
    const a = Math.floor(rnd() * count);
    const b = Math.floor(rnd() * count);
    const dx = positions[a * 3]! - positions[b * 3]!;
    const dy = positions[a * 3 + 1]! - positions[b * 3 + 1]!;
    const dz = positions[a * 3 + 2]! - positions[b * 3 + 2]!;
    const d = Math.hypot(dx, dy, dz);
    if (d > 0.08 && d < 0.28) {
      syn.push(
        positions[a * 3]!,
        positions[a * 3 + 1]!,
        positions[a * 3 + 2]!,
        positions[b * 3]!,
        positions[b * 3 + 1]!,
        positions[b * 3 + 2]!,
      );
    }
  }

  const arbors: number[] = [];
  const arborN = 8 + Math.floor(sig.syn * 10);
  for (let i = 0; i < arborN; i++) {
    const idx = Math.floor(rnd() * Math.max(somaCount, 1));
    arbors.push(
      ...growArbor(
        rnd,
        sig,
        { x: positions[idx * 3]!, y: positions[idx * 3 + 1]!, z: positions[idx * 3 + 2]! },
        22 + Math.floor(rnd() * 14),
      ),
    );
  }

  return {
    positions,
    seeds,
    lobes,
    roles,
    synapses: new Float32Array(syn),
    arbors: new Float32Array(arbors),
  };
}

function mulberry(seed: number) {
  let s = seed || 1;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
