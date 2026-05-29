"use client";

import { memo } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import Image from "next/image";

import NOTE_SRC from "../assets/naira-note.png";
import { getStackConfig } from "../physics/stack";

interface NoteProps {
  stackIndex: number;
  totalRemaining: number;
  noteId: number;
  dismissing: boolean;
  onDismiss: (
    id: number,
    vy: number,
    vx: number
  ) => void;
}

const Note = memo(function Note({
  stackIndex,
  totalRemaining,
  noteId,
  dismissing,
  onDismiss,
}: NoteProps) {
  const cfg = getStackConfig(
    stackIndex,
    totalRemaining
  );

  const isTop =
    stackIndex === totalRemaining - 1;

  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);

  const opacity = useTransform(
    dragY,
    [0, -120],
    [1, 0]
  );

  const scale = useTransform(
    dragY,
    [0, -120],
    [1, 0.88]
  );

  const dragRotate = useTransform(
    dragX,
    [-120, 120],
    [-16, 16]
  );

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (
      info.offset.y < -48 ||
      info.velocity.y < -200
    ) {
      onDismiss(
        noteId,
        info.velocity.y,
        info.velocity.x
      );
    }
  }

  return (
    <motion.div
      drag={isTop ? "y" : false}
      dragConstraints={{
        top: -240,
        bottom: 20,
      }}
      dragElastic={0.16}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        y: isTop ? dragY : cfg.y,
        x: isTop ? dragX : cfg.x,
        rotate: isTop
          ? dragRotate
          : cfg.rotate,
        opacity: isTop ? opacity : 1,
        scale: isTop ? scale : 1,
        zIndex: cfg.zIndex + 10,
        position: "absolute",
        bottom: "18%",
        left: "50%",
        translateX: "-50%",
      }}
    >
      <div
        style={{
          width:
            "clamp(120px, 22vw, 160px)",
          aspectRatio: "130 / 240",
          position: "relative",
        }}
      >
        <Image
          src={NOTE_SRC}
          alt=""
          fill
          draggable={false}
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    </motion.div>
  );
});

export default Note;