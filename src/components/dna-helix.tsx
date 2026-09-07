import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/utils";

export type SkillArea = { name: string; progress: number; color: string };
export type HoveredBase = { pair: number; left: BaseLetter; right: BaseLetter; band: number };

type BaseLetter = "A" | "T" | "G" | "C";

const TURNS = 3.2;
const HEIGHT = 4.4;
const RADIUS = 0.86;
const PAIRS = 36;
const BACKBONE = 160;

const C_NEURAL = new THREE.Color("#9ec9d4");
const C_IVORY = new THREE.Color("#f3efe6");
const C_WARM = new THREE.Color("#c4b49a");
const C_STEEL = new THREE.Color("#8b8d96");
const C_DIM = new THREE.Color("#1c1d21");

const BASE_COLOR: Record<BaseLetter, THREE.Color> = {
  A: C_NEURAL,
  T: C_IVORY,
  G: C_WARM,
  C: C_STEEL,
};

const COMPLEMENT: Record<BaseLetter, BaseLetter> = { A: "T", T: "A", G: "C", C: "G" };
const BONDS: Record<BaseLetter, number> = { A: 2, T: 2, G: 3, C: 3 };

function helixPoint(t: number, strand: 0 | 1, radius = RADIUS) {
  const ang = t * Math.PI * 2 * TURNS + strand * Math.PI;
  const groove = strand === 0 ? 1 : 0.92;
  return new THREE.Vector3(
    Math.cos(ang) * radius * groove,
    (t - 0.5) * HEIGHT,
    Math.sin(ang) * radius * groove,
  );
}

function buildBackbone(strand: 0 | 1) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < BACKBONE; i++) pts.push(helixPoint(i / (BACKBONE - 1), strand));
  return new THREE.CatmullRomCurve3(pts);
}

function sequenceFor(n: number): BaseLetter[] {
  const pool: BaseLetter[] = ["A", "G", "T", "C"];
  return Array.from({ length: n }, (_, i) => pool[(i * 5 + Math.floor(i / 3) * 2) % 4]!);
}

function FitCamera({ pad = 1.16 }: { pad?: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = Math.max(0.45, size.width / Math.max(1, size.height));
    const halfH = HEIGHT * 0.52;
    const halfW = RADIUS + 0.62;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const distH = halfH / Math.tan(vFov / 2);
    const distW = halfW / Math.tan(Math.atan(Math.tan(vFov / 2) * aspect));
    cam.position.set(0.15, 0.06, Math.max(distH, distW) * pad);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, pad]);
  return null;
}

function OrbitRig({
  children,
  interactive,
  reduced,
}: {
  children: ReactNode;
  interactive?: boolean;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const yaw = useRef(0.62);
  const pitch = useRef(0.16);
  const tYaw = useRef(0.62);
  const tPitch = useRef(0.16);
  const zoom = useRef(1);
  const tZoom = useRef(1);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef(0);
  const { gl } = useThree();

  useEffect(() => {
    if (!interactive || reduced) return;
    const el = gl.domElement;
    el.style.touchAction = "none";

    const gap = () => {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return 0;
      const a = pts[0]!;
      const b = pts[1]!;
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const down = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 1) {
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
        el.setPointerCapture(e.pointerId);
      } else {
        dragging.current = false;
        pinch.current = gap();
      }
    };
    const move = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size >= 2) {
        const d = gap();
        if (pinch.current > 8 && d > 8) {
          tZoom.current = THREE.MathUtils.clamp(tZoom.current * (d / pinch.current), 0.72, 1.55);
        }
        pinch.current = d;
        return;
      }
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      tYaw.current += dx * 0.007;
      tPitch.current = THREE.MathUtils.clamp(tPitch.current + dy * 0.0042, -0.48, 0.52);
    };
    const up = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size === 0) dragging.current = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      tZoom.current = THREE.MathUtils.clamp(tZoom.current * (1 - e.deltaY * 0.0011), 0.72, 1.55);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, interactive, reduced]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (!dragging.current && pointers.current.size < 2 && interactive && !reduced) {
      tYaw.current += d * 0.22;
    }
    yaw.current += (tYaw.current - yaw.current) * 0.12;
    pitch.current += (tPitch.current - pitch.current) * 0.12;
    zoom.current += (tZoom.current - zoom.current) * 0.12;
    if (group.current) {
      group.current.rotation.y = yaw.current;
      group.current.rotation.x = pitch.current;
      group.current.scale.setScalar(zoom.current);
    }
  });

  return <group ref={group}>{children}</group>;
}

function Backbone({ strand, color }: { strand: 0 | 1; color: string }) {
  const geom = useMemo(() => {
    const curve = buildBackbone(strand);
    return new THREE.TubeGeometry(curve, 280, 0.048, 20, false);
  }, [strand]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.14}
        metalness={0.28}
        clearcoat={1}
        clearcoatRoughness={0.08}
        sheen={0.55}
        sheenRoughness={0.35}
        sheenColor="#9ec9d4"
        iridescence={0.35}
        iridescenceIOR={1.3}
        emissive={color}
        emissiveIntensity={0.12}
        toneMapped
      />
    </mesh>
  );
}

