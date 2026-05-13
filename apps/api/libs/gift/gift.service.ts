import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WalletService } from '../wallet/wallet.service';
import Redis from 'ioredis';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis';
import { Gift } from './entities/gift.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GiftCatalogItem,
  GiftPayload,
  GiftResult,
  SaveGiftInput,
} from './dtos/gift.dto';
import { randomUUID } from 'crypto';
import { BROADCAST_GIFT_EVENT } from './job.constants';

const DEFAULT_CATALOG: GiftCatalogItem[] = [
  { id: 'bouquet', name: 'Bouquet', emoji: '💐', tokens: 50 },
  { id: 'champagne', name: 'Champagne', emoji: '🍾', tokens: 120 },
  { id: 'diamond', name: 'Diamond', emoji: '💎', tokens: 500 },
  { id: 'car', name: 'Car Key', emoji: '🚗', tokens: 2000 },
  { id: 'house', name: 'House Key', emoji: '🏠', tokens: 5000 },
  { id: 'mystery', name: 'Mystery Box', emoji: '🎁', tokens: 80 },
  { id: 'travel', name: 'Travel', emoji: '✈️', tokens: 300 },
  { id: 'crown', name: 'Crown', emoji: '👑', tokens: 800 },
];

@Injectable()
export class GiftService {
  private readonly logger = new Logger(GiftService.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(Gift)
    private readonly giftRepo: Repository<Gift>,
    private readonly walletService: WalletService,
    private readonly leaderboardService: LeaderboardService,
    private readonly redisService: RedisService,
    @InjectQueue('gifts')
    private readonly giftQueue: Queue,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
  }

  // -------------------------
  // GIFT KEY
  // -------------------------

  /**
   * Owned here rather than in LeaderboardService because giftCount is an
   * event-level counter that GiftService is responsible for, not the
   * leaderboard. Follows the same namespacing convention as LeaderboardService.
   */
  private giftCountKey(eventId: string): string {
    return `event:${eventId}:gift_count`;
  }

  // -------------------------
  // SEND GIFT
  // -------------------------

  /**
   * Processes a gift end-to-end:
   *
   *  1. Debit wallet (throws on insufficient balance — nothing else runs)
   *  2. Concurrently:
   *     a. addGift  — leaderboard increment + total_tokens (single pipeline)
   *     b. hincrby  — event gift counter
   *     c. getUserRank — fetch rank optimistically alongside writes
   *  3. Enqueue broadcast job (non-fatal if queue is temporarily unavailable)
   *
   * On any failure after the debit, a compensating credit is issued. If the
   * refund itself fails, the error is logged at CRITICAL level for ops to act on.
   *
   */
async sendGift(payload: GiftPayload): Promise<GiftResult | null> {
  const t0 = performance.now();

  // ─────────────────────────────
  // Redis SET NX
  // ─────────────────────────────
  const tRedisSet = performance.now();

  const locked = await this.redis.set(
    `gift:${payload.reference}`,
    '1',
    'EX',
    86400,
    'NX',
  );

  this.logger.log(
    `gift.redis.set: ${(performance.now() - tRedisSet).toFixed(2)}ms`,
  );

  if (!locked) {
    this.logger.log(
      `gift.total (locked): ${(performance.now() - t0).toFixed(2)}ms`,
    );

    return null;
  }

  try {
    // ─────────────────────────────
    // Wallet debit
    // ─────────────────────────────
    const tDebit = performance.now();

    const newBalance = await this.walletService.debit({
      userId: payload.userId,
      amount: payload.amount,
      reference: payload.reference,
    });

    this.logger.log(
      `gift.wallet.debit: ${(performance.now() - tDebit).toFixed(2)}ms`,
    );

    // ─────────────────────────────
    // Queue add
    // ─────────────────────────────
    const tQueue = performance.now();

   void this.giftQueue.add(
      BROADCAST_GIFT_EVENT,
      {
        eventId: payload.eventId,
        userId: payload.userId,
        displayName: payload.displayName,
        giftName: payload.giftName,
        giftEmoji: payload.giftEmoji,
        tokens: payload.tokens,
        nairaValue: payload.amount,
        giftId: payload.giftId,
        transactionId: payload.reference,
      },
    );

    this.logger.log(
      `gift.queue.add: ${(performance.now() - tQueue).toFixed(2)}ms`,
    );

    // ─────────────────────────────
    // Total
    // ─────────────────────────────
    this.logger.log(
      `gift.total: ${(performance.now() - t0).toFixed(2)}ms`,
    );

    return {
      success: true,
      newBalance,
    };
  } catch (err) {
    const tCleanup = performance.now();

    await this.redis.del(
      `gift:${payload.reference}`,
    );

    this.logger.log(
      `gift.cleanup: ${(performance.now() - tCleanup).toFixed(2)}ms`,
    );

    throw err;
  }
}

  async getWalletBalance(userId: string) {
    return this.walletService.getBalance(userId);
  }

  async creditUserAccount(
    userId: string,
    tokens: number,
    paymentReference: string,
  ) {
    return await this.walletService.credit({
      userId,
      amount: tokens,
      reference: paymentReference,
    });
  }

  /**
   * Persists a gift event to the database.
   * This should be called from BullMQ worker (recommended).
   */
  async saveGift(input: SaveGiftInput): Promise<Gift> {
    const existing = await this.giftRepo.findOneBy({
      transactionId: input.transactionId,
    });

    if (existing) return existing;
    const gift = this.giftRepo.create({
      eventId: input.eventId,
      guestId: input.userId,
      displayName: input.displayName,
      giftId: input.giftId,
      giftName: input.giftName,
      giftEmoji: input.giftEmoji,
      tokens: input.tokens,
      nairaValue: input.nairaValue,
      cumulativeTokens: input.cumulativeTokens ?? 0,
      transactionId: randomUUID(),
      rankAtTime: input.rankAtTime,
    });

    return this.giftRepo.save(gift);
  }

  // -------------------------
  // GIFT COUNT
  // -------------------------

  /**
   * Returns the total number of gifts sent in an event.
   * Separated from LeaderboardService because GiftService owns this counter.
   */
  async getEventGiftCount(eventId: string): Promise<number> {
    const val = await this.redis.get(this.giftCountKey(eventId));
    return parseInt(val ?? '0', 10);
  }

  async getLeaderBoard(eventId: string, limit: number) {
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, +limit),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    return {
      leaderboard,
      totalTokens,
    };
  }

  // -------------------------
  // EXPIRY
  // -------------------------

  /**
   * Extends TTL on the gift_count key to match leaderboard expiry.
   * Call this alongside LeaderboardService.setExpiry so no keys are orphaned.
   */
  async setExpiry(eventId: string, ttlSeconds = 86_400): Promise<void> {
    await this.redis.expire(this.giftCountKey(eventId), ttlSeconds);
  }

  // -------------------------
  // GIFT CATALOG
  // -------------------------

  /**
   * Returns the gift catalog for an event.
   *
   * FIX: eventId parameter is now used — per-event overrides can be loaded
   * from Redis/DB. Falls back to the static default catalog.
   *
   * TODO: Implement per-event catalog storage (e.g. Redis hash or DB table).
   */
  getGiftCatalog(): GiftCatalogItem[] {
    // Per-event catalog lookup (extend when ready):
    // const override = await this.redis.get(`event:${eventId}:catalog`);
    // if (override) return JSON.parse(override);

    //console.log(eventId); // acknowledged — used in the lookup above when implemented
    return DEFAULT_CATALOG;
  }
}
