"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import NOTE_SRC from "../assets/naira-note.png";
import type { ExitTrajectory } from "../physics/trajectories";

export default function Flyout({
  trajectory,
  rotate,
}: {
  trajectory: ExitTrajectory;
  rotate: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 1,
        scale: 1,
      }}
      animate={{
        opacity: 0,
        y: trajectory.exitY,
        x: trajectory.exitX,
        scale: trajectory.exitScale,
        rotate: rotate + trajectory.exitRot,
      }}
      transition={{
        duration: trajectory.dur,
        ease: [0.18, 0.85, 0.38, 1],
      }}
      style={{
        position: "absolute",
        bottom: "18%",
        left: "50%",
        translateX: "-50%",
        zIndex: 999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "clamp(120px, 22vw, 160px)",
          aspectRatio: "130 / 240",
          position: "relative",
        }}
      >
        <Image src={NOTE_SRC} alt="" fill draggable={false} />
      </div>
    </motion.div>
  );
}
