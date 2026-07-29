"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function CelebrationScreen({
  totalAmount,
  noteValue,
  onReset,
}: {
  totalAmount: number;
  noteValue: number;
  onReset: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteCount = Math.ceil(totalAmount / noteValue);

  useEffect(() => {
    const t = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      /* Brand palette — gold / green / cream */
      const COLORS = [
        "#F0D080",
        "#C9A84C",
        "#8B6914",
        "#1B5728",
        "#2e7a40",
        "#FAF5E4",
        "#FFD700",
        "#E8C547",
      ];

      const pieces = Array.from({ length: 120 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
        const spd = 6 + Math.random() * 14;
        const isSymbol = Math.random() > 0.72;
        return {
          x: W / 2 + (Math.random() - 0.5) * 60,
          y: H * 0.6,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          rot: Math.random() * 360,
          rotV: (Math.random() - 0.5) * 14,
          w: isSymbol ? 0 : 7 + Math.random() * 9,
          h: isSymbol ? 0 : 3 + Math.random() * 5,
          size: isSymbol ? 10 + Math.random() * 9 : 0,
          symbol: isSymbol
            ? ["₦", "✦", "★"][Math.floor(Math.random() * 3)]
            : "",
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
        };
      });

      let raf: number;
      const tick = () => {
        ctx.clearRect(0, 0, W, H);
        let alive = 0;
        for (const p of pieces) {
          p.vy += 0.38;
          p.vx *= 0.993;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.rotV;
          p.rotV *= 0.98;
          p.alpha -= 0.006;
          if (p.alpha <= 0 || p.y > H + 20) continue;
          alive++;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          if (p.symbol) {
            ctx.font = `bold ${p.size}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.symbol, 0, 0);
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        }
        if (alive > 0) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, 120);
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
        position: "absolute",
        inset: 0,
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 60%, rgba(12,30,18,0.97) 0%, rgba(2,8,4,0.99) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ scale: 0.7, y: 52 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 240,
          damping: 22,
          delay: 0.06,
        }}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "40px 32px",
          borderRadius: 24,
          background: "rgba(201,168,76,0.05)",
          border: "1px solid rgba(201,168,76,0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maxWidth: 290,
          width: "90%",
        }}
      >
        {/* Icon */}
        <motion.div
          animate={{
            rotate: [0, -12, 12, -6, 6, 0],
            scale: [1, 1.2, 0.95, 1.08, 1],
          }}
          transition={{ duration: 0.7, delay: 0.22 }}
          style={{ fontSize: 58, lineHeight: 1, userSelect: "none" }}
        >
          🤑
        </motion.div>

        {/* Headline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: "#F0D080",
            letterSpacing: "-0.03em",
            textShadow: "0 0 28px rgba(201,168,76,0.6)",
          }}
        >
          E don spray!
        </motion.p>

        {/* Total sprayed card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.48, type: "spring", stiffness: 210 }}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 14,
            background: "rgba(201,168,76,0.07)",
            border: "1px solid rgba(201,168,76,0.22)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "rgba(201,168,76,0.5)",
              textTransform: "uppercase",
            }}
          >
            Total sprayed
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 44,
              fontWeight: 700,
              color: "#F0D080",
              letterSpacing: "-0.02em",
              textShadow: "0 0 32px rgba(201,168,76,0.55)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₦{totalAmount.toLocaleString()}
          </p>
        </motion.div>

        {/* Notes count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62 }}
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(250,245,228,0.35)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {noteCount} note{noteCount !== 1 ? "s" : ""} scattered
        </motion.p>

        {/* Reset button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.76 }}
          whileHover={{ scale: 1.05, background: "rgba(201,168,76,0.2)" }}
          whileTap={{ scale: 0.94 }}
          onClick={onReset}
          style={{
            marginTop: 4,
            padding: "13px 40px",
            borderRadius: 40,
            border: "1.5px solid rgba(201,168,76,0.45)",
            background: "rgba(201,168,76,0.09)",
            color: "#F0D080",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Spray again
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
