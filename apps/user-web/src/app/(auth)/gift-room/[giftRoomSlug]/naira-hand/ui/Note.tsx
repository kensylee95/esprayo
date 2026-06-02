"use client";

import {
  motion,
  type PanInfo,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";

interface NoteProps {
  isTop: boolean;
  cfgY: number;
  cfgX: number;
  cfgRotate: number;
  cfgZIndex: number;
  noteId: number;
  dismissing: boolean;
  onDismiss: (
    id: number,
    vy: number,
    vx: number,
    notesToSpray: number,
    endX: number,
    endY: number,
  ) => void;
}

const MAX_CHARGE_MS = 1000;
const MAX_NOTES = 100;
const HOLD_INTENT_MS = 800;

// Movement threshold in px — if the pointer moves more than this before
// HOLD_INTENT_MS elapses, we treat it as a drag, not a hold.
const DRAG_MOVE_THRESHOLD = 8;

const Note = memo(function Note({
  isTop,
  cfgY,
  cfgX,
  cfgRotate,
  cfgZIndex,
  noteId,
  onDismiss,
}: NoteProps) {
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const charge = useMotionValue(0);

  // ── FIX #3: subscribe to MotionValue so the counter actually re-renders ──
  const [displayCount, setDisplayCount] = useState(1);
  useMotionValueEvent(charge, "change", (v) => {
    setDisplayCount(Math.max(1, Math.round(v * MAX_NOTES)));
  });

  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragY, [0, -150], [1, 0]);
  const progressScale = charge;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const isCharging = useRef(false);

  // ── FIX #2: track pointer position ourselves so we can detect real movement ──
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const movedTooFar = useRef(false);

  // ── FIX #2: Framer's drag is disabled while we are in the hold-intent window,
  //    and re-enabled only once we've decided it's a real drag (not a hold). ──
  const [dragEnabled, setDragEnabled] = useState(true);

  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // ── Charge tick ──
  function startChargeTick() {
    startTime.current = performance.now();
    charge.set(0);
    isCharging.current = true;
    setBarVisible(true);

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
  }

  function resetCharge() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    isCharging.current = false;
    charge.set(0);
    setBarVisible(false);
    pointerStart.current = null;
    movedTooFar.current = false;
  }

  // ── FIX #2: onPointerDown — disable Framer drag temporarily and start the
  //    hold-intent timer. If the pointer moves > threshold before the timer
  //    fires, re-enable drag and cancel the charge. ──
  function handlePointerDown(e: React.PointerEvent) {
    if (!isTop) return;
    // Capture starting position
    pointerStart.current = { x: e.clientX, y: e.clientY };
    movedTooFar.current = false;

    // Disable Framer drag so it doesn't steal the event during hold window
    setDragEnabled(false);

    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (raf.current) cancelAnimationFrame(raf.current);

    holdTimer.current = setTimeout(() => {
      // If pointer moved too far, this is a swipe — bail out
      if (movedTooFar.current) {
        setDragEnabled(true);
        return;
      }
      // Committed to a hold — start charging
      startChargeTick();
    }, HOLD_INTENT_MS);
  }

  // ── FIX #2: onPointerMove — detect if the user has moved far enough to
  //    count as a drag, then re-enable Framer drag and cancel charge. ──
  function handlePointerMove(e: React.PointerEvent) {
    if (!isTop) return;
    if (!pointerStart.current) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > DRAG_MOVE_THRESHOLD && !movedTooFar.current) {
      movedTooFar.current = true;

      // only cancel pending hold intent
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }

      // IMPORTANT:
      // don't stop charging if it already started
      setDragEnabled(true);
    }
  }

  function handlePointerUp() {
    setDragEnabled(true);
  }

  function handlePointerCancel() {
    resetCharge();
    setDragEnabled(true);
  }

  function playSwipeSfx() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/money-swipe.wav");
      audioRef.current.volume = 0.7;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }

  // ── onDragStart — framer confirmed a drag; make sure charge is killed ──
  function handleDragStart() {
    setDragEnabled(true);

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function handleDragEnd(
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    setDragEnabled(true);

    const isDeliberateSwipe =
      info.offset.y < -80 && Math.abs(info.velocity.y) > 200;
    const isFastFlick = info.velocity.y < -600;

    if (!isDeliberateSwipe && !isFastFlick) {
      dragY.set(0);
      dragX.set(0);
      return;
    }

    let endX = 0;
    let endY = 0;
    if (e instanceof PointerEvent || e instanceof MouseEvent) {
      endX = e.clientX;
      endY = e.clientY;
    } else if (e instanceof TouchEvent && e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
    }

    // ── FIX #4: snapshot charge BEFORE resetCharge() zeros it ──
    const notesToSpray = Math.max(1, Math.round(charge.get() * MAX_NOTES));
    playSwipeSfx();
    navigator.vibrate?.(20);
    onDismiss(
      noteId,
      info.velocity.y,
      info.velocity.x,
      notesToSpray,
      endX,
      endY,
    );
    resetCharge();
  }

  return (
    <motion.div
      drag={isTop && dragEnabled}
      dragConstraints={{ top: -600, bottom: 60, left: -200, right: 200 }}
      dragElastic={{ top: 0.4, bottom: 0.05, left: 0.1, right: 0.1 }}
      dragMomentum
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1 }}
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
        pointerEvents: isTop ? "auto" : "none",
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
          {/* FIX #3: use React state, not raw MotionValue, for the counter */}
          <span
            style={{
              color: "#F0D080",
              fontSize: 13,
              fontWeight: 700,
              minWidth: 24,
              textAlign: "right",
            }}
          >
            {displayCount}
          </span>
        </div>
      )}

      {/* Note image — FIX #1: remove pointerEvents:none from wrapper so
          the hit area works correctly; the motion.div handles all events. */}
      <div
        style={{
          width: 150,
          aspectRatio: "150 / 240",
          position: "relative",
          userSelect: "none",
        }}
      >
        <Image
          src={"/assets/naira-note.png"}
          alt=""
          fill
          priority={isTop}
          draggable={false}
          style={{ objectFit: "contain", pointerEvents: "none" }}
        />
      </div>
    </motion.div>
  );
});

export default Note;
