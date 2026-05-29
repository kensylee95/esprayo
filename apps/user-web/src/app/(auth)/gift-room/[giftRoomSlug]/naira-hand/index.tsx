"use client";

import {
  AnimatePresence,
} from "framer-motion";

import {
  useMemo,
  useState,
} from "react";

import FloatingSymbols from "./ui/FloatingSymbols";
import StageGlow from "./ui/StageGlow";
import SwipeHint from "./ui/SwipeHint";
import AmountCounter from "./ui/AmountCounter";
import CelebrationScreen from "./ui/CelebrationScreen";
import WorldCanvas from "./canvas/WorldCanvas";
import Note from "./ui/Note";

import { useSprayState } from "./hooks/useSprayState";

import { NairaHandProps } from "./types";

import { getStackConfig } from "./physics/stack";

import {
  computeExitTrajectory,
} from "./physics/trajectories";
import Flyout from "./ui/Flyout";

interface FlyOutState {
  id: number;
  cfg: ReturnType<typeof getStackConfig>;
  trajectory: ReturnType<
    typeof computeExitTrajectory
  >;
}

export default function NairaWidget({
  totalAmount,
  noteValue = 1000,
  visibleStack = 5,
  onSprayReset,
  onComplete,
  onGift,
}: NairaHandProps) {

  const {
    remainingAmount,
    sprayTrigger,
    spray,
  } = useSprayState(
    totalAmount,
    noteValue,
    onComplete,
    {
      onGift
    }
  );

  const visibleNotes = Math.min(
    visibleStack,
    Math.ceil(
      remainingAmount / noteValue
    )
  );

  const notes = useMemo(
    () =>
      Array.from(
        { length: visibleNotes },
        (_, i) => i
      ),
    [visibleNotes]
  );

  const [flyOut, setFlyOut] =
    useState<FlyOutState | null>(
      null
    );

  const dismiss = (
    noteId: number,
    velocityY: number,
    velocityX: number
  ) => {

    if (remainingAmount <= 0) return;

    const topCfg = getStackConfig(
      visibleNotes - 1,
      visibleNotes
    );

    const trajectory =
      computeExitTrajectory(
        velocityY,
        velocityX
      );

    setFlyOut({
      id: noteId,
      cfg: topCfg,
      trajectory,
    });

    spray();

    window.setTimeout(() => {
      setFlyOut(null);
    }, 520);
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

      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 50% 85%, #1c1400 0%, #0d0900 55%, #000 100%)",
        }}
      />

      {/* Floating ambient symbols */}
      <FloatingSymbols />

      {/* Stage glow */}
      <StageGlow
        intensity={sprayTrigger}
      />

      {/* Physics layer */}
      <WorldCanvas
        trigger={sprayTrigger}
      />

      {/* Amount */}
      <AmountCounter
        amount={remainingAmount}
      />

      {/* Notes */}
      <AnimatePresence mode="popLayout">
        {notes.map(
          (noteId, stackIndex) => (
            <Note
              key={`${remainingAmount}-${noteId}`}
              noteId={noteId}
              stackIndex={stackIndex}
              totalRemaining={
                visibleNotes
              }
              dismissing={false}
              onDismiss={dismiss}
            />
          )
        )}
      </AnimatePresence>

      {/* Flyout spray note */}
      <AnimatePresence>
        {flyOut && (
          <Flyout
            trajectory={
              flyOut.trajectory
            }
            rotate={
              flyOut.cfg.rotate
            }
          />
        )}
      </AnimatePresence>

      {/* Swipe hint */}
      <SwipeHint
        visible={
          remainingAmount > 0
        }
      />

      {/* Celebration */}
      <AnimatePresence>
        {remainingAmount <= 0 && (
          <CelebrationScreen
            totalAmount={
              totalAmount
            }
            noteValue={noteValue}
            onReset={onSprayReset}
          />
        )}
      </AnimatePresence>

    </div>
  );
}