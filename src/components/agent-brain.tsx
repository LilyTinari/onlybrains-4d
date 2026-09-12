import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DigitalBrain } from "@/components/digital-brain";
import { buildLattice, signatureFor } from "@/lib/brain-signature";
import { usePrefersReducedMotion } from "@/lib/utils";
import { cn } from "@/lib/utils";

const vertex = /* glsl */ `
  attribute float aSeed;
  attribute float aLobe;
  attribute float aRole;
  uniform float uTime;
  uniform float uPulse;
  uniform float uIvory;
  uniform float uPhase;
  uniform float uSelected;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float seed = aSeed;
    float pulse = 0.86 + 0.14 * sin(uTime * (0.5 + seed * 0.5) * uPulse + seed * 12.0);
    vec3 p = position;
    vec3 n = normalize(p + vec3(0.0001, 0.0, 0.0));
    float w = sin(uTime * 0.34 * uPulse + seed * 8.0 + uPhase + aLobe);
    p += n * w * mix(0.018, 0.05, uSelected);
    float soma = aRole;
    vAlpha = mix(mix(0.38, 0.78, uSelected), mix(0.55, 0.95, uSelected), soma) * pulse;
    vec3 neural = vec3(0.62, 0.79, 0.83);
    vec3 ivory = vec3(0.93, 0.92, 0.89);
    vColor = mix(neural, ivory, clamp(uIvory * 0.7 + seed * 0.1 + soma * 0.35, 0.0, 1.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float sz = mix(2.4, 5.6, soma) + seed * 2.4;
    gl_PointSize = clamp(sz * pulse * (210.0 / -mv.z) * mix(0.85, 1.15, uSelected), 1.2, 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r = dot(uv, uv);
    if (r > 1.0) discard;
    gl_FragColor = vec4(vColor, exp(-r * 2.8) * vAlpha);
  }
`;

const arborVert = /* glsl */ `
  attribute float aAlong;
  uniform float uTime;
  uniform float uPulse;
  varying float vAlong;
  varying float vAlpha;
  void main() {
    vAlong = aAlong;
    vAlpha = 0.55;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arborFrag = /* glsl */ `
  uniform float uTime;
  varying float vAlong;
  varying float vAlpha;
  void main() {
    float spark = smoothstep(0.08, 0.0, abs(fract(uTime * 0.08 + vAlong * 0.15) - 0.5));
    vec3 col = mix(vec3(0.62, 0.79, 0.83), vec3(0.93, 0.92, 0.89), spark);
    gl_FragColor = vec4(col, (0.22 + spark * 0.45) * vAlpha);
  }
`;

export function AgentBrainMesh({
  id,
  count = 2800,
  selected = false,
}: {
  id: string;
  count?: number;
  selected?: boolean;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const arborMat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const sig = useMemo(() => signatureFor(id), [id]);
  const lattice = useMemo(() => buildLattice(sig, count), [sig, count]);
  const arborAlong = useMemo(() => {
    const n = lattice.arbors.length / 3;
    const a = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = (i % 2 === 0 ? 0 : 1) + Math.floor(i / 2) * 0.03;
    return a;
  }, [lattice.arbors]);

  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * sig.spin;
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime;
      mat.current.uniforms.uSelected.value = THREE.MathUtils.damp(
        mat.current.uniforms.uSelected.value,
        selected ? 1 : 0.34,
        3,
        state.clock.getDelta(),
      );
    }
    if (arborMat.current) arborMat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lattice.positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[lattice.seeds, 1]} />
          <bufferAttribute attach="attributes-aLobe" args={[lattice.lobes, 1]} />
          <bufferAttribute attach="attributes-aRole" args={[lattice.roles, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={mat}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uPulse: { value: sig.pulse },
            uIvory: { value: sig.ivory },
            uPhase: { value: sig.phase },
            uSelected: { value: selected ? 1 : 0.34 },
          }}
        />
      </points>
      {lattice.synapses.length > 0 ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[lattice.synapses, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#9ec9d4" transparent opacity={0.22} />
        </lineSegments>
      ) : null}
      {lattice.arbors.length > 0 ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[lattice.arbors, 3]} />
            <bufferAttribute attach="attributes-aAlong" args={[arborAlong, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={arborMat}
            vertexShader={arborVert}
            fragmentShader={arborFrag}
            transparent
            depthWrite={false}
            uniforms={{ uTime: { value: 0 }, uPulse: { value: sig.pulse } }}
          />
        </lineSegments>
      ) : null}
    </group>
  );
}

export function AgentBrain({
  id,
  className,
  interactive = true,
  selected = true,
  count = 3200,
}: {
  id: string;
  className?: string;
  interactive?: boolean;
  selected?: boolean;
  count?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [hot, setHot] = useState(false);
  if (reduced) {
    return (
      <div className={cn("grid place-items-center bg-bg", className)}>
        <DigitalBrain className="size-16" pulse={selected} />
      </div>
    );
  }
  return (
    <div
      className={cn("relative overflow-hidden bg-bg", className)}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <Canvas
        frameloop={hot || selected ? "always" : "demand"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.1, 1.85], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ invalidate }) => invalidate()}
      >
        <color attach="background" args={["#050506"]} />
        <AgentBrainMesh id={id} count={count} selected={selected} />
        {interactive ? (
          <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.1} />
        ) : null}
      </Canvas>
    </div>
  );
}