function Phosphates({ strand, color }: { strand: 0 | 1; color: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 48;

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      dummy.position.copy(helixPoint(t, strand, RADIUS + 0.012));
      dummy.scale.setScalar(0.9 + (i % 3) * 0.06);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count, dummy, strand]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <icosahedronGeometry args={[0.072, 1]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.2}
        metalness={0.45}
        clearcoat={0.8}
        emissive={color}
        emissiveIntensity={0.08}
      />
    </instancedMesh>
  );
}

function Molecule({
  highlight,
  skillAreas,
  onHover,
}: {
  highlight: number | null;
  skillAreas: SkillArea[];
  onHover?: (h: HoveredBase | null) => void;
}) {
  const bases = useRef<THREE.InstancedMesh>(null);
  const rungs = useRef<THREE.InstancedMesh>(null);
  const bonds = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const binormal = useMemo(() => new THREE.Vector3(), []);
  const seq = useMemo(() => sequenceFor(PAIRS), []);

  const pairs = useMemo(
    () =>
      Array.from({ length: PAIRS }, (_, i) => {
        const t = i / (PAIRS - 1);
        const left = helixPoint(t, 0);
        const right = helixPoint(t, 1);
        const axis = new THREE.Vector3(0, left.y, 0);
        return {
          t,
          left,
          right,
          axis,
          band: Math.min(5, Math.floor(t * 6)),
          letter: seq[i]!,
        };
      }),
    [seq],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!bases.current || !rungs.current || !bonds.current) return;
    let bondI = 0;

    for (let i = 0; i < PAIRS; i++) {
      const p = pairs[i]!;
      const skill = skillAreas[p.band] ?? skillAreas[0];
      const lit = skill ? p.t * 100 <= skill.progress + 10 : true;
      const on = highlight == null ? lit : p.band === highlight;
      const breath = 1 + Math.sin(t * 1.15 + i * 0.22) * (on ? 0.035 : 0.01);
      const s = (on ? 1 : 0.42) * breath;
      const leftLetter = p.letter;
      const rightLetter = COMPLEMENT[leftLetter];

      dir.subVectors(p.axis, p.left);
      const leftLen = dir.length();
      dummy.position.copy(p.left).addScaledVector(dir.normalize(), leftLen * 0.46);
      q.setFromUnitVectors(up, dir);
      dummy.quaternion.copy(q);
      dummy.scale.set(0.22 * s, leftLen * 0.72, 0.078 * s);
      dummy.updateMatrix();
      bases.current.setMatrixAt(i, dummy.matrix);
      color.copy(on ? BASE_COLOR[leftLetter] : C_DIM);
      bases.current.setColorAt(i, color);

      dir.subVectors(p.axis, p.right);
      const rightLen = dir.length();
      dummy.position.copy(p.right).addScaledVector(dir.normalize(), rightLen * 0.46);
      q.setFromUnitVectors(up, dir);
      dummy.quaternion.copy(q);
      dummy.scale.set(0.22 * s, rightLen * 0.72, 0.078 * s);
      dummy.updateMatrix();
      bases.current.setMatrixAt(PAIRS + i, dummy.matrix);
      color.copy(on ? BASE_COLOR[rightLetter] : C_DIM);
      bases.current.setColorAt(PAIRS + i, color);

      dir.subVectors(p.right, p.left);
      const span = dir.length();
      mid.copy(p.left).add(p.right).multiplyScalar(0.5);
      dummy.position.copy(mid);
      dummy.scale.set(on ? 0.55 : 0.22, span * 0.92, on ? 0.55 : 0.22);
      dummy.quaternion.setFromUnitVectors(up, dir.normalize());
      dummy.updateMatrix();
      rungs.current.setMatrixAt(i, dummy.matrix);
      color.copy(on ? C_IVORY : C_DIM).lerp(C_NEURAL, 0.35);
      rungs.current.setColorAt(i, color);

      const nBonds = BONDS[leftLetter];
      binormal.crossVectors(dir, up);
      if (binormal.lengthSq() < 0.01) binormal.set(1, 0, 0);
      else binormal.normalize();
      for (let b = 0; b < 3; b++) {
        const active = b < nBonds;
        const offset = (b - (nBonds - 1) / 2) * 0.046;
        dummy.position.copy(mid).addScaledVector(binormal, active ? offset : 0);
        dummy.scale.set(active && on ? 1 : 0.001, span * 0.28, active && on ? 1 : 0.001);
        dummy.quaternion.setFromUnitVectors(up, dir);
        dummy.updateMatrix();
        bonds.current.setMatrixAt(bondI, dummy.matrix);
        color.copy(C_IVORY).lerp(C_NEURAL, 0.4);
        bonds.current.setColorAt(bondI, color);
        bondI += 1;
      }
    }

    bases.current.instanceMatrix.needsUpdate = true;
    rungs.current.instanceMatrix.needsUpdate = true;
    bonds.current.instanceMatrix.needsUpdate = true;
    if (bases.current.instanceColor) bases.current.instanceColor.needsUpdate = true;
    if (rungs.current.instanceColor) rungs.current.instanceColor.needsUpdate = true;
    if (bonds.current.instanceColor) bonds.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={bases}
        args={[undefined, undefined, PAIRS * 2]}
        castShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          const id = e.instanceId;
          if (id == null || !onHover) return;
          const pair = id % PAIRS;
          const p = pairs[pair];
          if (!p) return;
          onHover({ pair, left: p.letter, right: COMPLEMENT[p.letter], band: p.band });
        }}
        onPointerOut={() => onHover?.(null)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          roughness={0.22}
          metalness={0.18}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
          sheen={0.4}
          sheenColor="#d7e4ea"
          toneMapped
        />
      </instancedMesh>
      <instancedMesh ref={rungs} args={[undefined, undefined, PAIRS]}>
        <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
        <meshPhysicalMaterial roughness={0.3} metalness={0.4} transparent opacity={0.35} />
      </instancedMesh>
      <instancedMesh ref={bonds} args={[undefined, undefined, PAIRS * 3]}>
        <cylinderGeometry args={[0.011, 0.011, 1, 8]} />
        <meshPhysicalMaterial
          roughness={0.12}
          metalness={0.2}
          emissive="#e8eef0"
          emissiveIntensity={0.18}
          transparent
          opacity={0.8}
        />
      </instancedMesh>
    </group>
  );
}

