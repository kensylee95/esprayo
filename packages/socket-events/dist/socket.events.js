"use strict";
// src/socket/socket-events.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
/**
 * Socket event names used between backend ↔ frontend.
 *
 * IMPORTANT:
 * - This is ONLY for real-time communication
 * - DO NOT use Redis keys here
 */
exports.SocketEvents = {
    /**
     * Client → Server: join a room
     */
    roomJoin: 'room:join',
    /**
     * Client → Server: leave a room
     */
    roomLeave: 'room:leave',
    /**
     * Server → Client: initial snapshot when user joins
     */
    leaderboardSnapshot: 'leaderboard:snapshot',
    /**
     * Server → Client: live leaderboard updates (after gifts, rank changes)
     */
    leaderboardUpdate: 'leaderboard:update',
    /**
     * Server → Client: generic room errors
     */
    roomError: 'room:error',
    /**
     * Server → Client: confirmation of successful join (optional but useful)
     */
    roomJoined: 'room:joined',
    /**
     * Server → Client: when a gift is sent live
     */
    giftReceived: 'gift:received',
    /**
     * Server → Client: live stats updates (tokens, gifts, viewers, etc.)
     */
    statsUpdate: 'stats:update',
};
