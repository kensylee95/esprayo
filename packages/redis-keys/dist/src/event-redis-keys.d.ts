export declare class EventRedisKeys {
    private static readonly PREFIX;
    /**
     * Main event hash
     * Stores:
     * title, hostId, status, slug,
     * tokenBalance, nairaBalance,
     * giftCount, gifterCount
     *
     * event:123
     */
    static event(eventId: string): string;
    /**
     * Leaderboard sorted set
     * ZINCRBY by tokens
     *
     * event:123:leaderboard
     */
    static leaderboard(eventId: string): string;
    /**
     * Live pub/sub updates
     * publish gift events / rank changes / sounds
     *
     * event:123:live
     */
    static live(eventId: string): string;
    /**
     * Recent gifts list
     *
     * event:123:recent-gifts
     */
    static recentGifts(eventId: string): string;
    /**
     * Presence counter
     *
     * event:123:viewers
     */
    static viewers(eventId: string): string;
    /**
     * Guest total gifted
     *
     * event:123:gifter:user456
     */
    static gifter(eventId: string, guestId: string): string;
    /**
     * Lock key
     *
     * event:123:lock
     */
    static lock(eventId: string): string;
    /**
     * Optional analytics stream
     *
     * event:123:stream
     */
    static stream(eventId: string): string;
}