function Reader({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m || reduced) return;
    const t = (state.clock.elapsedTime * 0.045) % 1;
    const p = helixPoint(t, 0, RADIUS + 0.04);
    const p2 = helixPoint(t, 1, RADIUS + 0.04);
    m.position.set(0, p.y, 0);
    m.lookAt(p.x + p2.x, p.y, p.z + p2.z);
    m.rotation.z = t * Math.PI * 2 * TURNS;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[RADIUS + 0.05, 0.01, 10, 64]} />
      <meshBasicMaterial color="#d7e4ea" transparent opacity={0.45} />
    </mesh>
  );
}

function Scene({
  interactive,
  highlight,
  skillAreas,
  reduced,
  onHover,
}: {
  interactive?: boolean;
  highlight: number | null;
  skillAreas: SkillArea[];
  reduced: boolean;
  onHover?: (h: HoveredBase | null) => void;
}) {
  return (
    <>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 10, 22]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#e4eef1", "#121316", 0.7]} />
      <directionalLight position={[4.2, 6.2, 5]} intensity={2.15} color="#f4f1ea" />
      <pointLight position={[-3.4, 1.6, 3.2]} intensity={12} color="#9ec9d4" distance={14} />
      <pointLight position={[2.4, -2.2, 4]} intensity={7} color="#eceae4" distance={12} />
      <spotLight position={[0, 7, 1.5]} angle={0.5} penumbra={0.85} intensity={18} color="#eef3f4" distance={18} />
      <FitCamera />
      <OrbitRig interactive={interactive} reduced={reduced}>
        <Backbone strand={0} color="#9ec9d4" />
        <Backbone strand={1} color="#eceae4" />
        <Phosphates strand={0} color="#7aa8b3" />
        <Phosphates strand={1} color="#d8d4cc" />
        <Molecule highlight={highlight} skillAreas={skillAreas} onHover={onHover} />
        <Reader reduced={reduced} />
      </OrbitRig>
      <ContactShadows
        position={[0, -HEIGHT * 0.55, 0]}
        opacity={0.42}
        scale={7}
        blur={2.6}
        far={4}
        color="#000000"
      />
    </>
  );
}

export function DNAHelix({
  skillAreas,
  height = 420,
  interactive = true,
  highlight = null,
  fill = false,
}: {
  skillAreas: SkillArea[];
  height?: number;
  interactive?: boolean;
  highlight?: number | null;
  fill?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState<HoveredBase | null>(null);
  const onHover = useCallback((h: HoveredBase | null) => {
    setHover((prev) => {
      if (!h && !prev) return prev;
      if (h && prev && h.pair === prev.pair) return prev;
      return h;
    });
  }, []);

  return (
    <div
      className={
        fill
          ? "absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          : "relative w-full cursor-grab touch-none active:cursor-grabbing"
      }
      style={fill ? undefined : { height }}
    >
      <Canvas
        camera={{ position: [0.15, 0.06, 7.2], fov: 28, near: 0.1, far: 48 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        style={{ width: "100%", height: "100%", background: "#050506", display: "block" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050506", 1);
        }}
      >
        <Scene
          interactive={interactive && !reduced}
          highlight={highlight}
          skillAreas={skillAreas}
          reduced={reduced}
          onHover={onHover}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-4">
        <p className="kicker">
          {hover
            ? `Pair ${String(hover.pair + 1).padStart(2, "0")} · ${hover.left}–${hover.right}`
            : "Drag · pinch · scroll"}
        </p>
        <p className="hidden text-[10px] tracking-[0.22em] text-subtle uppercase sm:block">
          A–T · G–C
        </p>
      </div>
    </div>
  );
}

export default DNAHelix;
