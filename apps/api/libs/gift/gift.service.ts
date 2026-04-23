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
import { SaveGiftInput } from './dtos/gift.dto';
import { UUID } from 'typeorm/driver/mongodb/bson.typings.js';
import { randomUUID } from 'crypto';

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
  newScore: number;
  newRank: number;
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  emoji: string;
  tokens: number;
}

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
  private readonly redis: Redis;

  constructor(
    @InjectRepository(Gift)
    private readonly giftRepo: Repository<Gift>,
    private readonly walletService: WalletService,
    private readonly leaderboardService: LeaderboardService,
    private readonly redisService: RedisService,
    @InjectQueue('gifts') private readonly giftQueue: Queue,
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
  async sendGift(payload: GiftPayload): Promise<GiftResult> {
    
    const { eventId, userId, displayName, giftName, giftEmoji, tokens } = payload;

    // Step 1 — debit wallet. If this throws (insufficient balance, etc.) we
    // stop here; nothing else has been touched.
   const newBalance =  await this.walletService.debit({
      userId: payload.userId,
      amount: payload.amount,
      reference: payload.reference,
    })
  
    try {
      // Step 2 — concurrent writes + rank fetch.
      //
      // getUserRank is issued at the same time as the writes. Its result may
      // lag by one position if the sorted-set write hasn't flushed yet, but
      // that is acceptable — the client will reconcile on the next leaderboard
      // poll. Issuing it concurrently removes a full serial round-trip.
      //
      // addGift internally runs:
      //   zincrby + hset + hincrby(giftCount) + incrby(total_tokens) + sadd(users)
      // in a single pipeline — no separate incrementTotalTokens call needed.
      const [newScore, , rankData] = await Promise.all([
        this.leaderboardService.addGift(
          eventId,
          userId,
          displayName,
          tokens,
          giftEmoji,
        ),
        this.redis.incr(this.giftCountKey(eventId)),
        this.leaderboardService.getUserRank(eventId, userId),
      ]);

      // Step 3 — enqueue broadcast. Treated as best-effort: a transient queue
      // failure must not roll back an already-recorded gift. The worker should
      // have its own retry/DLQ strategy.
      await this.giftQueue
        .add('broadcast', {
          eventId,
          userId,
          displayName,
          giftName,
          giftEmoji,
          tokens,
          newScore,
        })
        .catch((err: unknown) =>
          this.logger.error(
            `broadcast enqueue failed — gift was recorded, worker retry expected | eventId=${eventId} userId=${userId}`,
            err,
          ),
        );

      return {
        success: true,
        newBalance,
        newScore,
        newRank: rankData?.rank ?? 0,
      };

    } catch (err) {
      // Compensating transaction — credit the tokens back since the debit
      // already succeeded but the subsequent writes failed.
      this.logger.error(
        `sendGift failed after debit — attempting refund | userId=${userId} tokens=${tokens}`,
        err,
      );

      await this.walletService
        .credit({userId, amount:tokens, reference:""})
        .catch((refundErr: unknown) =>
          // Refund itself failed — requires manual ops intervention.
          this.logger.error(
            `CRITICAL: debit succeeded but refund failed — manual reconciliation required | userId=${userId} tokens=${tokens}`,
            refundErr,
          ),
        );

      throw err;
    }
  }

  async getWalletBalance (userId:string){
    return this.walletService.getBalance(userId)
  }

  async creditUserAccount (userId:string, tokens: number, paymentReference: string){
    return await this.walletService.credit({
        userId,
        amount: tokens,
        reference: paymentReference,
      })
  }

   /**
   * Persists a gift event to the database.
   * This should be called from BullMQ worker (recommended).
   */
  async saveGift(input: SaveGiftInput): Promise<Gift> {
    const existing = await this.giftRepo.findOneBy({
    transactionId: input.transactionId
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

  async getLeaderBoard(eventId:string, limit: number){
     const [leaderboard, totalTokens] =
          await Promise.all([
            this.leaderboardService.getTop(
              eventId,
              +limit,
            ),
            this.leaderboardService.getTotalTokens(
              eventId,
            ),
          ])
    
        return {
          leaderboard,
          totalTokens,
        }
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
  async getGiftCatalog(): Promise<GiftCatalogItem[]> {
    // Per-event catalog lookup (extend when ready):
    // const override = await this.redis.get(`event:${eventId}:catalog`);
    // if (override) return JSON.parse(override);
     
    //console.log(eventId); // acknowledged — used in the lookup above when implemented
    return DEFAULT_CATALOG;
  }
}