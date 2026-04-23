// src/events/redis/event-redis-keys.ts

export class EventRedisKeys {
  private static readonly PREFIX = 'event';

  /**
   * Main event hash
   * Stores:
   * title, hostId, status, slug,
   * tokenBalance, nairaBalance,
   * giftCount, gifterCount
   *
   * event:123
   */
  static event(eventId: string): string {
    return `${this.PREFIX}:${eventId}`;
  }

  /**
   * Leaderboard sorted set
   * ZINCRBY by tokens
   *
   * event:123:leaderboard
   */
  static leaderboard(eventId: string): string {
    return `${this.PREFIX}:${eventId}:leaderboard`;
  }

  /**
   * Live pub/sub updates
   * publish gift events / rank changes / sounds
   *
   * event:123:live
   */
  static live(eventId: string): string {
    return `${this.PREFIX}:${eventId}:live`;
  }

  /**
   * Recent gifts list
   *
   * event:123:recent-gifts
   */
  static recentGifts(eventId: string): string {
    return `${this.PREFIX}:${eventId}:recent-gifts`;
  }

  /**
   * Presence counter
   *
   * event:123:viewers
   */
  static viewers(eventId: string): string {
    return `${this.PREFIX}:${eventId}:viewers`;
  }

  /**
   * Guest total gifted
   *
   * event:123:gifter:user456
   */
  static gifter(eventId: string, guestId: string): string {
    return `${this.PREFIX}:${eventId}:gifter:${guestId}`;
  }

  /**
   * Lock key
   *
   * event:123:lock
   */
  static lock(eventId: string): string {
    return `${this.PREFIX}:${eventId}:lock`;
  }

  /**
   * Optional analytics stream
   *
   * event:123:stream
   */
  static stream(eventId: string): string {
    return `${this.PREFIX}:${eventId}:stream`;
  }
}