export declare const SocketEvents: {
    readonly roomJoin: "room:join";
    readonly roomLeave: "room:leave";
    readonly leaderboardSnapshot: "leaderboard:snapshot";
    readonly leaderboardUpdate: "leaderboard:update";
    readonly roomError: "room:error";
    readonly roomJoined: "room:joined";
    readonly giftReceived: "gift:received";
    readonly statsUpdate: "stats:update";
    readonly guestCountUpdate: "guest:count";
};
export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
