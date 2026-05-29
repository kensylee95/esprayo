"use client";

import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
import bg from "./assets/bg.jpg";
import WorldCanvas from "./canvas/WorldCanvas";
import { useSprayState } from "./hooks/useSprayState";
import { getStackConfig } from "./physics/stack";
import { computeExitTrajectory } from "./physics/trajectories";
import type { NairaHandProps } from "./types";
import AmountCounter from "./ui/AmountCounter";
import CelebrationScreen from "./ui/CelebrationScreen";
import FloatingSymbols from "./ui/FloatingSymbols";
import Flyout from "./ui/Flyout";
import Note from "./ui/Note";
import StageGlow from "./ui/StageGlow";
import SwipeHint from "./ui/SwipeHint";

interface FlyOutState {
  id: number;
  cfg: ReturnType<typeof getStackConfig>;
  trajectory: ReturnType<typeof computeExitTrajectory>;
}

export default function NairaWidget({
  totalAmount,
  noteValue = 1000,
  visibleStack = 5,
  onSprayReset,
  onComplete,
  onGift,
}: NairaHandProps) {
  const { remainingAmount, sprayTrigger, spray } = useSprayState(
    totalAmount,
    noteValue,
    onComplete,
    { onGift },
  );

  const visibleNotes = Math.min(
    visibleStack,
    Math.ceil(remainingAmount / noteValue),
  );

  const notes = useMemo(
    () => Array.from({ length: visibleNotes }, (_, i) => i),
    [visibleNotes],
  );

  const [flyOut, setFlyOut] = useState<FlyOutState | null>(null);

  const dismiss = (noteId: number, velocityY: number, velocityX: number) => {
    if (remainingAmount <= 0 && remainingAmount > noteValue) return;

    const topCfg = getStackConfig(visibleNotes - 1, visibleNotes);
    const trajectory = computeExitTrajectory(velocityY, velocityX);

    setFlyOut({ id: noteId, cfg: topCfg, trajectory });
    spray();

    window.setTimeout(() => setFlyOut(null), 520);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        contain: "layout paint",
      }}
    >
      {/* ── Background image + overlay ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image
          src={bg.src}
          alt=""
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

      {/* ── Subtle grain texture overlay ── */}
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

      {/* ── Floating ambient ₦ symbols ── */}
      <FloatingSymbols />

      {/* ── Stage glow (ambient + spray burst) ── */}
      <StageGlow intensity={sprayTrigger} />

      {/* ── Physics / particle canvas ── */}
      <WorldCanvas trigger={sprayTrigger} />

      {/* ── Amount counter ── */}
      <AmountCounter
        mints={Math.ceil(remainingAmount / noteValue)}
        amount={remainingAmount}
      />

      {/* ── Note stack ── */}
      <AnimatePresence mode="popLayout">
        {notes.map((noteId, stackIndex) => (
          <Note
            key={`${remainingAmount}-${noteId}`}
            noteId={noteId}
            stackIndex={stackIndex}
            totalRemaining={visibleNotes}
            dismissing={false}
            onDismiss={dismiss}
          />
        ))}
      </AnimatePresence>

      {/* ── Flyout spray note ── */}
      <AnimatePresence>
        {flyOut && (
          <Flyout trajectory={flyOut.trajectory} rotate={flyOut.cfg.rotate} />
        )}
      </AnimatePresence>

      {/* ── Swipe hint ── */}
      <SwipeHint visible={remainingAmount > 0} />

      {/* ── Celebration screen ── */}
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
