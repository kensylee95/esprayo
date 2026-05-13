import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WalletService } from '../wallet/wallet.service';
import Redis from 'ioredis';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { Gift } from './entities/gift.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GiftCatalogItem,
  GiftPayload,
  GiftResult,
  SaveGiftInput,
} from './dtos/gift.dto';
import { BROADCAST_GIFT_EVENT } from './job.constants';
import { REDIS_CLIENT } from '@modules/redis/redis.module';

const DEFAULT_CATALOG: GiftCatalogItem[] = [
  { id: 'bouquet',   name: 'Bouquet',     emoji: '💐', tokens: 50   },
  { id: 'champagne', name: 'Champagne',   emoji: '🍾', tokens: 120  },
  { id: 'diamond',   name: 'Diamond',     emoji: '💎', tokens: 500  },
  { id: 'car',       name: 'Car Key',     emoji: '🚗', tokens: 2000 },
  { id: 'house',     name: 'House Key',   emoji: '🏠', tokens: 5000 },
  { id: 'mystery',   name: 'Mystery Box', emoji: '🎁', tokens: 80   },
  { id: 'travel',    name: 'Travel',      emoji: '✈️', tokens: 300  },
  { id: 'crown',     name: 'Crown',       emoji: '👑', tokens: 800  },
];

@Injectable()
export class GiftService {
  private readonly logger = new Logger(GiftService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @InjectRepository(Gift)
    private readonly giftRepo: Repository<Gift>,
    private readonly walletService: WalletService,
    private readonly leaderboardService: LeaderboardService,
    @InjectQueue('gifts')
    private readonly giftQueue: Queue,
  ) {}

  // -------------------------
  // KEYS
  // -------------------------

  private giftLockKey(reference: string): string {
    return `gift:lock:${reference}`;
  }

  private giftCountKey(eventId: string): string {
    return `event:${eventId}:gift_count`;
  }

  // -------------------------
  // SEND GIFT
  // -------------------------

  /**
   * Processes a gift end-to-end:
   *
   *  1. Acquire idempotency lock (SET NX) — returns null if duplicate
   *  2. Debit wallet (throws on insufficient balance — nothing else runs)
   *  3. Enqueue broadcast job — worker handles leaderboard, saveGift, realtime
   *
   * On any failure after the lock is acquired, the lock is released so the
   * client can retry.
   */
  async sendGift(payload: GiftPayload): Promise<GiftResult | null> {
    const t0 = performance.now();

    // ─────────────────────────────
    // Idempotency lock
    // ─────────────────────────────
    const tRedisSet = performance.now();

    const locked = await this.redis.set(
      this.giftLockKey(payload.reference),
      '1',
      'EX',
      86400,
      'NX',
    );

    this.logger.log(`gift.redis.set: ${(performance.now() - tRedisSet).toFixed(2)}ms`);

    if (!locked) {
      this.logger.log(`gift.total (locked): ${(performance.now() - t0).toFixed(2)}ms`);
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

      this.logger.log(`gift.wallet.debit: ${(performance.now() - tDebit).toFixed(2)}ms`);

      // ─────────────────────────────
      // Broadcast queue — worker handles leaderboard, saveGift, and realtime
      // ─────────────────────────────
      const tQueue = performance.now();

      void this.giftQueue.add(
        BROADCAST_GIFT_EVENT,
        {
          eventId:       payload.eventId,
          userId:        payload.userId,
          displayName:   payload.displayName,
          giftName:      payload.giftName,
          giftEmoji:     payload.giftEmoji,
          tokens:        payload.tokens,
          nairaValue:    payload.amount,
          giftId:        payload.giftId,
          transactionId: payload.reference,
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      );

      this.logger.log(`gift.queue.add: ${(performance.now() - tQueue).toFixed(2)}ms`);
      this.logger.log(`gift.total: ${(performance.now() - t0).toFixed(2)}ms`);

      return { success: true, newBalance };

    } catch (err) {
      // Release lock so the client can retry
      this.redis
        .del(this.giftLockKey(payload.reference))
        .catch(e => this.logger.error('gift.cleanup failed', { e }));

      throw err;
    }
  }

  // -------------------------
  // WALLET
  // -------------------------

  async getWalletBalance(userId: string) {
    return this.walletService.getBalance(userId);
  }

  async creditUserAccount(
    userId: string,
    tokens: number,
    paymentReference: string,
  ) {
    return this.walletService.credit({
      userId,
      amount: tokens,
      reference: paymentReference,
    });
  }

  // -------------------------
  // SAVE GIFT (worker)
  // -------------------------

  /**
   * Persists a gift event to the database.
   * Called from the BullMQ worker — uses INSERT ... ON CONFLICT DO NOTHING
   * to guarantee idempotency without a separate SELECT round-trip.
   */
  async saveGift(input: SaveGiftInput): Promise<Gift> {
    const result = await this.giftRepo
      .createQueryBuilder()
      .insert()
      .into(Gift)
      .values({
        eventId:          input.eventId,
        guestId:          input.userId,
        displayName:      input.displayName,
        giftId:           input.giftId,
        giftName:         input.giftName,
        giftEmoji:        input.giftEmoji,
        tokens:           input.tokens,
        nairaValue:       input.nairaValue,
        cumulativeTokens: input.cumulativeTokens ?? 0,
        transactionId:    input.transactionId,
        rankAtTime:       input.rankAtTime,
      })
      .orIgnore()
      .returning('*')
      .execute();

    if (result.raw.length) return result.raw[0] as Gift;

    return this.giftRepo.findOneByOrFail({ transactionId: input.transactionId });
  }

  // -------------------------
  // GIFT COUNT
  // -------------------------

  async getEventGiftCount(eventId: string): Promise<number> {
    const val = await this.redis.get(this.giftCountKey(eventId));
    return parseInt(val ?? '0', 10);
  }

  // -------------------------
  // LEADERBOARD
  // -------------------------

  async getLeaderBoard(eventId: string, limit: number) {
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, +limit),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    return { leaderboard, totalTokens };
  }

  // -------------------------
  // EXPIRY
  // -------------------------

  /**
   * Extends TTL on the gift_count key to match leaderboard expiry.
   * Call alongside LeaderboardService.setExpiry so no keys are orphaned.
   */
  async setExpiry(eventId: string, ttlSeconds = 86_400): Promise<void> {
    await this.redis.expire(this.giftCountKey(eventId), ttlSeconds);
  }

  // -------------------------
  // GIFT CATALOG
  // -------------------------

  /**
   * Returns the gift catalog for an event.
   * Async-ready for per-event overrides when implemented.
   *
   * TODO: load per-event catalog from Redis/DB:
   *   const override = await this.redis.get(`event:${eventId}:catalog`);
   *   if (override) return JSON.parse(override);
   */
  async getGiftCatalog(): Promise<GiftCatalogItem[]> {
    return DEFAULT_CATALOG;
  }
}