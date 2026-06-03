"use client";

import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface NoteHandle {
  reset: () => void;
}

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
const DRAG_MOVE_THRESHOLD = 8;

const Note = memo(
  forwardRef<NoteHandle, NoteProps>(function Note(
    { isTop, cfgY, cfgX, cfgRotate, cfgZIndex, noteId, onDismiss },
    ref,
  ) {
    const dragY = useMotionValue(0);
    const dragX = useMotionValue(0);
    const charge = useMotionValue(0);
    const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
    const progressScale = charge;

    const [displayCount, setDisplayCount] = useState(1);
    useMotionValueEvent(charge, "change", (v) => {
      const next = Math.max(1, Math.round(v * MAX_NOTES));
      // Only update if value actually changed — avoids re-render on tiny float diffs
      setDisplayCount((prev) => (prev === next ? prev : next));
    });

    //const audioRef = useRef<HTMLAudioElement | null>(null);
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef<number | null>(null);
    const startTime = useRef<number>(0);
    const isCharging = useRef(false);
    const pointerStart = useRef<{ x: number; y: number } | null>(null);
    const isHolding = useRef(false); // true during hold-intent window
    const [barVisible, setBarVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      reset() {
        dragY.set(0);
        dragX.set(0);
        charge.set(0);
        isCharging.current = false;
        isHolding.current = false;
        pointerStart.current = null;
        if (holdTimer.current) clearTimeout(holdTimer.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        // Only trigger re-render if bar was actually visible
        if (barVisible) setBarVisible(false);
        if (displayCount !== 1) setDisplayCount(1);
      },
    }));

    /*useEffect(() => {
  const audio = new Audio("/sounds/money-swipe.wav");
  audio.volume = 0.7;
  audio.load();
  audioRef.current = audio;
}, []);
*/

    /*function playSwipeSfx() {
  if (!audioRef.current) return;
  audioRef.current.currentTime = 0;
  audioRef.current.play().catch(() => {});
}*/

    useEffect(() => {
      return () => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

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
          rafRef.current = requestAnimationFrame(tick);
        } else {
          isCharging.current = false;
          navigator.vibrate?.([20, 40, 20]);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    function resetCharge() {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      isCharging.current = false;
      isHolding.current = false;
      charge.set(0);
      setBarVisible(false);
      pointerStart.current = null;
    }

    function handlePointerDown(e: React.PointerEvent) {
      if (!isTop) return;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      isHolding.current = true;

      if (holdTimer.current) clearTimeout(holdTimer.current);

      holdTimer.current = setTimeout(() => {
        // still holding without moving — start charge
        if (isHolding.current) startChargeTick();
      }, HOLD_INTENT_MS);
    }

    function handlePointerMove(e: React.PointerEvent) {
      if (!isTop || !pointerStart.current || !isHolding.current) return;
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_MOVE_THRESHOLD) {
        // moved enough — cancel hold intent, let drag proceed
        isHolding.current = false;
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
      }
    }

    function handlePointerCancel() {
      resetCharge();
    }

    function handleDragStart() {
      // drag confirmed — cancel any pending hold
      isHolding.current = false;
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    }

    function handleDragEnd(
      e: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) {
      const isDeliberateSwipe =
        info.offset.y < -80 && Math.abs(info.velocity.y) > 200;
      const isFastFlick = info.velocity.y < -600;

      if (!isDeliberateSwipe && !isFastFlick) {
        animate(dragY, 0, { duration: 0.2, ease: "easeOut" });
        animate(dragX, 0, { duration: 0.2, ease: "easeOut" });
        resetCharge();
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

      const notesToSpray = Math.max(1, Math.round(charge.get() * MAX_NOTES));
      //playSwipeSfx();
      //navigator.vibrate?.(20);
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
        drag={isTop}
        dragConstraints={{ top: -800, bottom: 60, left: -300, right: 300 }}
        dragElastic={{ top: 1, bottom: 0.05, left: 0.3, right: 0.3 }}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerCancel}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.03 }}
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          x: isTop ? dragX : cfgX,
          y: isTop ? dragY : cfgY,
          rotate: isTop ? rotate : cfgRotate,
          opacity: 1,
          translateX: "-50%",
          zIndex: cfgZIndex,
          willChange: "transform",
          cursor: isTop ? "grab" : "default",
          touchAction: "none",
          padding: 8,
          pointerEvents: isTop ? "auto" : "none",
        }}
      >
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

        <div
          style={{
            width: 150,
            aspectRatio: "150 / 240",
            position: "relative",
            userSelect: "none",
          }}
        >
          <Image
            src="/assets/naira-note.png"
            alt=""
            fill
            priority={isTop}
            draggable={false}
            style={{ objectFit: "contain", pointerEvents: "none" }}
          />
        </div>
      </motion.div>
    );
  }),
);

export default Note;
