export interface LatestGift {
  displayName: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  newRank: number;
}

export interface RoomStats {
  eventTitle: string;
  eventSubtitle: string;
  slug: string;

  eventTokenBalance: number;
  eventNairaBalance: number;
  giftCount: number;
  guestCount: number;

  // MATCH DELTA HOOK EXACTLY
  totalTokens: number;
  totalGifts: number;
  eventEmoji: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const AVATAR_COLOURS = [
  "#C9A84C",
  "#7B6CE0",
  "#E07BA0",
  "#6ED88A",
  "#EF9F27",
  "#E87070",
];

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  giftCount: number;
  streak?: number;
}
