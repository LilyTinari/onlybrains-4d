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
    float twinkle = 0.7 + 0.3 * sin(uTime * (1.05 + aSeed * 0.8) + aSeed * 14.0);
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
    float fire = pow(max(0.0, sin(uTime * 1.55 + aSeed * 42.0)), 12.0);
    float waveR = fract(uTime * 0.11) * 3.6;
    float wave = exp(-abs(radial - waveR) * 5.2) * ease;
    float radialReveal = smoothstep(uDensity * 1.2 + 0.22, uDensity * 0.35, radial / 4.4);
    vAlpha = twinkle * mix(0.42, 1.0, uDensity) * mix(0.28, 1.0, radialReveal) * uIntro;
    vAlpha *= 1.0 + fire * 1.7 + wave * 1.35;
    vColor = mix(vColor, vec3(0.92, 0.97, 1.0), clamp(fire * 0.55 + wave * 0.4, 0.0, 1.0));

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float sizeBoost = mix(0.55, 1.0, ease) * (1.0 + fire * 0.85 + wave * 0.55);
    gl_PointSize = clamp(aSize * twinkle * uIntro * sizeBoost * (250.0 / -mvPosition.z), 1.0, 86.0);
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
    float pulse = fract(uTime * 0.19 + vSeed);
    float spark = smoothstep(0.12, 0.0, abs(vAlong - pulse));
    float trail = smoothstep(0.28, 0.0, mod(vAlong - pulse + 1.0, 1.0));
    float base = 0.1 + 0.06 * sin(uTime * 2.1 + vSeed * 9.0);
    float a = (base + spark * 0.9 + trail * 0.28) * vAlpha;
    vec3 col = mix(vec3(0.72, 0.82, 0.86), vec3(0.95, 0.98, 1.0), spark);
    gl_FragColor = vec4(col, a);
  }
`;

const sparkVert = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aSeed;
  uniform float uTime;
  uniform float uGather;
  varying float vGlow;

  void main() {
    float t = fract(uTime * (0.16 + aSeed * 0.12) + aSeed);
    float ease = smoothstep(0.02, 0.12, t) * (1.0 - smoothstep(0.88, 1.0, t));
    vec3 p = mix(aStart, aEnd, t);
    vGlow = ease * uGather;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp((5.5 + ease * 9.0) * (220.0 / -mv.z), 1.0, 28.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const sparkFrag = /* glsl */ `
  varying float vGlow;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r = dot(uv, uv);
    if (r > 1.0) discard;
    float glow = exp(-r * 2.6);
    gl_FragColor = vec4(0.93, 0.97, 1.0, glow * vGlow);
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
      const radius = 0.68 + seed * 0.42;
      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius * 1.18;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
      const c = neural.clone().lerp(ivory, seed * 0.55);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 8.5 + seed * 7;
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

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const g = ctx.createRadialGradient(256, 256, 12, 256, 256, 256);
  g.addColorStop(0, "rgba(232, 244, 248, 0.95)");
  g.addColorStop(0.18, "rgba(158, 201, 212, 0.42)");
  g.addColorStop(0.48, "rgba(158, 201, 212, 0.1)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
        blending={THREE.AdditiveBlending}
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
  const sparkGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const dummy = new Float32Array(data.pairCount * 3);
    g.setAttribute("position", new THREE.BufferAttribute(dummy, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(data.starts, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(data.ends, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.sparkSeed, 1));
    return g;
  }, [data]);

  useEffect(
    () => () => {
      lineGeom.dispose();
      sparkGeom.dispose();
    },
    [lineGeom, sparkGeom],
  );

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
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
      <points geometry={sparkGeom} frustumCulled={false}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={sparkVert}
          fragmentShader={sparkFrag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
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

function BrainCore() {
  const glow = useMemo(() => makeGlowTexture(), []);
  const sprite = useRef<THREE.Sprite>(null);
  const gather = useRef(0);

  useEffect(() => () => glow.dispose(), [glow]);

  useFrame((state, dt) => {
    const s = sprite.current;
    if (!s) return;
    gather.current = Math.min(1, gather.current + Math.min(dt, 0.05) / 2.55);
    const k = 1 - (1 - gather.current) ** 3;
    const t = state.clock.elapsedTime;
    const pulse = 2.15 + Math.sin(t * 0.9) * 0.08 + Math.sin(t * 2.3) * 0.03;
    const scale = pulse * (0.35 + 0.65 * k);
    s.scale.set(scale, scale * 0.92, 1);
    const mat = s.material as THREE.SpriteMaterial;
    mat.opacity = 0.55 * k * k;
  });

  return (
    <sprite ref={sprite} scale={[2.15, 2, 1]} renderOrder={0}>
      <spriteMaterial
        map={glow}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.55}
        toneMapped={false}
      />
    </sprite>
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
      <BrainCore />
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
