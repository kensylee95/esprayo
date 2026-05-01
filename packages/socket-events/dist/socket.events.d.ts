/**
 * Socket event names used between backend ↔ frontend.
 *
 * IMPORTANT:
 * - This is ONLY for real-time communication
 * - DO NOT use Redis keys here
 */
export declare const SocketEvents: {
    /**
     * Client → Server: join a room
     */
    readonly roomJoin: "room:join";
    /**
     * Client → Server: leave a room
     */
    readonly roomLeave: "room:leave";
    /**
     * Server → Client: initial snapshot when user joins
     */
    readonly leaderboardSnapshot: "leaderboard:snapshot";
    /**
     * Server → Client: live leaderboard updates (after gifts, rank changes)
     */
    readonly leaderboardUpdate: "leaderboard:update";
    /**
     * Server → Client: generic room errors
     */
    readonly roomError: "room:error";
    /**
     * Server → Client: confirmation of successful join (optional but useful)
     */
    readonly roomJoined: "room:joined";
    /**
     * Server → Client: when a gift is sent live
     */
    readonly giftReceived: "gift:received";
    /**
     * Server → Client: live stats updates (tokens, gifts, viewers, etc.)
     */
    readonly statsUpdate: "stats:update";
};
/**
 * Union type of all socket event values
 */
export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
