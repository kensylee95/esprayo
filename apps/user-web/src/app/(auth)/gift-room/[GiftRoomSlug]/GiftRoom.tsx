"use client";

import { SocketEvents } from "@app/socket-events";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getTokenClient } from "@/helpers/request";
import WalletFundOverlay from "../../../../ui/components/WalletFundOverlay/WalletFundOverlay";
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
  eventData: { eventName: string; eventId: string };
}) {
  const { eventId } = eventData;
  const router = useRouter();

  const [tab, setTab] = useState<Overlay | null>(null);
  const [leaderboard, setLb] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<RoomStats>({
    guestCount: 0,
    totalTokens: 0,
    totalGifts: 0,
    eventTitle: eventData.eventName,
    eventEmoji: "🎁",
  });
  const [walletBalance, setWallet] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sentGift, setSentGift] = useState<{
    gift: GiftItem;
    newRank: number;
  } | null>(null);
  const [displayName] = useState("Chief Okafor");

  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/gift-room`, {
      auth: { token },
      transports: ["websocket"],
    });

    // ── JOIN ROOM (initial hydration via ACK) ───────────────
    socket.emit(SocketEvents.roomJoin, { eventId }, (res: GetWayRes) => {
      if (!res?.ok) {
        setRoomError(res?.error ?? "Failed to join room.");
        return;
      }

      setLb(res.leaderboard);
      setStats((s) => ({ ...s, totalTokens: res.totalTokens }));
    });

    // ── LIVE UPDATES ────────────────────────────────────────
    const handleUpdate = (payload: {
      leaderboard: LeaderboardEntry[];
      eventTokenBalance: number;
    }) => {
      setLb(payload.leaderboard);
      setStats((s) => ({ ...s, totalTokens: payload.eventTokenBalance }));
    };

    socket.on(SocketEvents.leaderboardUpdate, handleUpdate);

    // ── CLEANUP ─────────────────────────────────────────────
    return () => {
      socket.off(SocketEvents.leaderboardUpdate, handleUpdate);
      socket.emit(SocketEvents.roomLeave, { eventId });
      socket.disconnect();
    };
  }, [eventId, token]);

  // ── Fetch initial wallet balance ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-room/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(({ balance }) => setWallet(balance))
      .catch(console.error);
  }, [token]);

  // ── Send gift ────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (gift: GiftItem) => {
      if (!token) return null;
      setIsSending(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gift-room/gift`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ eventId, giftId: gift.id, displayName }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setWallet(data.newBalance);
        setSentGift({ gift, newRank: data.newRank });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSending(false);
      }
    },
    [eventId, displayName, token],
  );

  const ROOM_TABS: { key: Overlay; icon: string; label: string }[] = [
    { key: "spray", icon: "🎁", label: "Spray" },
  ];

  // ── Room error state ─────────────────────────────────────────────────────
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
      {/* ── Room header ── */}
      <header className={styles.roomHeader}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/home")}
          aria-label="Leave room"
        >
          ←
        </button>
        <div className={styles.roomInfo}>
          <p className={styles.roomTitle}>{stats.eventTitle}</p>
        </div>
        <span className={styles.liveBadge}>● LIVE</span>
      </header>

      {/* ── Gift sent confirmation ── */}
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

      <LeaderboardTab entries={leaderboard} stats={stats} />

      {tab === "spray" && (
        <SprayTab
          walletBalance={walletBalance}
          onSend={handleSend}
          isSending={isSending}
          onRecharge={() => setTab("wallet")}
          closeSprayOverlay={() => setTab(null)}
        />
      )}
      {tab === "wallet" && (
        <WalletFundOverlay
          closeWalletOverlay={() => setTab(null)}
          balance={walletBalance}
        />
      )}

      {/* ── Room bottom nav ── */}
      <nav className={styles.roomNav} aria-label="Gift room navigation">
        {ROOM_TABS.map(({ key, icon, label }) => (
          <button
            type="button"
            key={key}
            className={`${styles.roomNavItem} ${tab === key ? styles.roomNavActive : ""}`}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
          >
            <span className={styles.roomNavIcon} aria-hidden="true">
              {icon}
            </span>
            <span className={styles.roomNavLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
