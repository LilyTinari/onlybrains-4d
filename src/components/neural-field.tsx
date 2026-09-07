import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { YEAR_MAX, YEAR_MIN, useAppStore } from "@/lib/store";

type LatticeData = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
  coreCount: number;
};

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uIntro;
  uniform float uDensity;
  uniform float uGather;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    float twinkle = 0.9 + 0.1 * sin(uTime * (0.7 + aSeed * 0.4) + aSeed * 14.0);
    float gather = clamp(uGather, 0.0, 1.0);
    float ease = gather * gather * (3.0 - 2.0 * gather);
    float scatter = mix(7.4 + aSeed * 8.2, 1.0, ease);
    float spin = (1.0 - ease) * (2.8 + aSeed * 6.4);
    float c = cos(spin);
    float s = sin(spin);
    vec3 home = position;
    vec3 p = vec3(home.x * c - home.z * s, home.y * mix(1.65, 1.0, ease), home.x * s + home.z * c);
    p *= scatter;
    p.y += (1.0 - ease) * (aSeed - 0.5) * 2.8;

    float radial = length(home);
    float radialReveal = smoothstep(uDensity * 1.2 + 0.22, uDensity * 0.35, radial / 4.4);
    float coreDim = smoothstep(0.45, 1.35, radial);
    vAlpha = twinkle * mix(0.28, 0.58, uDensity) * mix(0.18, 0.7, radialReveal) * uIntro;
    vAlpha *= mix(0.08, 1.0, coreDim);
    vAlpha *= mix(0.18, 1.0, ease);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float sizeBoost = mix(0.26, 0.62, ease);
    gl_PointSize = clamp(aSize * twinkle * uIntro * sizeBoost * (160.0 / -mvPosition.z), 1.0, 14.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r = dot(uv, uv);
    if (r > 1.0) discard;
    float glow = exp(-r * 3.4);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

const synapseVert = /* glsl */ `
  attribute float aAlong;
  attribute float aSeed;
  uniform float uTime;
  uniform float uGather;
  varying float vAlong;
  varying float vSeed;
  varying float vAlpha;

  void main() {
    vAlong = aAlong;
    vSeed = aSeed;
    float ease = uGather * uGather * (3.0 - 2.0 * uGather);
    vAlpha = ease;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const synapseFrag = /* glsl */ `
  uniform float uTime;
  varying float vAlong;
  varying float vSeed;
  varying float vAlpha;
  void main() {
    float pulse = fract(uTime * 0.12 + vSeed);
    float spark = smoothstep(0.06, 0.0, abs(vAlong - pulse));
    float a = (0.07 + spark * 0.12) * vAlpha;
    vec3 col = vec3(0.68, 0.78, 0.82);
    gl_FragColor = vec4(col, a);
  }
`;

function makeLattice(count: number): LatticeData {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const cyan = new THREE.Color("#c5e6f5").convertSRGBToLinear();
  const ivory = new THREE.Color("#f4f4f2").convertSRGBToLinear();
  const gold = new THREE.Color("#a8886c").convertSRGBToLinear();
  const neural = new THREE.Color("#9ec9d4").convertSRGBToLinear();
  const arms = 3;
  const coreCount = Math.floor(count * 0.24);
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const seed = Math.random();
    seeds[i] = seed;
    if (i < coreCount) {
      const t = i / Math.max(coreCount - 1, 1);
      const y = 1 - t * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;
      const radius = 0.95 + seed * 0.38;
      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius * 1.18;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
      const c = neural.clone().lerp(ivory, seed * 0.55);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 2.4 + seed * 1.8;
    } else {
      const k = (i - coreCount) / Math.max(count - coreCount, 1);
      const t = Math.pow(k, 0.62);
      const arm = i % arms;
      const twist = t * Math.PI * 5.7 + (arm * Math.PI * 2) / arms + seed * 0.2;
      const rad = 0.52 + t * 3.75;
      const jitter = (seed - 0.5) * 0.18 * t;
      positions[i * 3] = Math.cos(twist) * rad + jitter;
      positions[i * 3 + 1] = (1 - t) * 0.18 + Math.sin(twist * 2.1) * 0.11 * t + (seed - 0.5) * 0.2 * (1 - t);
      positions[i * 3 + 2] = Math.sin(twist) * rad * 0.84 + jitter;
      const c = ivory.clone().lerp(cyan, 0.32 + t * 0.5);
      if (arm === 1) c.lerp(gold, 0.3 * t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 3 + (1 - t) * 5.8 + seed * 2;
    }
  }

  return { positions, colors, sizes, seeds, coreCount };
}

function buildSynapses(lattice: LatticeData, maxNodes: number, neighbors: number) {
  const { positions, coreCount } = lattice;
  const n = Math.min(coreCount, maxNodes);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    pts.push(new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));
  }

  const pairs: [THREE.Vector3, THREE.Vector3, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i]!;
    const dist: { j: number; d: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      dist.push({ j, d: a.distanceToSquared(pts[j]!) });
    }
    dist.sort((x, y) => x.d - y.d);
    const kMax = Math.min(neighbors, dist.length);
    for (let k = 0; k < kMax; k++) {
      if (dist[k]!.j < i) continue;
      pairs.push([a, pts[dist[k]!.j]!, (i * 0.17 + k * 0.31) % 1]);
    }
  }

  const armStart = coreCount;
  const armN = Math.min(40, Math.floor((positions.length / 3 - coreCount) / 8));
  for (let i = 0; i < armN; i++) {
    const idx = armStart + i * 8;
    if (idx * 3 + 2 >= positions.length) break;
    const a = new THREE.Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      const d = a.distanceToSquared(pts[j]!);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    pairs.push([a, pts[best]!, (i * 0.23) % 1]);
  }

  const pos = new Float32Array(pairs.length * 6);
  const along = new Float32Array(pairs.length * 2);
  const seed = new Float32Array(pairs.length * 2);
  const starts = new Float32Array(pairs.length * 3);
  const ends = new Float32Array(pairs.length * 3);
  const sparkSeed = new Float32Array(pairs.length);

  pairs.forEach((pair, i) => {
    const [a, b, s] = pair;
    pos[i * 6] = a.x;
    pos[i * 6 + 1] = a.y;
    pos[i * 6 + 2] = a.z;
    pos[i * 6 + 3] = b.x;
    pos[i * 6 + 4] = b.y;
    pos[i * 6 + 5] = b.z;
    along[i * 2] = 0;
    along[i * 2 + 1] = 1;
    seed[i * 2] = s;
    seed[i * 2 + 1] = s;
    starts[i * 3] = a.x;
    starts[i * 3 + 1] = a.y;
    starts[i * 3 + 2] = a.z;
    ends[i * 3] = b.x;
    ends[i * 3 + 1] = b.y;
    ends[i * 3 + 2] = b.z;
    sparkSeed[i] = s;
  });

  return { pos, along, seed, starts, ends, sparkSeed, pairCount: pairs.length };
}

function Lattice({ lattice }: { lattice: LatticeData }) {
  const year = useAppStore((s) => s.year);
  const density = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  const { positions, colors, sizes, seeds } = lattice;
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uDensity: { value: 0.5 },
      uGather: { value: 0 },
    }),
    [],
  );
  const intro = useRef(0);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [positions, colors, sizes, seeds]);

  useEffect(() => () => geom.dispose(), [geom]);

  useFrame((_, dt) => {
    intro.current = Math.min(1, intro.current + Math.min(dt, 0.05) / 2.55);
    const k = 1 - (1 - intro.current) ** 3;
    uniforms.uTime.value += dt;
    uniforms.uIntro.value = Math.min(1, k * 1.15);
    uniforms.uGather.value = k;
    uniforms.uDensity.value += (density - uniforms.uDensity.value) * 0.08;
  });

  return (
    <points geometry={geom} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexColors
        toneMapped={false}
      />
    </points>
  );
}

function Synapses({ lattice, mobile }: { lattice: LatticeData; mobile: boolean }) {
  const data = useMemo(
    () => buildSynapses(lattice, mobile ? 48 : 88, mobile ? 2 : 3),
    [lattice, mobile],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGather: { value: 0 },
    }),
    [],
  );
  const lineGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.pos, 3));
    g.setAttribute("aAlong", new THREE.BufferAttribute(data.along, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seed, 1));
    return g;
  }, [data]);

  useEffect(() => () => lineGeom.dispose(), [lineGeom]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uGather.value = useAppStore.getState().opening;
  });

  return (
    <group>
      <lineSegments geometry={lineGeom} frustumCulled={false}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={synapseVert}
          fragmentShader={synapseFrag}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function Ring({
  radius,
  rotation,
  speed,
}: {
  radius: number;
  rotation: [number, number, number];
  speed: [number, number, number];
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.1);
    const mesh = ref.current;
    if (!mesh) return;
    mesh.rotation.x += speed[0] * d;
    mesh.rotation.y += speed[1] * d;
    mesh.rotation.z += speed[2] * d;
  });
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, 0.005, 8, 160]} />
      <meshBasicMaterial color="#d7e4ea" transparent opacity={0.2} toneMapped={false} />
    </mesh>
  );
}

function World({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const auto = useRef(0);
  const intro = useRef(0);
  const smooth = useRef({ yaw: 0, pitch: 0, progress: 0 });
  const count = mobile ? 1600 : 4600;
  const lattice = useMemo(() => makeLattice(count), [count]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    intro.current = Math.min(1, intro.current + d / 2.55);
    const k = 1 - (1 - intro.current) ** 3;
    const st = useAppStore.getState();
    if (Math.abs(st.opening - k) > 0.012) st.setOpening(k);
    const dragging = st.fieldDragging;
    auto.current += d * (dragging ? 0.012 : 0.048);
    const s = smooth.current;
    s.yaw += (st.fieldYaw - s.yaw) * 6.5 * d;
    s.pitch += (st.fieldPitch - s.pitch) * 6.5 * d;
    s.progress += (st.fieldProgress - s.progress) * 2.8 * d;
    const g = group.current;
    if (!g) return;
    g.rotation.y = auto.current + s.yaw - 0.42;
    g.rotation.x = 0.4 + s.pitch + s.progress * 0.42;
    g.rotation.z = 0.06 + s.progress * 0.1;
    g.scale.setScalar(0.92 + 0.08 * k);
  });

  return (
    <group ref={group}>
      <Ring radius={1.55} rotation={[Math.PI / 2.3, 0.2, 0]} speed={[0, 0, 0.08]} />
      <Ring radius={2.2} rotation={[0.48, Math.PI / 3.1, 0.12]} speed={[0.035, 0, 0]} />
      <Lattice lattice={lattice} />
      <Synapses lattice={lattice} mobile={mobile} />
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const intro = useRef(0);
  const smooth = useRef({ mx: 0, my: 0, progress: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    intro.current = Math.min(1, intro.current + d / 2.55);
    const k = 1 - (1 - intro.current) ** 3;
    const st = useAppStore.getState();
    const parallax = st.lucienOpen || st.menuOpen ? 0 : 1;
    const s = smooth.current;
    s.mx += (mouse.current.x * parallax - s.mx) * 2.6 * d;
    s.my += (mouse.current.y * parallax - s.my) * 2.6 * d;
    s.progress += (st.fieldProgress - s.progress) * 2.8 * d;
    const baseZ = 12.4 - 5.7 * k + s.progress * 5.8;
    const baseY = 0.18 + 0.08 * k + s.progress * 1.15;
    camera.position.x = s.mx * (0.85 - s.progress * 0.4);
    camera.position.y = baseY - s.my * 0.38;
    camera.position.z = baseZ;
    camera.lookAt(s.mx * 0.12, s.progress * -0.2, 0);
  });

  return null;
}

export default function NeuralField({ onReady }: { onReady?: () => void }) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setMobile(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.18, 12.4], fov: 38, near: 0.1, far: 80 }}
      dpr={mobile ? [1, 1.2] : [1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NoToneMapping;
        requestAnimationFrame(() => onReady?.());
      }}
      style={{ background: "transparent" }}
      className="h-full w-full"
    >
      <CameraRig />
      <World mobile={mobile} />
    </Canvas>
  );
}
