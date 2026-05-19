import { SocketEvents } from "@app/socket-events";
import { useCallback, useEffect, useRef, useState } from "react";
import { createGiftRoomSocket } from "@/services/socket";
import {
  createAudioContext,
  playRivalrySound,
  playRoomBurstSound,
} from "../app/(auth)/gift-room/[giftRoomSlug]/audio";
import { triggerRoomBurst } from "../app/(auth)/gift-room/[giftRoomSlug]/confetti";
import type {
  GetWayRes,
  LeaderboardEntry,
  LeaderboardUpdatePayload,
  RoomStats,
} from "../app/(auth)/gift-room/[giftRoomSlug]/GiftRoom.dto";

export function useGiftRoom(token: string | null, eventId: string) {
  const [leaderboard, setLb] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<RoomStats>({
    guestCount: 0,
    totalTokens: 0,
    totalGifts: 0,
    eventTitle: "",
    eventEmoji: "🎁",
  });
  const [roomError, setRoomError] = useState<string | null>(null);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [rivalryAlert, setRivalryAlert] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const liveAlertTimerRef = useRef<NodeJS.Timeout>(undefined);

  const getAudio = useCallback(() => {
    audioCtxRef.current ??= createAudioContext();
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = createGiftRoomSocket(token);

    const joinRoom = () => {
      socket.emit(
        SocketEvents.roomJoin,
        { eventId, role: "guest" },
        (res: GetWayRes) => {
          if (!res?.ok) {
            setRoomError(res?.error ?? "Failed to join room.");
            return;
          }
          setLb(res.leaderboard);
          setStats((s) => ({
            ...s,
            totalTokens: res.totalTokens,
            totalGifts: res.totalGifts ?? 0,
            guestCount: res.guestCount ?? 0,
          }));
        },
      );
    };

    const onLeaderboardUpdate = (payload: LeaderboardUpdatePayload) => {
      setStats((s) => ({
        ...s,
        totalTokens: payload.totalTokens,
        totalGifts: payload.totalGifts,
      }));

      setLb((prev) => {
        const { userId, displayName, newScore, newRank, giftCount } =
          payload.patch;

        const exists = prev.some((e) => e.userId === userId);

        const updated = exists
          ? prev.map((e) =>
              e.userId === userId
                ? {
                    ...e,
                    displayName,
                    tokens: newScore,
                    rank: newRank,

                    // update live values too
                    giftCount: giftCount ?? (e.giftCount ?? 0) + 1,
                  }
                : e,
            )
          : [
              ...prev,
              {
                userId,
                displayName,
                tokens: newScore,
                rank: newRank,
                giftCount: giftCount ?? 1,
              },
            ];

        return updated
          .sort((a, b) => b.tokens - a.tokens)
          .map((e, i) => ({
            ...e,
            rank: i + 1,
          }));
      });
    };

    const onGuestCountUpdate = (payload: { guestCount: number }) => {
      setStats((s) => ({ ...s, guestCount: payload.guestCount }));
    };

    const onGiftReceived = (payload: {
      displayName: string;
      giftEmoji: string;
      giftName: string;
    }) => {
      triggerRoomBurst();
      navigator.vibrate?.(30);
      const ctx = getAudio();
      if (ctx) playRoomBurstSound(ctx);
      clearTimeout(liveAlertTimerRef.current);
      setLiveAlert(
        `${payload.giftEmoji} ${payload.displayName} sprayed ${payload.giftName}!`,
      );
      liveAlertTimerRef.current = setTimeout(() => setLiveAlert(null), 2500);
    };

    const onRivalry = (payload: {
      gap: number;
      name: string;
      isBeingHunted: boolean;
    }) => {
      const msg = payload.isBeingHunted
        ? `🔥 Someone is ₦${payload.gap.toLocaleString()} behind you!`
        : `⚡ You're ₦${payload.gap.toLocaleString()} from overtaking ${payload.name}!`;
      setRivalryAlert(msg);
      const ctx = getAudio();
      if (ctx) playRivalrySound(ctx);
      navigator.vibrate?.([50, 30, 50]);
      setTimeout(() => setRivalryAlert(null), 4000);
    };

    socket.on("connect", joinRoom);
    socket.on(SocketEvents.leaderboardUpdate, onLeaderboardUpdate);
    socket.on(SocketEvents.giftReceived, onGiftReceived);
    socket.on(SocketEvents.guestCountUpdate, onGuestCountUpdate);
    socket.on("alert:rivalry", onRivalry);

    if (socket.connected) joinRoom();

    return () => {
      socket.emit(SocketEvents.roomLeave, { eventId });
      socket.off("connect", joinRoom);
      socket.off(SocketEvents.leaderboardUpdate, onLeaderboardUpdate);
      socket.off(SocketEvents.giftReceived, onGiftReceived);
      socket.off(SocketEvents.guestCountUpdate, onGuestCountUpdate);
      socket.off("alert:rivalry", onRivalry);
    };
  }, [token, eventId, getAudio]);

  return {
    leaderboard,
    stats,
    setStats,
    roomError,
    liveAlert,
    rivalryAlert,
    getAudio,
  };
}
