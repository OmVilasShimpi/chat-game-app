import { useRef, useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ---------- tiny count-up hook ---------- */
function useCountUp(to, { duration = 1400, delay = 0 } = {}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const elapsed = t - start - delay;
      const p = Math.min(1, Math.max(0, elapsed / duration));
      setN(Math.floor(to * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, delay]);
  return n;
}

/* ---------- confetti burst ---------- */
function Confetti({ burstKey }) {
  const palette = ["#6ee7ff", "#a78bfa", "#f472b6", "#fcd34d", "#34d399"];
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 240,
        y: - (80 + Math.random() * 220),
        r: Math.random() * 260 - 130,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        c: palette[i % palette.length],
        d: 0.7 + Math.random() * 0.4,
      })),
    [burstKey]
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.r, opacity: 0 }}
          transition={{ duration: p.d, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "12%",
            width: p.w,
            height: p.h,
            borderRadius: 2,
            background: p.c,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingCard() {
  const ref = useRef(null);
  const [style, setStyle] = useState({ transform: "rotateX(0deg) rotateY(0deg)" });
  const [burstKey, setBurstKey] = useState(0);
  const navigate = useNavigate();

  // parallax tilt + cursor-follow shine
  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * 10;
    const ry = (x - 0.5) * 12;
    setStyle({
      transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
      "--mx": `${x * 100}%`,
      "--my": `${y * 100}%`,
    });
  }
  function onLeave() {
    setStyle({ transform: "rotateX(0deg) rotateY(0deg)", "--mx": "50%", "--my": "50%" });
  }

  // lively counters
  const matches = useCountUp(1248, { duration: 1500 });
  const online = useCountUp(38, { duration: 1500, delay: 200 });

  // CTA handlers
  const handleCreate = () => {
    // trigger confetti then route
    setBurstKey((k) => k + 1);
    setTimeout(() => navigate("/app"), 650);
  };

  const features = [
    "⚡ Live chat with typing & seen",
    "🎮 1v1 Tic-Tac-Toe + rematch",
    "👥 Friends & private groups",
    "🔗 One-tap invite links",
  ];

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
      initial={{ scale: 0.9, opacity: 0, y: 14 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="landing-card fancy"
    >
      {/* FX layers */}
      <div className="glow" aria-hidden />
      <div className="shine" aria-hidden />
      <Confetti burstKey={burstKey} />

      {/* header */}
      <div className="card-top">
        <div className="logo"><span>🎮</span></div>
        <div className="brand">
          <h1 className="brand-title">Tap. Chat. GG.</h1>
          <p>Instant 1v1 games with live chat — invite and go.</p>
        </div>
      </div>

      {/* live mini-stats */}
      <div
        style={{
          display: "flex", gap: 12, justifyContent: "center", marginBottom: 6, flexWrap: "wrap",
          color: "#cfe9ff"
        }}
      >
        <div style={{
          padding: "6px 10px", borderRadius: 10, border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.03)"
        }}>
          🔥 <strong>{matches}</strong> matches today
        </div>
        <div style={{
          padding: "6px 10px", borderRadius: 10, border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.03)"
        }}>
          🟢 <strong>{online}</strong> friends online
        </div>
      </div>

      {/* CTAs */}
      <div className="cta-row">
        <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/app" className="btn btn-primary">Enter Lobby</Link>
        </motion.div>
        <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button className="btn btn-ghost" onClick={handleCreate}>Create account</button>
        </motion.div>
        <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/app?guest=1" className="btn btn-ghost">Try demo</Link>
        </motion.div>
      </div>

      {/* features */}
      <ul className="features">
        {features.map((f, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 * i }}
          >
            {f}
          </motion.li>
        ))}
      </ul>

      <div className="card-footer">
        <small>Privacy-first • No ads</small>
        <small>© {new Date().getFullYear()} ChatGame</small>
      </div>
    </motion.div>
  );
}
