import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WalletService } from '../wallet/wallet.service';
import Redis from 'ioredis';
import { LeaderboardService } from '@modules/leaderboard/leaderboardmodule.service';
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis';

export interface GiftPayload {
  eventId: string;
  userId: string;
  displayName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
}

export interface GiftResult {
  success: boolean;
  newBalance: number;
  newScore: number;
  newRank: number;
}

@Injectable()
export class GiftService {
   private readonly redis: Redis;
  constructor(
    private readonly walletService: WalletService,
    private readonly leaderboardService: LeaderboardService,
    private readonly redisService: RedisService,
    @InjectQueue('gifts') private readonly giftQueue: Queue,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS)
  }

  async sendGift(payload: GiftPayload): Promise<GiftResult> {
    const { eventId, userId, displayName, giftName, giftEmoji, tokens } = payload;

    // 1. Atomic wallet debit (throws if insufficient balance)
    const newBalance = await this.walletService.debit(userId, tokens);

    // 2. Atomic leaderboard increment
    const newScore = await this.leaderboardService.addGift(
      eventId,
      userId,
      displayName,
      tokens,
      giftEmoji,
    );

    // 3. Track total tokens for stats
    await this.leaderboardService.incrementTotalTokens(eventId, tokens);

    // 4. Increment event gift counter
    await this.redis.hincrby(`event:${eventId}`, 'giftCount', 1);

    // 5. Enqueue broadcast job — decoupled from the HTTP response
    await this.giftQueue.add('broadcast', {
      eventId,
      userId,
      displayName,
      giftName,
      giftEmoji,
      tokens,
      newScore,
    });

    // 6. Get the user's updated rank
    const rankData = await this.leaderboardService.getUserRank(eventId, userId);

    return {
      success: true,
      newBalance,
      newScore,
      newRank: rankData?.rank ?? 0,
    };
  }

  async getGiftCatalog(eventId?: string) {
    // Can be stored per-event in Redis or loaded from DB
    return [
      { id: 'bouquet',    name: 'Bouquet',    emoji: '💐', tokens: 50   },
      { id: 'champagne',  name: 'Champagne',  emoji: '🍾', tokens: 120  },
      { id: 'diamond',    name: 'Diamond',    emoji: '💎', tokens: 500  },
      { id: 'car',        name: 'Car Key',    emoji: '🚗', tokens: 2000 },
      { id: 'house',      name: 'House Key',  emoji: '🏠', tokens: 5000 },
      { id: 'mystery',    name: 'Mystery Box',emoji: '🎁', tokens: 80   },
      { id: 'travel',     name: 'Travel',     emoji: '✈️', tokens: 300  },
      { id: 'crown',      name: 'Crown',      emoji: '👑', tokens: 800  },
    ];
  }
}