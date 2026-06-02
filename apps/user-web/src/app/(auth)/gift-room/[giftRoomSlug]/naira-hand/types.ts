import type { getStackConfig } from "./physics/stack";
import type { computeExitTrajectory } from "./physics/trajectories";

export type NoteValue = 50 | 100 | 200 | 500 | 1000;

export interface NairaHandProps {
  totalAmount: number;
  noteValue?: NoteValue;
  visibleStack?: number;
  onComplete?: () => void;
  onSprayReset: () => void;
  onGift: (
    noteValue: NoteValue,
    numberSent: number,
    remainingAmount: number,
  ) => void;
}

export interface FlyOutState {
  id: number;
  cfg: ReturnType<typeof getStackConfig>;
  trajectory: ReturnType<typeof computeExitTrajectory>;
}

export interface Ring {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  speed: number;
  delay: number;
}

export interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
  rot: number;
  rotV: number;
  symbol?: string;
}

export interface Shimmer {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
  life: number;
  decay: number;
}
