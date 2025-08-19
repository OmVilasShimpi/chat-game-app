import { useEffect, useRef, useState } from "react";
// import { Link } from "react-router-dom"; // no longer needed here
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { motion } from "framer-motion";
import Bomb from "../three/Bomb.jsx";
import BlastFX from "../three/BlastFX.jsx";
import DebrisBurst from "../three/DebrisBurst.jsx";
import { resumeAudio, startSizzle, stopSizzle, playBoom } from "../three/SFX.js";
import LandingCard from "../components/LandingCard.jsx";

const BURN_MS = 3200;
const BLAST_MS = 900;
const PAUSE_MS = 250;

export default function Home() {
  // idle -> burning -> blast -> landing
  const [phase, setPhase] = useState("idle");
  const [showWave, setShowWave] = useState(false);
  const [burnP, setBurnP] = useState(0); // 0..1
  const burnStart = useRef(null);

  const startIgnition = async () => {
    if (phase !== "idle") return;
    await resumeAudio();
    startSizzle();
    burnStart.current = performance.now();
    setBurnP(0);
    setPhase("burning");
  };

  // track burn progress for the HUD
  useEffect(() => {
    if (phase !== "burning") return;
    let raf;
    const tick = () => {
      const p = Math.min(1, (performance.now() - burnStart.current) / BURN_MS);
      setBurnP(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // SVG circle metrics
  const R = 28;
  const CIRC = 2 * Math.PI * R;
  const dash = CIRC * (1 - burnP);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative", overflow: "hidden" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.8, 5], fov: 45 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0b0c10");
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {/* lights */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-4, 2, -2]} intensity={0.35} />

        {/* reflections + soft ground */}
        <Environment preset="city" blur={0.7} />
        <ContactShadows position={[0, -1.05, 0]} opacity={0.45} scale={12} blur={2.5} far={3} />

        {/* bomb (hidden during blast) */}
        {(phase === "idle" || phase === "burning") && (
          <group position={[0, -0.2, 0]}>
            <Bomb
              onClick={startIgnition}
              ignite={phase === "burning"}
              burnMs={BURN_MS}
              onBurnEnd={() => {
                stopSizzle();
                playBoom();           // loud boom
                setShowWave(true);
                setPhase("blast");
                setTimeout(() => setPhase("landing"), BLAST_MS + PAUSE_MS);
              }}
            />
          </group>
        )}

        {/* debris during blast */}
        {phase === "blast" && <DebrisBurst active lifetime={1.2} />}

        {/* camera shake */}
        {phase === "blast" && <BlastFX active duration={BLAST_MS} />}

        <OrbitControls enableZoom={false} />
      </Canvas>

      {/* Idle hint */}
      {phase === "idle" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "end center", paddingBottom: 48, pointerEvents: "none" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ color: "#e8e8ea", background: "rgba(17,19,25,0.6)", border: "1px solid #2a2d44", borderRadius: 12, padding: "10px 14px", fontSize: 16, boxShadow: "0 8px 18px rgba(0,0,0,0.35)" }}
          >
            💡 Click the bomb to ignite the fuse
          </motion.div>
        </div>
      )}

      {/* Burning HUD (countdown + ring) */}
      {phase === "burning" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "end center", paddingBottom: 36, pointerEvents: "none" }}>
          <div style={{ position: "relative", width: 88, height: 88 }}>
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: "absolute", inset: 0 }}>
              {/* bg circle */}
              <circle cx="44" cy="44" r={R} stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
              {/* progress (dash) */}
              <circle
                cx="44" cy="44" r={R}
                stroke="rgba(255,200,120,0.9)" strokeWidth="6" fill="none"
                strokeDasharray={CIRC} strokeDashoffset={dash}
                transform="rotate(-90 44 44)"
                style={{ filter: "drop-shadow(0 0 10px rgba(255,180,80,0.6))" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#ffe6c6", fontWeight: 700 }}>
              {Math.ceil((1 - burnP) * (BURN_MS / 1000))}
            </div>
          </div>
        </div>
      )}

      {/* Flash overlay */}
      {phase === "blast" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.98) 0%, rgba(255,190,100,0.78) 22%, rgba(255,120,0,0.42) 36%, rgba(0,0,0,0) 60%)",
            filter: "blur(1px)",
            animation: `blastFlash ${BLAST_MS}ms ease-out both`,
          }}
        />
      )}

      {/* Shockwave ring */}
      {showWave && phase === "blast" && <div className="shockwave" />}

      {/* Landing card (now the reusable component) */}
      {phase === "landing" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.8))",
          }}
        >
          <LandingCard />
        </div>
      )}
    </div>
  );
}
