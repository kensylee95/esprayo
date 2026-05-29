"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export default function FloatingSymbols() {
  const symbols = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: 3 + Math.random() * 94,
        duration: 7 + Math.random() * 11,
        delay: -Math.random() * 14,
        size: 9 + Math.random() * 20,
        opacity: 0.03 + Math.random() * 0.09,
        symbol: ["₦", "✦", "◆", "★"][
          Math.floor(Math.random() * 4)
        ],
        drift: (Math.random() - 0.5) * 30,
      })),
    []
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {symbols.map((s) => (
        <motion.div
          key={s.id}
          initial={{ y: "105vh", rotate: -20, x: 0 }}
          animate={{ y: "-12vh", rotate: 20, x: s.drift }}
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
            color: "#FFD700",
            opacity: s.opacity,
            fontWeight: 700,
          }}
        >
          {s.symbol}
        </motion.div>
      ))}
    </div>
  );
}