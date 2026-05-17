// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  giftCount: number;
  lastGift?: string;
}

export interface LeaderboardPatch {
  userId: string;
  displayName: string;
  newScore: number;
  newRank: number;
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

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  tokens: number;
  featured?: boolean;
}

export interface RoomStats {
  guestCount: number;
  totalTokens: number;
  totalGifts: number;
  eventTitle: string;
  eventEmoji: string;
}

export type Overlay = "spray" | "wallet";

// ─── Constants ────────────────────────────────────────────────────────────────
