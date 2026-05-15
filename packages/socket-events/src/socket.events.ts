export const SocketEvents = {
  roomJoin: 'room:join',
  roomLeave: 'room:leave',
  leaderboardSnapshot: 'leaderboard:snapshot',
  leaderboardUpdate: 'leaderboard:update',
  roomError: 'room:error',
  roomJoined: 'room:joined',
  giftReceived: 'gift:received',
  statsUpdate: 'stats:update',
  guestCountUpdate: 'guest:count',
} as const;

export type SocketEvent =
  (typeof SocketEvents)[keyof typeof SocketEvents];