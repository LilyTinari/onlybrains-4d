import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { YEAR_MAX, YEAR_MIN, useAppStore } from "@/lib/store";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uIntro;
  uniform float uDensity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    float twinkle = 0.7 + 0.3 * sin(uTime * (1.05 + aSeed * 0.8) + aSeed * 14.0);
    float radial = length(position) / 4.4;
    float reveal = smoothstep(uDensity * 1.2 + 0.22, uDensity * 0.35, radial);
    vAlpha = twinkle * mix(0.42, 1.0, uDensity) * mix(0.35, 1.0, reveal) * uIntro;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * twinkle * uIntro * (250.0 / -mvPosition.z), 1.0, 64.0);
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

function makeLattice(count: number) {
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

function Lattice({ count }: { count: number }) {
  const year = useAppStore((s) => s.year);
  const density = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  const { positions, colors, sizes, seeds } = useMemo(() => makeLattice(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uDensity: { value: 0.5 },
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
    intro.current = Math.min(1, intro.current + Math.min(dt, 0.05) / 1.85);
    const k = 1 - (1 - intro.current) ** 3;
    uniforms.uTime.value += dt;
    uniforms.uIntro.value = k;
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

function Synapses({ count }: { count: number }) {
  const year = useAppStore((s) => s.year);
  const density = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  const { geometry, pairCount } = useMemo(() => {
    const { positions, coreCount } = makeLattice(count);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < coreCount; i++) {
      pts.push(
        new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]),
      );
    }
    const arr: number[] = [];
    const n = Math.min(pts.length, 90);
    for (let i = 0; i < n; i++) {
      const a = pts[i]!;
      let best = i === 0 ? 1 : 0;
      let bestD = Infinity;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const d = a.distanceToSquared(pts[j]!);
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      const b = pts[best]!;
      arr.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    geometry.setDrawRange(0, 40);
    return { geometry, pairCount: arr.length / 6 };
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const n = Math.floor(16 + density * (pairCount - 16));
    geometry.setDrawRange(0, n * 2);
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#b7d0d8"
        transparent
        opacity={0.16 + density * 0.2}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
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

  useEffect(() => () => glow.dispose(), [glow]);

  useFrame((state) => {
    const s = sprite.current;
    if (!s) return;
    const pulse = 2.15 + Math.sin(state.clock.elapsedTime * 0.9) * 0.08;
    s.scale.set(pulse, pulse * 0.92, 1);
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

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    intro.current = Math.min(1, intro.current + d / 2.05);
    const k = 1 - (1 - intro.current) ** 3;
    const dragging = useAppStore.getState().fieldDragging;
    auto.current += d * (dragging ? 0.012 : 0.048);
    const st = useAppStore.getState();
    const s = smooth.current;
    s.yaw += (st.fieldYaw - s.yaw) * 6.5 * d;
    s.pitch += (st.fieldPitch - s.pitch) * 6.5 * d;
    s.progress += (st.fieldProgress - s.progress) * 2.8 * d;
    const g = group.current;
    if (!g) return;
    g.rotation.y = auto.current + s.yaw - 0.42;
    g.rotation.x = 0.4 + s.pitch + s.progress * 0.42;
    g.rotation.z = 0.06 + s.progress * 0.1;
    g.scale.setScalar(0.56 + 0.44 * k);
  });

  return (
    <group ref={group}>
      <BrainCore />
      <Ring radius={1.55} rotation={[Math.PI / 2.3, 0.2, 0]} speed={[0, 0, 0.08]} />
      <Ring radius={2.2} rotation={[0.48, Math.PI / 3.1, 0.12]} speed={[0.035, 0, 0]} />
      <Lattice count={count} />
      <Synapses count={Math.min(count, 280)} />
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
    intro.current = Math.min(1, intro.current + d / 2.1);
    const k = 1 - (1 - intro.current) ** 3;
    const st = useAppStore.getState();
    const parallax = st.lucienOpen || st.menuOpen ? 0 : 1;
    const s = smooth.current;
    s.mx += (mouse.current.x * parallax - s.mx) * 2.6 * d;
    s.my += (mouse.current.y * parallax - s.my) * 2.6 * d;
    s.progress += (st.fieldProgress - s.progress) * 2.8 * d;
    const baseZ = 3.7 + 3.05 * k + s.progress * 5.8;
    const baseY = 0.42 - 0.28 * k + s.progress * 1.15;
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
      camera={{ position: [0, 0.15, 3.8], fov: 38, near: 0.1, far: 60 }}
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
