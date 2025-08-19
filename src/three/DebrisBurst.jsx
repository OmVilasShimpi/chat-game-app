import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DebrisBurst({ active = false, lifetime = 1.2 }) {
  const mesh = useRef();
  const light = useRef();
  const COUNT = 90;

  const { positions, velocities, rotations } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    const rot = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // start near bomb center
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.15;
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      // burst outwards
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2.2 + Math.random() * 1.2;
      vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.cos(phi) * speed * 0.8 + 0.6; // up bias
      vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      // random spin
      rot[i * 3 + 0] = (Math.random() - 0.5) * 2;
      rot[i * 3 + 1] = (Math.random() - 0.5) * 2;
      rot[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return { positions: pos, velocities: vel, rotations: rot };
  }, []);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const color = "#ffb078";

  const start = useRef(null);
  useEffect(() => {
    if (active) start.current = performance.now();
  }, [active]);

  useFrame((_, dt) => {
    if (!active || !mesh.current) return;
    const inst = mesh.current;
    const t = (performance.now() - start.current) / 1000; // sec
    const alpha = Math.max(0, 1 - t / lifetime);

    for (let i = 0; i < COUNT; i++) {
      // integrate velocity + gravity + damping
      velocities[i * 3 + 1] -= 6 * dt; // gravity
      velocities[i * 3 + 0] *= 0.98;
      velocities[i * 3 + 1] *= 0.98;
      velocities[i * 3 + 2] *= 0.98;

      positions[i * 3 + 0] += velocities[i * 3 + 0] * dt;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

      // build transform
      m.compose(
        new THREE.Vector3(positions[i * 3 + 0], positions[i * 3 + 1], positions[i * 3 + 2]),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotations[i * 3 + 0] * t, rotations[i * 3 + 1] * t, rotations[i * 3 + 2] * t)
        ),
        new THREE.Vector3(1, 1, 1).multiplyScalar(0.06 + Math.random() * 0.03)
      );
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.material.opacity = alpha * 0.95;

    // flash light that decays quickly
    if (light.current) light.current.intensity = Math.max(0, 12 * alpha);
  });

  return (
    <group>
      <pointLight ref={light} position={[0, 0.4, 0]} distance={6} decay={3} color={color} intensity={12} />
      <instancedMesh ref={mesh} args={[null, null, COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} transparent opacity={0.0} />
      </instancedMesh>
    </group>
  );
}
