// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  giftCount: number;
  lastGift?: string;
}

export interface LeaderboardPatch {
  userId: string;
  displayName: string;
  newScore: number;
  newRank: number;
  giftCount: number;
}

export interface LeaderboardUpdatePayload {
  patch: LeaderboardPatch;
  totalTokens: number;
  totalGifts: number;
}

export interface GetWayRes {
  leaderboard: LeaderboardEntry[];
  totalTokens: number;
  totalGifts: number;
  guestCount: number;
  ok: boolean;
  error: string;
}

export interface RoomStats {
  guestCount: number;
  totalScore: number;
  totalGifts: number;
  eventTitle: string;
}

export type Overlay = "spray" | "wallet";

// ─── Constants ────────────────────────────────────────────────────────────────
