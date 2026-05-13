import { Job } from 'bullmq';
import { BROADCAST_GIFT_EVENT } from '../job.constants';

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
export type GiftQueue = {
  add<K extends keyof GiftQueueJobs>(
    name: K,
    data: GiftQueueJobs[K],
  ): Promise<Job>;
};
export interface GiftQueueJobs {
  [BROADCAST_GIFT_EVENT]: BroadcastGiftJob;
}
export interface BroadcastGiftJob {
  eventId: string;
  userId: string;
  displayName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  nairaValue: number;
  newScore: number;
  transactionId: string;
}

export interface GiftPayload {
  eventId: string;
  userId: string;
  displayName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  amount: number;
  reference: string;
}

export interface GiftResult {
  success: boolean;
  newBalance: number;
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  tokens: number;
}
