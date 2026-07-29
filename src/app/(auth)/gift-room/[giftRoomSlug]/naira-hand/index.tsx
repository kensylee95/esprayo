"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo, useRef } from "react";
import bg from "./assets/bg.jpg";
import WorldCanvas, { type WorldCanvasHandle } from "./canvas/WorldCanvas";
import { usePerformanceOverlay } from "./hooks/usePerformanceOverlay";
import { useSprayState } from "./hooks/useSprayState";
import PerfOverlay from "./perfOverlay";
import { getStackConfig } from "./physics/stack";
import type { NairaHandProps } from "./types";
import AmountCounter from "./ui/AmountCounter";
import CelebrationScreen from "./ui/CelebrationScreen";
import Note, { type NoteHandle } from "./ui/Note";
import StageGlow from "./ui/StageGlow";
import SwipeHint from "./ui/SwipeHint";

export default function NairaWidget({
  totalAmount,
  noteValue = 1000,
  visibleStack = 5,
  onSprayReset,
  onComplete,
  onGift,
}: NairaHandProps) {
  const { remainingAmount, remainingRef, sprayTrigger, spray } = useSprayState(
    totalAmount,
    noteValue,
    onComplete,
    { onGift },
  );
  const { stats, setActiveNotes } = usePerformanceOverlay();
  process.env.NODE_ENV === "development" && <PerfOverlay stats={stats} />;

  const canvasRef = useRef<WorldCanvasHandle>(null);
  const topNoteRef = useRef<NoteHandle>(null);

  const visibleNotes = Math.min(
    visibleStack,
    Math.ceil(remainingAmount / noteValue),
  );

  const noteValueRef = useRef(noteValue);
  noteValueRef.current = noteValue;

  // stable keys — no remount on swipe
  const notes = useMemo(
    () =>
      Array.from({ length: visibleNotes }, (_, i) => ({
        stackIndex: i,
        key: `note-${i}`,
      })),
    [visibleNotes],
  );

  const dismiss = useCallback(
    (
      _noteId: number,
      vy: number,
      vx: number,
      count: number,
      endX: number,
      endY: number,
    ) => {
      if (remainingRef.current <= 0) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      const localX = rect ? endX - rect.left : endX;
      const localY = rect ? endY - rect.top : endY;

      canvasRef.current?.sprayNotes(count, vx, vy, localX, localY);

      // Synchronous — no rAF queue buildup
      topNoteRef.current?.reset();
      spray(count);
    },
    [remainingRef, spray],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* ── Background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image
          src={bg.src}
          alt=""
          width={1024}
          height={600}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
          }}
        />
      </div>

      {/* ── Grain ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />
      <StageGlow intensity={sprayTrigger} />

      <AmountCounter
        mints={Math.ceil(remainingAmount / noteValue)}
        amount={remainingAmount}
      />

      {/* ── Note stack — stable keys, no remount ── */}
      {notes.map(({ key, stackIndex }) => {
        const isTop = stackIndex === visibleNotes - 1;
        const cfg = getStackConfig(stackIndex, visibleNotes);
        return (
          <Note
            key={key}
            ref={isTop ? topNoteRef : null}
            noteId={stackIndex}
            isTop={isTop}
            cfgY={cfg.y}
            cfgX={cfg.x}
            cfgRotate={cfg.rotate}
            cfgZIndex={cfg.zIndex}
            dismissing={false}
            onDismiss={dismiss}
          />
        );
      })}

      {/* ── Canvas: after stack so it renders on top ── */}
      <WorldCanvas
        ref={canvasRef}
        trigger={sprayTrigger}
        noteSrc="/assets/naira-note.png"
        setActiveNotes={
          process.env.NODE_ENV === "development" ? setActiveNotes : undefined
        }
      />

      <SwipeHint visible={remainingAmount > 0} />

      <AnimatePresence>
        {remainingAmount <= 0 && (
          <CelebrationScreen
            totalAmount={totalAmount}
            noteValue={noteValue}
            onReset={onSprayReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
