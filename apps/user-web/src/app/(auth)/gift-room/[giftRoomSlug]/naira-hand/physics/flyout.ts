import { getStackConfig } from "./stack";
import { computeExitTrajectory } from "./trajectories";
import type { FlyOutState } from "../types";

// ─── Timing constants ────────────────────────────────────────────────────────

export const STAGGER_MS = 80;
export const ANIM_DURATION_MS = 520;

/** Total ms until the last note in a batch has finished animating. */
export function batchDuration(count: number): number {
  return ANIM_DURATION_MS + (count - 1) * STAGGER_MS;
}

// ─── ID generation ───────────────────────────────────────────────────────────

// Monotonic counter — no collision risk unlike `noteId * 100 + i`.
let _nextId = 1;
function nextFlyId(): number {
  return _nextId++;
}

// ─── Batch builder ───────────────────────────────────────────────────────────

/**
 * Pure function: computes all flyout descriptors for a single spray gesture.
 * No React, no side-effects — trivially unit-testable.
 */
export function buildFlyOutBatch(
  visibleNotes: number,
  count: number,
  velocityX: number,
  velocityY: number,
): FlyOutState[] {
  const cfg = getStackConfig(visibleNotes - 1, visibleNotes);

  return Array.from({ length: count }, (_, i) => {
    const spreadX =
      i === 0 ? velocityX : velocityX + (Math.random() - 0.5) * 400;
    const spreadY =
      i === 0 ? velocityY : velocityY - Math.random() * 200;

    return {
      id: nextFlyId(),
      cfg,
      trajectory: computeExitTrajectory(spreadY, spreadX),
    };
  });
}