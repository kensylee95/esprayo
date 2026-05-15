"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
exports.SocketEvents = {
    roomJoin: 'room:join',
    roomLeave: 'room:leave',
    leaderboardSnapshot: 'leaderboard:snapshot',
    leaderboardUpdate: 'leaderboard:update',
    roomError: 'room:error',
    roomJoined: 'room:joined',
    giftReceived: 'gift:received',
    statsUpdate: 'stats:update',
    guestCountUpdate: 'guest:count', // ← add
};
