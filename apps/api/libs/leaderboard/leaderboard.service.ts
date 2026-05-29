import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@modules/redis/redis.module';

export type NairaDenomination = '50' | '100' | '200' | '500' | '1000';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  giftCount: number;
  lastGift: string;
}

export interface Denomination {
  id: string;
  label: string;
  value: number;
  color: string;
  rarity: 'common' | 'rare' | 'premium';
}

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // -------------------------
  // KEYS
  // -------------------------

  private lbKey(eventId: string): string {
    return `event:${eventId}:lb`;
  }

  private metaKey(eventId: string, userId: string): string {
    return `event:${eventId}:user:${userId}`;
  }

  // renamed for clarity
  private totalScoreKey(eventId: string): string {
    return `event:${eventId}:total_score`;
  }

  private usersSetKey(eventId: string): string {
    return `event:${eventId}:users`;
  }

  // -------------------------
  // HELPERS
  // -------------------------

  private assertPipelineResults(
    results: [Error | null, unknown][] | null,
    context: string,
  ): void {
    if (!results) {
      throw new Error(`Redis pipeline returned null — ${context}`);
    }

    for (let i = 0; i < results.length; i++) {
      const [err] = results[i];
      if (err) {
        throw new Error(
          `Redis pipeline command[${i}] failed in ${context}: ${err.message}`,
        );
      }
    }
  }

  // -------------------------
  // ADD GIFT (core write path)
  // -------------------------

  async addGift(
    eventId: string,
    userId: string,
    displayName: string,
    nairaValue: number,
    giftName: string,
  ): Promise<{ score: number; rank: number }> {
    const pipeline = this.redis.pipeline();

    pipeline.zincrby(this.lbKey(eventId), nairaValue, userId); // score update
    pipeline.zrevrank(this.lbKey(eventId), userId); // rank
    pipeline.hset(this.metaKey(eventId, userId), {
      displayName,
      lastGift: giftName,
    });
    pipeline.hincrby(this.metaKey(eventId, userId), 'giftCount', 1);
    pipeline.incrby(this.totalScoreKey(eventId), nairaValue);
    pipeline.sadd(this.usersSetKey(eventId), userId);

    const results = await pipeline.exec();
    this.assertPipelineResults(results, 'addGift');

    return {
      score: Number(results![0][1]),
      rank: Number(results![1][1]) + 1,
    };
  }

  // -------------------------
  // ADD GIFT FULL (extended metrics)
  // -------------------------

  async addGiftFull(
    eventId: string,
    userId: string,
    displayName: string,
    nairaValue: number,
    denomination: NairaDenomination,
    giftCountKey: string,
  ): Promise<{
    score: number;
    rank: number;
    totalScore: number;
    totalGifts: number;
  }> {
    const pipeline = this.redis.pipeline();

    pipeline.zincrby(this.lbKey(eventId), nairaValue, userId);
    pipeline.zrevrank(this.lbKey(eventId), userId);

    pipeline.hset(this.metaKey(eventId, userId), {
      displayName,
      lastGift: denomination,
    });

    pipeline.hincrby(this.metaKey(eventId, userId), 'giftCount', 1);

    pipeline.incrby(this.totalScoreKey(eventId), nairaValue);

    pipeline.sadd(this.usersSetKey(eventId), userId);

    pipeline.incr(giftCountKey);

    const results = await pipeline.exec();
    this.assertPipelineResults(results, 'addGiftFull');

    return {
      score: Number(results![0][1]),
      rank: Number(results![1][1]) + 1,
      totalScore: Number(results![4][1]),
      totalGifts: Number(results![6][1]),
    };
  }

  // -------------------------
  // GET TOP
  // -------------------------

  async getTop(eventId: string, limit = 20): Promise<LeaderboardEntry[]> {
    const raw = await this.redis.zrange(
      this.lbKey(eventId),
      0,
      limit - 1,
      'REV',
      'WITHSCORES',
    );

    if (raw.length === 0) return [];

    const pipeline = this.redis.pipeline();
    const users: string[] = [];

    for (let i = 0; i < raw.length; i += 2) {
      users.push(raw[i]);
      pipeline.hgetall(this.metaKey(eventId, raw[i]));
    }

    const metaResults = await pipeline.exec();
    this.assertPipelineResults(metaResults, 'getTop');

    return users.map((userId, index) => {
      const score = parseFloat(raw[index * 2 + 1]);
      const meta = metaResults![index][1] as Record<string, string> | null;

      return {
        rank: index + 1,
        userId,
        displayName: meta?.displayName ?? userId,
        score,
        giftCount: parseInt(meta?.giftCount ?? '0', 10),
        lastGift: meta?.lastGift ?? '',
      };
    });
  }

  // -------------------------
  // USER RANK
  // -------------------------

  async getUserRank(eventId: string, userId: string): Promise<number | null> {
    const rank = await this.redis.zrevrank(this.lbKey(eventId), userId);
    return rank === null ? null : rank + 1;
  }

  // -------------------------
  // TOTAL SCORE
  // -------------------------

  async getTotalScore(eventId: string): Promise<number> {
    const val = await this.redis.get(this.totalScoreKey(eventId));
    return parseInt(val ?? '0', 10);
  }

  // -------------------------
  // EXPIRY
  // -------------------------

  async setExpiry(eventId: string, ttlSeconds = 86_400): Promise<void> {
    const userIds = await this.redis.smembers(this.usersSetKey(eventId));

    const pipeline = this.redis.pipeline();

    pipeline.expire(this.lbKey(eventId), ttlSeconds);
    pipeline.expire(this.totalScoreKey(eventId), ttlSeconds);
    pipeline.expire(this.usersSetKey(eventId), ttlSeconds);

    for (const userId of userIds) {
      pipeline.expire(this.metaKey(eventId, userId), ttlSeconds);
    }

    const results = await pipeline.exec();
    this.assertPipelineResults(results, 'setExpiry');
  }

  // -------------------------
  // RESET
  // -------------------------

  async resetEvent(eventId: string): Promise<void> {
    const userIds = await this.redis.smembers(this.usersSetKey(eventId));

    const pipeline = this.redis.pipeline();

    pipeline.del(this.lbKey(eventId));
    pipeline.del(this.totalScoreKey(eventId));
    pipeline.del(this.usersSetKey(eventId));

    for (const userId of userIds) {
      pipeline.del(this.metaKey(eventId, userId));
    }

    const results = await pipeline.exec();
    this.assertPipelineResults(results, 'resetEvent');
  }
}
