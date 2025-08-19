import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FuseSparks({ sparkRef, active }) {
  const points = useRef();
  const COUNT = 180;
  const pos = useMemo(() => new Float32Array(COUNT * 3), []);
  const vel = useMemo(() => new Float32Array(COUNT * 3), []);
  const life = useMemo(() => new Float32Array(COUNT), []);
  const tmp = new THREE.Vector3();

  // helper: respawn a particle near the spark tip
  const respawn = (i) => {
    if (!sparkRef.current) return;
    const y = sparkRef.current.position.y; // local to fuse group
    // slight cone around the spark
    pos[i * 3 + 0] = (Math.random() - 0.5) * 0.10;
    pos[i * 3 + 1] = y + Math.random() * 0.02;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.10;

    vel[i * 3 + 0] = (Math.random() - 0.5) * 0.05;
    vel[i * 3 + 1] = Math.random() * 0.05; // slight upward puff
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

    life[i] = 0.3 + Math.random() * 0.5; // seconds
  };

  // init
  useEffect(() => {
    for (let i = 0; i < COUNT; i++) respawn(i);
    if (points.current) points.current.geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  }, []);

  useFrame((_, dt) => {
    if (!points.current) return;
    for (let i = 0; i < COUNT; i++) {
      if (!active) {
        // if not active, let sparks die out
        life[i] -= dt * 0.8;
        if (life[i] <= 0) { respawn(i); life[i] = 0; } // park them near spark, opacity will be handled by material
        continue;
      }

      // update
      vel[i * 3 + 1] -= 0.35 * dt; // gravity
      pos[i * 3 + 0] += vel[i * 3 + 0] * dt * 45;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt * 45;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt * 45;

      life[i] -= dt;
      // respawn when dead
      if (life[i] <= 0) respawn(i);
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry />
      <pointsMaterial
        size={0.06}
        color={"#ffd27a"}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Bomb({ onClick, ignite = false, burnMs = 1800, onBurnEnd }) {
  const group = useRef();
  const fuseGroup = useRef();
  const fuseMesh = useRef();
  const spark = useRef();
  const startRef = useRef(null);
  const doneRef = useRef(false);
  const t0 = useRef(performance.now());

  useEffect(() => {
    if (ignite && startRef.current === null) {
      startRef.current = performance.now();
      doneRef.current = false;
    }
  }, [ignite]);

  useFrame(() => {
    const now = performance.now();
    const t = (now - t0.current) / 1000;

    // idle float + spin
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.5) * 0.05;
      group.current.rotation.y += 0.004;
    }

    // spark pulse
    if (spark.current) {
      const pulse = (Math.sin(t * 8) + 1) / 2;
      const mat = spark.current.material;
      const base = ignite ? 1.2 : 0.6;
      mat.emissiveIntensity = base + pulse * (ignite ? 1.6 : 0.6);
      const c = new THREE.Color().setHSL(0.06 + pulse * 0.04, 1, 0.52);
      mat.color.copy(c);
      mat.emissive.copy(c);
    }

    // burn animation
    if (ignite && startRef.current !== null && fuseGroup.current && spark.current) {
      const p = Math.min(1, (now - startRef.current) / burnMs); // progress 0..1
      const sparkY = 0.3 - 0.6 * p;          // tip → base
      spark.current.position.y = sparkY;

      // shrink visible fuse from tip down to base
      if (fuseMesh.current) {
        const top = sparkY;
        const bottom = -0.3;
        const len = Math.max(0, top - bottom);       // remaining length
        const scaleY = Math.max(0.001, len / 0.6);   // 0..1
        fuseMesh.current.scale.y = scaleY;
        fuseMesh.current.position.y = (top + bottom) / 2; // keep centered between ends
      }

      // subtle pre-blast swell
      if (p > 0.9 && group.current) group.current.scale.setScalar(1 + (p - 0.9) * 0.05);

      if (p >= 1 && !doneRef.current) {
        doneRef.current = true;
        onBurnEnd?.();
      }
    }
  });

  const handlePointerOver = () => (document.body.style.cursor = "pointer");
  const handlePointerOut = () => (document.body.style.cursor = "default");

  return (
    <group
      ref={group}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={onClick}
    >
      {/* Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#1e2230" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Rim */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <torusGeometry args={[0.35, 0.08, 24, 64]} />
        <meshStandardMaterial color="#3a3f55" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Fuse + spark + sparks */}
      <group ref={fuseGroup} position={[0, 1.25, 0]} rotation={[Math.PI * 0.15, 0, 0]}>
        <mesh ref={fuseMesh} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
          <meshStandardMaterial color="#7b5e3b" roughness={0.85} />
        </mesh>

        {/* moving spark tip */}
        <mesh ref={spark} position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ffb347" emissive="#ff8c00" emissiveIntensity={1.0} />
        </mesh>

        {/* spark particles */}
        <FuseSparks sparkRef={spark} active={ignite} />
      </group>
    </group>
  );
}
