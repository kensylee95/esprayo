"use client";

import { SocketEvents } from "@app/socket-events";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getTokenClient } from "@/helpers/request";
import { useGiftSender } from "@/hooks/useSendGift";
import { useWallet } from "@/hooks/useWallets";
import { createGiftRoomSocket } from "@/services/socket";

import WalletFundOverlay from "@/ui/components/WalletFundOverlay/WalletFundOverlay";

import type {
  GetWayRes,
  GiftItem,
  LeaderboardEntry,
  Overlay,
  RoomStats,
} from "./GiftRoom.dto";

import styles from "./GiftRoom.module.scss";
import LeaderboardTab from "./LeaderboardTab";
import SprayTab from "./SprayTab";

export default function GiftRoomPage({
  eventData,
}: {
  eventData: {
    eventName: string;
    eventId: string;
  };
}) {
  const router = useRouter();

  const { eventId } = eventData;

  const wallet = useWallet();

  const [token, setToken] = useState<string | null>(null);

  const [tab, setTab] = useState<Overlay | null>(null);

  const [leaderboard, setLb] = useState<LeaderboardEntry[]>([]);

  const [stats, setStats] = useState<RoomStats>({
    guestCount: 0,
    totalTokens: 0,
    totalGifts: 0,
    eventTitle: eventData.eventName,
    eventEmoji: "🎁",
  });

  const [roomError, setRoomError] = useState<string | null>(null);

  const [displayName] = useState("Chief Okafor");

  const [sentGift, setSentGift] = useState<{
    gift: GiftItem;
    newRank: number;
  } | null>(null);

  const { sendGift, isSending } = useGiftSender(token);

  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = createGiftRoomSocket(token);

    const joinRoom = () => {
      socket.emit(
        SocketEvents.roomJoin,
        {
          eventId,
        },
        (res: GetWayRes) => {
          if (!res?.ok) {
            setRoomError(res?.error ?? "Failed to join room.");

            return;
          }

          setLb(res.leaderboard);

          setStats((s) => ({
            ...s,

            totalTokens: res.totalTokens,
          }));
        },
      );
    };

    const handleUpdate = (payload: {
      leaderboard: LeaderboardEntry[];

      totalTokens: number;
    }) => {
      setLb(payload.leaderboard);

      setStats((s) => ({
        ...s,

        totalTokens: payload.totalTokens,
      }));
    };

    socket.on("connect", joinRoom);

    socket.on(SocketEvents.leaderboardUpdate, handleUpdate);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.emit(SocketEvents.roomLeave, {
        eventId,
      });

      socket.off("connect", joinRoom);

      socket.off(SocketEvents.leaderboardUpdate, handleUpdate);
    };
  }, [token, eventId]);

  const handleSend = useCallback(
    async (gift: GiftItem) => {
      try {
        const data = await sendGift({
          eventId,
          giftId: gift.id,
          displayName,
        });

        await wallet.fetchWallet();

        setSentGift({
          gift,

          newRank: data.newRank,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [sendGift, eventId, displayName, wallet],
  );

  const ROOM_TABS = [
    {
      key: "spray" as const,
      icon: "🎁",
      label: "Spray",
    },
  ];

  if (roomError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{roomError}</p>

          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.push("/home")}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/home")}
        >
          ←
        </button>

        <div className={styles.roomInfo}>
          <p className={styles.roomTitle}>{stats.eventTitle}</p>
        </div>

        <span className={styles.liveBadge}>● LIVE</span>
      </header>

      <LeaderboardTab entries={leaderboard} stats={stats} />

      {sentGift && (
        <div className={styles.sentOverlay}>
          <div className={styles.sentCard}>
            <span className={styles.sentEmoji}>{sentGift.gift.emoji}</span>

            <p className={styles.sentTitle}>Gift sprayed!</p>

            <p className={styles.sentName}>{sentGift.gift.name}</p>

            <div className={styles.rankCard}>
              <p className={styles.rankLabel}>Your new rank</p>

              <p className={styles.rankVal}>#{sentGift.newRank}</p>
            </div>

            <button
              type="button"
              className={styles.sentClose}
              onClick={() => setSentGift(null)}
            >
              Back to leaderboard
            </button>
          </div>
        </div>
      )}

      {tab === "spray" && (
        <SprayTab
          walletBalance={wallet.balance ?? 0}
          onSend={handleSend}
          isSending={isSending}
          onRecharge={() => setTab("wallet")}
          closeSprayOverlay={() => setTab(null)}
        />
      )}

      {tab === "wallet" && (
        <WalletFundOverlay
          closeWalletOverlay={() => setTab(null)}
          balance={wallet.balance ?? 0}
        />
      )}

      <nav className={styles.roomNav}>
        {ROOM_TABS.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.roomNavItem} ${
              tab === key ? styles.roomNavActive : ""
            }`}
            onClick={() => setTab(key)}
          >
            <span className={styles.roomNavIcon}>{icon}</span>

            <span className={styles.roomNavLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
