import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AgentBrainMesh } from "@/components/agent-brain";
import { DigitalBrain } from "@/components/digital-brain";
import { usePrefersReducedMotion } from "@/lib/utils";
import type { BorrowedBrain } from "@/lib/bab";

function Satellite({
  brain,
  index,
  total,
  selected,
  onSelect,
  onHover,
}: {
  brain: BorrowedBrain;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (b: BorrowedBrain) => void;
  onHover: (b: BorrowedBrain | null) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 1.78;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const a = angle + t * 0.07;
    ref.current.position.set(Math.cos(a) * radius, Math.sin(t * 0.65 + index) * 0.14, Math.sin(a) * radius);
    const s = selected ? 0.34 : 0.22;
    const cur = ref.current.scale.x;
    const next = THREE.MathUtils.damp(cur, s, 6, state.clock.getDelta());
    ref.current.scale.setScalar(next);
  });

  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(brain);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover(brain);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHover(null);
      }}
    >
      <mesh>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <AgentBrainMesh id={brain.id} count={1400} selected={selected} />
    </group>
  );
}

function Beam({ fromIndex, total }: { fromIndex: number; total: number }) {
  const attr = useMemo(() => new THREE.BufferAttribute(new Float32Array(6), 3), []);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", attr);
    return g;
  }, [attr]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = (fromIndex / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2 + t * 0.07;
    const radius = 1.78;
    const arr = attr.array as Float32Array;
    arr[0] = Math.cos(a) * radius;
    arr[1] = Math.sin(t * 0.65 + fromIndex) * 0.14;
    arr[2] = Math.sin(a) * radius;
    arr[3] = 0;
    arr[4] = 0.04;
    arr[5] = 0;
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#eceae4" transparent opacity={0.5} />
    </lineSegments>
  );
}

export function VaultField({
  brains,
  selected,
  onSelect,
}: {
  brains: BorrowedBrain[];
  selected: BorrowedBrain | null;
  onSelect: (b: BorrowedBrain) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState<BorrowedBrain | null>(null);
  const shown = brains.slice(0, 16);
  const active = hover ?? selected;

  if (reduced) {
    return (
      <div className="relative flex h-full min-h-[420px] w-full flex-wrap content-center items-center justify-center gap-3 bg-bg p-6">
        {shown.map((b) => (
          <button key={b.id} type="button" onClick={() => onSelect(b)} className="text-neural">
            <DigitalBrain className="size-14" pulse={selected?.id === b.id} />
            <span className="mt-2 block text-xs text-muted">{b.name}</span>
          </button>
        ))}
      </div>
    );
  }

  const selectedIndex = Math.max(0, shown.findIndex((b) => b.id === selected?.id));

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden bg-bg">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.22, 3.15], fov: 36, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#050506"]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[2.2, 1.6, 2.4]} intensity={0.45} color="#c5e6f5" />
        <group scale={1.15}>
          <AgentBrainMesh id={selected?.id ?? "lucien"} count={7800} selected />
        </group>
        {shown.map((b, i) => (
          <Satellite
            key={b.id}
            brain={b}
            index={i}
            total={shown.length}
            selected={selected?.id === b.id}
            onSelect={onSelect}
            onHover={setHover}
          />
        ))}
        {selected && shown.length ? <Beam fromIndex={selectedIndex} total={shown.length} /> : null}
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.1}
          maxDistance={5.4}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent" />
      <div className="pointer-events-none absolute top-5 left-5 right-5 flex items-start justify-between gap-4">
        <p className="kicker">{active ? `${active.name} · drag to orbit` : "Drag to orbit · click an agent brain"}</p>
        {active ? <p className="kicker hidden sm:block">{active.domain}</p> : null}
      </div>
    </div>
  );
}
