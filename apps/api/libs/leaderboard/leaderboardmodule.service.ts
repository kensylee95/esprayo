import { Injectable } from '@nestjs/common';
import { RedisService, DEFAULT_REDIS } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  giftCount: number;
  lastGift: string;
}

@Injectable()
export class LeaderboardService {
  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
  }

  private lbKey(eventId: string) {
    return `event:${eventId}:lb`;
  }

  private metaKey(eventId: string, userId: string) {
    return `event:${eventId}:user:${userId}`;
  }

  /**
   * Add tokens to a user's leaderboard score.
   * Uses ZINCRBY so it's atomic — safe under concurrent gifts.
   */
  async addGift(
    eventId: string,
    userId: string,
    displayName: string,
    tokens: number,
    giftName: string,
  ): Promise<number> {
    const pipeline = this.redis.pipeline();

    // Increment leaderboard score
    pipeline.zincrby(this.lbKey(eventId), tokens, userId);

    // Store/update user meta in a hash
    pipeline.hset(this.metaKey(eventId, userId), {
      displayName,
      lastGift: giftName,
    });
    pipeline.hincrby(this.metaKey(eventId, userId), 'giftCount', 1);

    const results = await pipeline.exec();
    if(!results) throw new Error("Not a number");
    const newScore = parseFloat(results[0][1] as string);
    return newScore;
  }

  /**
   * Fetch top N from the leaderboard in descending score order.
   * ZREVRANGE with WITHSCORES returns [member, score, member, score ...]
   */
  async getTop(eventId: string, limit = 20): Promise<LeaderboardEntry[]> {
    const raw = await this.redis.zrevrange(
      this.lbKey(eventId),
      0,
      limit - 1,
      'WITHSCORES',
    );

    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < raw.length; i += 2) {
      const userId = raw[i];
      const tokens = parseFloat(raw[i + 1]);
      const rank = i / 2 + 1;

      const meta = await this.redis.hgetall(this.metaKey(eventId, userId));

      entries.push({
        rank,
        userId,
        displayName: meta.displayName ?? userId,
        tokens,
        giftCount: parseInt(meta.giftCount ?? '0', 10),
        lastGift: meta.lastGift ?? '',
      });
    }

    return entries;
  }

  /**
   * Get a single user's rank and score.
   */
  async getUserRank(
    eventId: string,
    userId: string,
  ): Promise<{ rank: number; tokens: number } | null> {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(this.lbKey(eventId), userId),
      this.redis.zscore(this.lbKey(eventId), userId),
    ]);

    if (rank === null) return null;
    return { rank: rank + 1, tokens: parseFloat(score ?? '0') };
  }

  /**
   * Total tokens gifted at this event (sum of all scores).
   * Uses a dedicated counter key for O(1) lookup.
   */
  async getTotalTokens(eventId: string): Promise<number> {
    const val = await this.redis.get(`event:${eventId}:total_tokens`);
    return parseInt(val ?? '0', 10);
  }

  async incrementTotalTokens(eventId: string, tokens: number): Promise<void> {
    await this.redis.incrby(`event:${eventId}:total_tokens`, tokens);
  }

  /**
   * Expire all leaderboard keys 24h after event ends.
   */
  async setExpiry(eventId: string, ttlSeconds = 86400): Promise<void> {
    const keys = [
      this.lbKey(eventId),
      `event:${eventId}:total_tokens`,
    ];
    const pipeline = this.redis.pipeline();
    keys.forEach((k) => pipeline.expire(k, ttlSeconds));
    await pipeline.exec();
  }
}