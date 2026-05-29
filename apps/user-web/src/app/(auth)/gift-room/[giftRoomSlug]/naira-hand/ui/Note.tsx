"use client";

import {
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { memo, useRef } from "react";
import NOTE_SRC from "../assets/naira-note.png";
import { getStackConfig } from "../physics/stack";

interface NoteProps {
  stackIndex: number;
  totalRemaining: number;
  noteId: number;
  dismissing: boolean;
  onDismiss: (id: number, vy: number, vx: number) => void;
}

const Note = memo(function Note({
  stackIndex,
  totalRemaining,
  noteId,
  dismissing,
  onDismiss,
}: NoteProps) {
  const cfg = getStackConfig(stackIndex, totalRemaining);
  const isTop = stackIndex === totalRemaining - 1;

  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);

  const rotate = useTransform(dragX, [-120, 120], [-10, 10]);
  const opacity = useTransform(dragY, [0, -120], [1, 0]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playSwipeSfx() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/money-swipe.wav");
      audioRef.current.volume = 0.7;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }, 300);
  }
  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const shouldDismiss = info.offset.y < -90 || info.velocity.y < -700;

    if (!shouldDismiss) {
      dragY.set(0);
      dragX.set(0);
      return;
    }

    playSwipeSfx();
    onDismiss(noteId, info.velocity.y, info.velocity.x);
    if (navigator.vibrate) navigator.vibrate(40);
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: "18%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: cfg.zIndex,
      }}
    >
      <motion.div
        drag={isTop}
        dragConstraints={{ top: -220, bottom: 220, left: -120, right: 120 }}
        dragElastic={0.08}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02 }}
        animate={dismissing ? { y: -260, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: "tween", duration: 0.18 }}
        style={{
          y: isTop ? dragY : cfg.y,
          x: isTop ? dragX : cfg.x,
          rotate: isTop ? rotate : cfg.rotate,
          opacity: isTop ? opacity : 1,
          willChange: isTop ? "transform" : "auto",
          backfaceVisibility: "hidden",
          boxShadow: "0 6px 12px rgba(0,0,0,0.14)",
          cursor: isTop ? "grab" : "default",
        }}
      >
        <div
          style={{
            width: "clamp(120px, 22vw, 160px)",
            aspectRatio: "130 / 240",
            position: "relative",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <Image
            src={NOTE_SRC}
            alt=""
            fill
            priority={isTop}
            draggable={false}
            style={{ objectFit: "contain", userSelect: "none" }}
          />
        </div>
      </motion.div>
    </div>
  );
});

export default Note;
