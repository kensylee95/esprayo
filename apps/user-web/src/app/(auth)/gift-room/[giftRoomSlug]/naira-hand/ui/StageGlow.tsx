"use client";

import { motion } from "framer-motion";

export default function StageGlow({ intensity }: { intensity: number }) {
  return (
    <>
      {/* Persistent ambient glow — deep gold pool at the base */}
      <motion.div
        animate={{ opacity: [0.5, 0.72, 0.5], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "140%",
          height: "45%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(201,168,76,0.16) 0%, rgba(30,92,42,0.08) 45%, transparent 72%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Green stage wash — subtle theatrical depth */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          height: "35%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(18,48,27,0.55) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Spray burst flash */}
      <motion.div
        key={intensity}
        initial={{ opacity: intensity > 0 ? 0.7 : 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "220%",
          height: "75%",
          background:
            "radial-gradient(ellipse at 50% 88%, rgba(201,168,76,0.28) 0%, rgba(240,208,128,0.1) 30%, transparent 62%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}
