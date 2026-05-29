"use client";

import { motion } from "framer-motion";

export default function StageGlow({
  intensity,
}: {
  intensity: number;
}) {
  return (
    <>
      <motion.div
        animate={{ opacity: [0.55, 0.75, 0.55] }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "130%",
          height: "42%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,180,0,0.18) 0%, rgba(255,100,0,0.06) 45%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <motion.div
        key={intensity}
        initial={{ opacity: intensity * 0.85 }}
        animate={{ opacity: 0 }}
        transition={{
          duration: 1.4,
          ease: "easeOut",
        }}
        style={{
          position: "absolute",
          bottom: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200%",
          height: "70%",
          background:
            "radial-gradient(ellipse at 50% 90%, rgba(255,215,0,0.32) 0%, rgba(255,160,0,0.12) 35%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}