import { motion } from "framer-motion";
import { memo, useEffect, useRef } from "react";


export default function CelebrationScreen({
  totalAmount,
  noteValue,
  onReset,
}: {
  totalAmount: number;
  noteValue: number;
  onReset: () => void;
}) {
  function useConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
  
    const launch = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
  
      const COLORS = [
        "#FFD700","#FF6B35","#E040FB","#00E5FF",
        "#69F0AE","#FF4081","#FFEB3B","#40C4FF",
      ];
  
      const pieces = Array.from({ length: 110 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
        const spd = 7 + Math.random() * 15;
        return {
          x: W / 2 + (Math.random() - 0.5) * 80,
          y: H * 0.58,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          rot: Math.random() * 360,
          rotV: (Math.random() - 0.5) * 16,
          w: 8 + Math.random() * 10,
          h: 4 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
        };
      });
  
      let raf: number;
      const tick = () => {
        ctx.clearRect(0, 0, W, H);
        let alive = 0;
        for (const p of pieces) {
          p.vy += 0.42; p.vx *= 0.992;
          p.x += p.vx; p.y += p.vy;
          p.rot += p.rotV; p.rotV *= 0.98;
          p.alpha -= 0.007;
          if (p.alpha <= 0 || p.y > H + 20) continue;
          alive++;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
        if (alive > 0) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
  
    return { canvasRef, launch };
  }
  const { canvasRef, launch } = useConfettiCanvas();
  const noteCount = Math.ceil(totalAmount / noteValue);

  useEffect(() => {
    const t = setTimeout(launch, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key="celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "absolute", inset: 0, zIndex: 900,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ scale: 0.72, y: 48 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14,
          padding: "36px 32px", borderRadius: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,215,0,0.22)",
          maxWidth: 280, width: "90%",
        }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.18, 0.96, 1.07, 1] }}
          transition={{ duration: 0.65, delay: 0.2 }}
          style={{ fontSize: 60, lineHeight: 1, userSelect: "none" }}
        >🤑</motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            color: "#FFD700", letterSpacing: "-0.03em",
            textShadow: "0 0 24px rgba(255,215,0,0.5)",
          }}
        >E don spray!</motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.46, type: "spring", stiffness: 220 }}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 14,
            background: "rgba(255,215,0,0.08)",
            border: "1px solid rgba(255,215,0,0.25)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: "0.22em", color: "rgba(255,215,0,0.55)", textTransform: "uppercase" }}>
            Total sprayed
          </p>
          <p style={{ margin: 0, fontSize: 42, fontWeight: 700, color: "#FFD700", letterSpacing: "-0.02em" }}>
            ₦{totalAmount.toLocaleString()}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}
        >
          {noteCount} note{noteCount !== 1 ? "s" : ""} scattered
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={onReset}
          style={{
            marginTop: 4, padding: "13px 38px", borderRadius: 40,
            border: "1.5px solid rgba(255,215,0,0.45)",
            background: "rgba(255,215,0,0.1)",
            color: "#FFD700", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
        >
          Spray again
        </motion.button>
      </motion.div>
    </motion.div>
  )}