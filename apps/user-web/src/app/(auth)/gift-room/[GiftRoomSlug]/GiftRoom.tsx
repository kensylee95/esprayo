"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import WalletFundOverlay from "../../../../ui/components/WalletFundOverlay/WalletFundOverlay";
import type {
  GiftItem,
  LeaderboardEntry,
  Overlay,
  RoomStats,
} from "./GiftRoom.dto";
import styles from "./GiftRoom.module.scss";
import LeaderboardTab from "./LeaderboardTab";
import { leaderboardData } from "./mockData";
import SprayTab from "./SprayTab";

export default function GiftRoomPage({
  eventData,
}: {
  eventData: { eventName: string };
}) {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const [tab, setTab] = useState<Overlay | null>(null);
  const [leaderboard, setLb] = useState<LeaderboardEntry[]>(leaderboardData);
  const [stats, setStats] = useState<RoomStats>({
    guestCount: 0,
    totalTokens: 0,
    totalGifts: 0,
    eventTitle: eventData.eventName,
    eventEmoji: "🎁",
  });
  const [walletBalance, setWallet] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sentGift, setSentGift] = useState<{
    gift: GiftItem;
    newRank: number;
  } | null>(null);
  const [displayName] = useState("Chief Okafor");

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("serenade_token") ?? "";
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/gift-room`, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("room:join", { eventId, role: "guest" });
    });

    socket.on("leaderboard:snapshot", ({ leaderboard, totalTokens, _role }) => {
      setLb(leaderboard);
      setStats((s) => ({ ...s, totalTokens }));
    });

    socket.on(
      "leaderboard:update",
      ({ leaderboard, eventTokenBalance, _latestGift }) => {
        setLb(leaderboard);
        setStats((s) => ({ ...s, totalTokens: eventTokenBalance }));
      },
    );

    return () => {
      socket.emit("room:leave", { eventId });
      socket.disconnect();
    };
  }, [eventId]);

  // ── Fetch initial wallet balance ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-room/wallet`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("serenade_token")}`,
      },
    })
      .then((r) => r.json())
      .then(({ balance }) => setWallet(balance))
      .catch(console.error);
  }, []);

  // ── Send gift ────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (gift: GiftItem) => {
      setIsSending(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gift-room/gift`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("serenade_token")}`,
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
    [eventId, displayName],
  );

  const ROOM_TABS: { key: Overlay; icon: string; label: string }[] = [
    { key: "spray", icon: "🎁", label: "Spray" },
  ];

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
