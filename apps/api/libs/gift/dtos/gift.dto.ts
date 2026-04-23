export interface SaveGiftInput {
  eventId: string;

  /** user who sent the gift */
  userId: string;

  /** display name at time of gift */
  displayName: string;

  /** gift identifier (e.g. bouquet, diamond) */
  giftId: string;

  /** gift name */
  giftName: string;

  /** emoji representation */
  giftEmoji: string;

  /** number of tokens spent */
  tokens: number;

  /** locked fiat value at time of gift */
  nairaValue: number;

  /** leaderboard score after this gift */
  cumulativeTokens?: number;

  /** rank at time of gift */
  rankAtTime?: number | undefined;

  /** optional idempotency key to prevent duplicates */
  transactionId?: string;
}