"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function FloatingSymbols() {
  const symbols = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: 3 + Math.random() * 94,
        duration: 9 + Math.random() * 13,
        delay: -Math.random() * 16,
        size: 8 + Math.random() * 18,
        opacity: 0.025 + Math.random() * 0.07,
        symbol: ["₦", "✦", "◆", "★", "✧"][Math.floor(Math.random() * 5)],
        drift: (Math.random() - 0.5) * 40,
        rotate: (Math.random() - 0.5) * 60,
      })),
    [],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: "none",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {symbols.map((s) => (
        <motion.div
          key={s.id}
          initial={{ y: "108vh", rotate: s.rotate * -1, x: 0, opacity: 0 }}
          animate={{
            y: "-14vh",
            rotate: s.rotate,
            x: s.drift,
            opacity: s.opacity,
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            bottom: 0,
            fontSize: s.size,
            color: "#C9A84C",
            fontWeight: 700,
            willChange: "transform",
          }}
        >
          {s.symbol}
        </motion.div>
      ))}
    </div>
  );
}
