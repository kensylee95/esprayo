import { Injectable, Logger } from '@nestjs/common'
import { RedisService, DEFAULT_REDIS } from '@liaoliaots/nestjs-redis'
import Redis, { ChainableCommander } from 'ioredis'

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  tokens: number
  giftCount: number
  lastGift: string
}

@Injectable()
export class LeaderboardService {
  private readonly redis: Redis

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS)
  }

  // -------------------------
  // KEYS
  // -------------------------

  private lbKey(eventId: string): string {
    return `event:${eventId}:lb`
  }

  private metaKey(eventId: string, userId: string): string {
    return `event:${eventId}:user:${userId}`
  }

  private totalKey(eventId: string): string {
    return `event:${eventId}:total_tokens`
  }

  /** Tracks all user IDs that have participated in an event.
   *  Used instead of KEYS pattern-scan in setExpiry. */
  private usersSetKey(eventId: string): string {
    return `event:${eventId}:users`
  }

  // -------------------------
  // HELPERS
  // -------------------------

  /**
   * Asserts that every pipeline result succeeded.
   * pipeline.exec() resolves even on per-command failures — each slot is [Error|null, value].
   */
  private assertPipelineResults(
    results: [Error | null, unknown][] | null,
    context: string,
  ): void {
    if (!results) {
      throw new Error(`Redis pipeline returned null — ${context}`)
    }

    for (let i = 0; i < results.length; i++) {
      const [err] = results[i]
      if (err) {
        throw new Error(
          `Redis pipeline command[${i}] failed in ${context}: ${err.message}`,
        )
      }
    }
  }

  // -------------------------
  // ADD GIFT
  // -------------------------

  /**
   * Atomically records a gift:
   *  - Increments the user's score in the sorted set
   *  - Updates display name + last gift in the user hash
   *  - Increments gift count in the user hash
   *  - Increments the event-wide total token counter
   *  - Registers the user in the membership set (avoids KEYS scan later)
   *
   * Returns the user's new cumulative token total.
   *
   * FIX: Reads the new score directly from the zincrby pipeline result
   * instead of making a separate zscore round-trip.
   */
  async addGift(
    eventId: string,
    userId: string,
    displayName: string,
    tokens: number,
    giftName: string,
  ): Promise<number> {
    const pipeline = this.redis.pipeline()

    // [0] zincrby — returns the new score as a string
    pipeline.zincrby(this.lbKey(eventId), tokens, userId)

    // [1] hset — update display name + last gift
    pipeline.hset(this.metaKey(eventId, userId), {
      displayName,
      lastGift: giftName,
    })

    // [2] hincrby — increment gift counter
    pipeline.hincrby(this.metaKey(eventId, userId), 'giftCount', 1)

    // [3] incrby — update event-wide total
    pipeline.incrby(this.totalKey(eventId), tokens)

    // [4] sadd — register userId so setExpiry can find it without KEYS
    pipeline.sadd(this.usersSetKey(eventId), userId)

    const results = await pipeline.exec()
    this.assertPipelineResults(results, 'addGift')

    // results[0][1] is the string value returned by zincrby
    return parseFloat(results![0][1] as string)
  }

  // -------------------------
  // GET TOP
  // -------------------------

  /**
   * Returns the top `limit` entries, ranked highest-first.
   *
   * FIX: Replaced deprecated ZREVRANGE with ZRANGE … REV (Redis 6.2+).
   * Per-command errors in the meta pipeline are now checked.
   */
  async getTop(eventId: string, limit = 20): Promise<LeaderboardEntry[]> {
    // ZRANGE … REV replaces the deprecated ZREVRANGE command
    const raw = await this.redis.zrange(
      this.lbKey(eventId),
      0,
      limit - 1,
      'REV',
      'WITHSCORES',
    )

    if (raw.length === 0) return []

    const pipeline = this.redis.pipeline()
    const users: string[] = []

    for (let i = 0; i < raw.length; i += 2) {
      users.push(raw[i])
      pipeline.hgetall(this.metaKey(eventId, raw[i]))
    }

    const metaResults = await pipeline.exec()
    this.assertPipelineResults(metaResults, 'getTop')

    return users.map((userId, index) => {
      const score = parseFloat(raw[index * 2 + 1])
      const meta = metaResults![index][1] as Record<string, string> | null

      return {
        rank: index + 1,
        userId,
        displayName: meta?.displayName ?? userId,
        tokens: score,
        giftCount: parseInt(meta?.giftCount ?? '0', 10),
        lastGift: meta?.lastGift ?? '',
      }
    })
  }

  // -------------------------
  // USER RANK
  // -------------------------

  async getUserRank(
    eventId: string,
    userId: string,
  ): Promise<{ rank: number; tokens: number } | null> {
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(this.lbKey(eventId), userId),
      this.redis.zscore(this.lbKey(eventId), userId),
    ])

    if (rank === null) return null

    return {
      rank: rank + 1,
      tokens: parseFloat(score ?? '0'),
    }
  }

  // -------------------------
  // TOTAL TOKENS
  // -------------------------

  async getTotalTokens(eventId: string): Promise<number> {
    const val = await this.redis.get(this.totalKey(eventId))
    // parseInt matches the INCRBY integer semantics of this key
    return parseInt(val ?? '0', 10)
  }

  // -------------------------
  // EXPIRY
  // -------------------------

  /**
   * Sets a TTL on all keys belonging to an event.
   *
   * FIX: Replaced KEYS pattern-scan (blocks Redis event loop) with SMEMBERS
   * on the usersSetKey that addGift maintains incrementally. The membership
   * set itself is also expired.
   *
   * NOTE: If you need to call setExpiry on events that were written before
   * this version was deployed (i.e. the usersSetKey didn't exist yet), run a
   * one-off migration to populate the set, or fall back to the KEYS scan in a
   * controlled maintenance window.
   */
  async setExpiry(eventId: string, ttlSeconds = 86_400): Promise<void> {
    const userIds = await this.redis.smembers(this.usersSetKey(eventId))

    const pipeline = this.redis.pipeline()

    pipeline.expire(this.lbKey(eventId), ttlSeconds)
    pipeline.expire(this.totalKey(eventId), ttlSeconds)
    pipeline.expire(this.usersSetKey(eventId), ttlSeconds)

    for (const userId of userIds) {
      pipeline.expire(this.metaKey(eventId, userId), ttlSeconds)
    }

    const results = await pipeline.exec()
    this.assertPipelineResults(results, 'setExpiry')
  }

  // -------------------------
  // RESET (utility)
  // -------------------------

  /**
   * Deletes all keys for an event. Useful for testing or early teardown.
   * Uses the same membership-set approach to avoid KEYS.
   */
  async resetEvent(eventId: string): Promise<void> {
    const userIds = await this.redis.smembers(this.usersSetKey(eventId))

    const pipeline = this.redis.pipeline()

    pipeline.del(this.lbKey(eventId))
    pipeline.del(this.totalKey(eventId))
    pipeline.del(this.usersSetKey(eventId))

    for (const userId of userIds) {
      pipeline.del(this.metaKey(eventId, userId))
    }

    const results = await pipeline.exec()
    this.assertPipelineResults(results, 'resetEvent')
  }
}