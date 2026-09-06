import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { campusStops } from "@/lib/content";
import { useMediaQuery } from "@/lib/utils";

const WAYPOINTS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [0, 2.4, 9.2], look: [0, 0.3, 0] },
  { pos: [0, 0.5, 3.4], look: [0, 0.15, 0] },
  { pos: [5.2, 1.4, 2.8], look: [2.2, 0.1, 0] },
  { pos: [-1.2, 1.6, -5.4], look: [0, 0.2, 0] },
  { pos: [-5, 1.2, 2.2], look: [-2, 0.1, 0] },
  { pos: [3.4, 2.8, 4.6], look: [0, 0.4, 0] },
  { pos: [0, 3.2, 7.4], look: [0, 0.5, 0] },
];

function fibonacciSphere(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

function Dust({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#9ec9d4" size={0.03} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

function Core() {
  const tex = useTexture("/images/lucien-core.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += Math.min(dt, 0.1) * 0.15;
  });
  return (
    <group ref={group}>
      <sprite scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial color="#9ec9d4" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function Platforms({
  active,
  onPick,
}: {
  active: number;
  onPick: (i: number) => void;
}) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(
    () =>
      campusStops.slice(1).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 3.4, Math.sin(a * 1.4) * 0.35, Math.sin(a) * 3.4);
      }),
    [],
  );

  useFrame((state) => {
    const inst = mesh.current;
    if (!inst) return;
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.position.y += Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.08;
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.setScalar(active === i + 1 ? 1.25 : 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 6]}
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) onPick(e.instanceId + 1);
      }}
    >
      <ringGeometry args={[0.42, 0.52, 48]} />
      <meshBasicMaterial color="#c5e6f5" transparent opacity={0.85} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

function Neurons({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pts = useMemo(() => fibonacciSphere(count, 1.55), [count]);
  useFrame((state) => {
    const inst = mesh.current;
    if (!inst) return;
    const t = state.clock.elapsedTime;
    pts.forEach((p, i) => {
      dummy.position.copy(p).multiplyScalar(1 + Math.sin(t * 0.6 + i) * 0.03);
      dummy.scale.setScalar(0.035);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#e8f4f8" />
    </instancedMesh>
  );
}

function Rig({
  touring,
  stop,
}: {
  touring: boolean;
  stop: number;
}) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    if (!touring) return;
    const d = Math.min(dt, 0.1);
    const wp = WAYPOINTS[stop] ?? WAYPOINTS[0]!;
    target.current.set(...wp.pos);
    aim.current.set(...wp.look);
    camera.position.lerp(target.current, 1.1 * d);
    look.current.lerp(aim.current, 1.1 * d);
    camera.lookAt(look.current);
  });
  return null;
}

export default function CampusScene({
  stop,
  touring,
  onPick,
}: {
  stop: number;
  touring: boolean;
  onPick: (i: number) => void;
}) {
  const mobile = useMediaQuery("(max-width: 640px)");

  return (
    <Canvas
      camera={{ position: [0, 2.4, 9.2], fov: 42, near: 0.1, far: 60 }}
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#050506", 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <ambientLight intensity={0.5} />
      <Dust count={mobile ? 180 : 420} />
      <Suspense fallback={null}>
        <Core />
      </Suspense>
      <Neurons count={mobile ? 80 : 160} />
      <Platforms active={stop} onPick={onPick} />
      <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[3.4, 0.008, 8, 128]} />
        <meshBasicMaterial color="#9ec9d4" transparent opacity={0.35} />
      </mesh>
      <Rig touring={touring} stop={stop} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={2.4}
        maxDistance={14}
        enabled={!touring}
      />
    </Canvas>
  );
}
