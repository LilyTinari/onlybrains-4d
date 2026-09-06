import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { journey } from "@/lib/content";
import { useMediaQuery } from "@/lib/utils";

function helixPoint(t: number) {
  const a = t * Math.PI * 4.2;
  return new THREE.Vector3(Math.cos(a) * 1.85, (t - 0.5) * 3.4, Math.sin(a) * 1.85);
}

function Helix({
  active,
  onPick,
}: {
  active: number;
  onPick: (i: number) => void;
}) {
  const count = journey.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const nodes = useMemo(
    () => Array.from({ length: count }, (_, i) => helixPoint(i / Math.max(count - 1, 1))),
    [count],
  );
  const line = useMemo(() => {
    const pts = Array.from({ length: 80 }, (_, i) => helixPoint(i / 79));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((state) => {
    const inst = mesh.current;
    if (!inst) return;
    const t = state.clock.elapsedTime;
    nodes.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.position.y += Math.sin(t * 0.7 + i) * 0.04;
      dummy.scale.setScalar(active === i ? 1.35 : 0.85);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments geometry={line}>
        <lineBasicMaterial color="#9ec9d4" transparent opacity={0.35} />
      </lineSegments>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, count]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onPick(e.instanceId);
        }}
      >
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color="#c5e6f5" />
      </instancedMesh>
    </group>
  );
}

export default function HoloRing({
  active,
  onPick,
}: {
  active: number;
  onPick: (i: number) => void;
}) {
  const mobile = useMediaQuery("(max-width: 640px)");

  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.4], fov: 40, near: 0.1, far: 40 }}
      dpr={mobile ? [1, 1.25] : [1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <Helix active={active} onPick={onPick} />
      <OrbitControls enablePan={false} enableDamping minDistance={3.5} maxDistance={9} />
    </Canvas>
  );
}
