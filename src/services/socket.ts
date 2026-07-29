import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketToken: string | null = null;

export const createGiftRoomSocket = (token: string) => {
  if (socket && socketToken === token) return socket;

  if (socket) {
    socket.disconnect();
  }

  socketToken = token;

  socket = io(`${process.env.NEXT_PUBLIC_API_URL}/gift-room`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
};
