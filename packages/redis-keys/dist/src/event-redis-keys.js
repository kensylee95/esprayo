"use strict";
// src/events/redis/event-redis-keys.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRedisKeys = void 0;
class EventRedisKeys {
    /**
     * Main event hash
     * Stores:
     * title, hostId, status, slug,
     * tokenBalance, nairaBalance,
     * giftCount, gifterCount
     *
     * event:123
     */
    static event(eventId) {
        return `${this.PREFIX}:${eventId}`;
    }
    /**
     * Leaderboard sorted set
     * ZINCRBY by tokens
     *
     * event:123:leaderboard
     */
    static leaderboard(eventId) {
        return `${this.PREFIX}:${eventId}:leaderboard`;
    }
    /**
     * Live pub/sub updates
     * publish gift events / rank changes / sounds
     *
     * event:123:live
     */
    static live(eventId) {
        return `${this.PREFIX}:${eventId}:live`;
    }
    /**
     * Recent gifts list
     *
     * event:123:recent-gifts
     */
    static recentGifts(eventId) {
        return `${this.PREFIX}:${eventId}:recent-gifts`;
    }
    /**
     * Presence counter
     *
     * event:123:viewers
     */
    static viewers(eventId) {
        return `${this.PREFIX}:${eventId}:viewers`;
    }
    /**
     * Guest total gifted
     *
     * event:123:gifter:user456
     */
    static gifter(eventId, guestId) {
        return `${this.PREFIX}:${eventId}:gifter:${guestId}`;
    }
    /**
     * Lock key
     *
     * event:123:lock
     */
    static lock(eventId) {
        return `${this.PREFIX}:${eventId}:lock`;
    }
    /**
     * Optional analytics stream
     *
     * event:123:stream
     */
    static stream(eventId) {
        return `${this.PREFIX}:${eventId}:stream`;
    }
}
exports.EventRedisKeys = EventRedisKeys;
EventRedisKeys.PREFIX = 'event';
