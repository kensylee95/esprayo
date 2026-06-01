"use client";

import {
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { memo, useRef, useState, useEffect } from "react";

interface NoteProps {
  isTop: boolean;
  cfgY: number;
  cfgX: number;
  cfgRotate: number;
  cfgZIndex: number;
  noteId: number;
  dismissing: boolean;
  onDismiss: (id: number, vy: number, vx: number, notesToSpray: number) => void;
}

const MAX_CHARGE_MS = 1000;
const MAX_NOTES = 100;
const HOLD_INTENT_MS = 800;

const Note = memo(function Note({
  isTop,
  cfgY,
  cfgX,
  cfgRotate,
  cfgZIndex,
  noteId,
  dismissing,
  onDismiss,
}: NoteProps) {
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const charge = useMotionValue(0);
  const transformedCharge = useTransform(charge, (v) => Math.max(1, Math.round(v * MAX_NOTES)))


  // Derive rotate/opacity from drag — works correctly now that
  // there's no competing CSS transform on a parent
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragY, [0, -150], [1, 0]);
  const progressScale = charge;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const isCharging = useRef(false);
  const isDragging = useRef(false);

  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  function startCharge() {
    if (!isTop) return;
    isDragging.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (raf.current) cancelAnimationFrame(raf.current);

    holdTimer.current = setTimeout(() => {
      setBarVisible(true);
      startTime.current = performance.now();
      charge.set(0);
      isCharging.current = true;

      const tick = () => {
        if (!isCharging.current) return;
        const elapsed = performance.now() - startTime.current;
        const next = Math.min(elapsed / MAX_CHARGE_MS, 1);
        charge.set(next);
        if (next < 1) {
          raf.current = requestAnimationFrame(tick);
        } else {
          isCharging.current = false;
          navigator.vibrate?.([20, 40, 20]);
        }
      };

      raf.current = requestAnimationFrame(tick);
    }, HOLD_INTENT_MS);
  }

  function resetCharge() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    isCharging.current = false;
    charge.set(0);
    setBarVisible(false);
  }

  function handlePointerUp() {
    if (!isDragging.current) resetCharge();
  }

  function playSwipeSfx() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/money-swipe.wav");
      audioRef.current.volume = 0.7;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }

  function handleDragStart() {
    isDragging.current = true;
    if (holdTimer.current) clearTimeout(holdTimer.current);
  }

function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
  console.log("dragEnd fired", { 
    offsetY: info.offset.y, 
    velocityY: info.velocity.y,
    shouldDismiss: info.offset.y < -60 || info.velocity.y < -500,
    noteId,
    isTop 
  });
  
  isDragging.current = false;
  const shouldDismiss = info.offset.y < -60 || info.velocity.y < -500;
  
  if (!shouldDismiss) {
    dragY.set(0);
    dragX.set(0);
    resetCharge();
    return;
  }

  const notesToSpray = Math.max(1, Math.round(charge.get() * MAX_NOTES));
  console.log("calling onDismiss", { noteId, notesToSpray });
  playSwipeSfx();
  navigator.vibrate?.(20);
  onDismiss(noteId, info.velocity.y, info.velocity.x, notesToSpray);
  resetCharge();
}

  return (
    // Single motion.div — no parent CSS transform fighting framer-motion.
    // translateX(-50%) is handed to framer via the x style prop so it's
    // part of the same matrix framer uses for drag tracking.
    <motion.div
  drag={isTop}
  dragConstraints={{ top: -600, bottom: 60, left: -200, right: 200 }}
  dragElastic={{ top: 0.4, bottom: 0.05, left: 0.1, right: 0.1 }}
  dragMomentum
  onPointerDown={startCharge}
  onPointerUp={handlePointerUp}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  whileDrag={{ scale: 1.03 }}
  // ↓ Remove animate entirely — it fights dragY on the top note
  // animate={dismissing ? { y: -400, opacity: 0 } : { y: 0, opacity: 1 }}
  style={{
    position: "absolute",
    bottom: "18%",
    left: "50%",
    x: isTop ? dragX : cfgX,
    y: isTop ? dragY : cfgY,
    rotate: isTop ? rotate : cfgRotate,
    opacity: isTop ? opacity : 1,
    translateX: "-50%",
    zIndex: cfgZIndex,
    willChange: "transform",
    cursor: isTop ? "grab" : "default",
    touchAction: "none",
    padding: 8,
    pointerEvents: isTop ? "auto" : "none", // ← explicit, non-top notes don't steal events
  }}
>
      {/* Charge bar */}
      {isTop && barVisible && (
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "clamp(120px, 22vw, 160px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: "rgba(201,168,76,0.15)",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "rgba(201,168,76,0.8)",
                scaleX: progressScale,
                transformOrigin: "left center",
              }}
            />
          </div>
          <motion.span
            style={{
              color: "#F0D080",
              fontSize: 13,
              fontWeight: 700,
              minWidth: 24,
              textAlign: "right",
            }}
          >
            {transformedCharge}
          </motion.span>
        </div>
      )}

      {/* Note image */}
      <div
        style={{
          width: "clamp(120px, 22vw, 160px)",
          aspectRatio: "130 / 240",
          position: "relative",
          boxShadow: "0 6px 12px rgba(0,0,0,0.14)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <Image
          src={"/assets/naira-note.png"}
          alt=""
          fill
          priority={isTop}
          draggable={false}
          style={{ objectFit: "contain" }}
        />
      </div>
    </motion.div>
  );
});

export default Note;