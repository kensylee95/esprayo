"use client";

import { SocketEvents } from "@app/socket-events";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

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

// ─── Sound System ─────────────────────────────────────────────────────────────
// Web Audio API only — zero installs

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

function playCashSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

function playRoomBurstSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

function playNumber1Sound(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + i * 0.08 + 0.3,
    );
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
  });
}

function playRivalrySound(ctx: AudioContext) {
  [400, 500].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + i * 0.12 + 0.1,
    );
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.1);
  });
}

// ─── Confetti Helpers ─────────────────────────────────────────────────────────

function triggerSenderBurst() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: 0.5, y: 0.7 },
    colors: ["#FFD700", "#FFA500", "#ffffff", "#00ff88"],
    gravity: 0.9,
    scalar: 1.3,
  });
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { x: 0.4, y: 0.7 },
      colors: ["#FFD700", "#FFA500"],
      gravity: 1.1,
    });
  }, 150);
}

function triggerNumber1Burst() {
  confetti({
    particleCount: 200,
    spread: 120,
    origin: { x: 0.2, y: 0.5 },
    colors: ["#FFD700", "#FFA500", "#fff700"],
    gravity: 0.7,
    scalar: 1.5,
  });
  setTimeout(() => {
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { x: 0.8, y: 0.5 },
      colors: ["#FFD700", "#FFA500", "#fff700"],
      gravity: 0.7,
      scalar: 1.5,
    });
  }, 100);
}

function triggerRoomBurst() {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x: Math.random() * 0.6 + 0.2, y: 0.8 },
    colors: ["#FFD700", "#FFA500", "#ffffff"],
    gravity: 1.2,
    scalar: 0.8,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

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
    rankDiff: number;
    isNumber1: boolean;
  } | null>(null);

  const [streak, setStreak] = useState(0);
  const streakTimerRef = useRef<NodeJS.Timeout>(undefined);

  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const liveAlertTimerRef = useRef<NodeJS.Timeout>(undefined);

  const [rivalryAlert, setRivalryAlert] = useState<string | null>(null);
  const [showNumber1, setShowNumber1] = useState(false);

  const prevRankRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    return audioCtxRef.current;
  }, []);

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
        { eventId },
        (res: GetWayRes) => {
          if (!res?.ok) {
            setRoomError(res?.error ?? "Failed to join room.");
            return;
          }
          setLb(res.leaderboard);
          setStats((s) => ({ ...s, totalTokens: res.totalTokens }));
        },
      );
    };

    const handleLeaderboardUpdate = (payload: {
      leaderboard: LeaderboardEntry[];
      totalTokens: number;
    }) => {
      setLb(payload.leaderboard);
      setStats((s) => ({ ...s, totalTokens: payload.totalTokens }));
    };

    // Fires for every spray from any user — drives shared room energy
    const handleGiftReceived = (payload: {
      displayName: string;
      giftEmoji: string;
      giftName: string;
      tokens: number;
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

    // Wire rivalry from backend when ready
    const handleRivalry = (payload: {
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
    socket.on(SocketEvents.leaderboardUpdate, handleLeaderboardUpdate);
    socket.on(SocketEvents.giftReceived, handleGiftReceived);
    socket.on("alert:rivalry", handleRivalry);

    if (socket.connected) joinRoom();

    return () => {
      socket.emit(SocketEvents.roomLeave, { eventId });
      socket.off("connect", joinRoom);
      socket.off(SocketEvents.leaderboardUpdate, handleLeaderboardUpdate);
      socket.off(SocketEvents.giftReceived, handleGiftReceived);
      socket.off("alert:rivalry", handleRivalry);
    };
  }, [token, eventId, getAudio]);

  const handleSend = useCallback(
    async (gift: GiftItem) => {
      try {
        navigator.vibrate?.(80);
        const ctx = getAudio(); // initialise audio on first gesture

        const data = await sendGift({ eventId, giftId: gift.id, displayName });
        // instant UI update
        wallet.setBalance(data.newBalance);
        const rankDiff =
          prevRankRef.current !== null
            ? prevRankRef.current - data.newRank
            : 0;
        prevRankRef.current = data.newRank;

        const isNumber1 = data.newRank === 1;

        if (isNumber1) {
          triggerNumber1Burst();
          if (ctx) playNumber1Sound(ctx);
          navigator.vibrate?.([100, 50, 100, 50, 200]);
          setShowNumber1(true);
          setTimeout(() => setShowNumber1(false), 3000);
        } else {
          triggerSenderBurst();
          if (ctx) playCashSound(ctx);
        }

        clearTimeout(streakTimerRef.current);
        setStreak((s) => s + 1);
        streakTimerRef.current = setTimeout(() => setStreak(0), 5000);

        setSentGift({ gift, newRank: data.newRank, rankDiff, isNumber1 });
      } catch (error) {
        console.error(error);
      }
    },
    [sendGift, eventId, displayName, wallet, getAudio],
  );

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

      {/* Header */}
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

        {streak > 1 && (
          <motion.span
            key={streak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={styles.streakBadge}
          >
            🔥 x{streak}
          </motion.span>
        )}

        <span className={styles.liveBadge}>● LIVE</span>
      </header>

      {/* Live alert — other people's sprays */}
      <AnimatePresence>
        {liveAlert && (
          <motion.div
            className={styles.liveAlert}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {liveAlert}
          </motion.div>
        )}
      </AnimatePresence>

      <LeaderboardTab entries={leaderboard} stats={stats} />

      {/* #1 takeover moment */}
      <AnimatePresence>
        {showNumber1 && (
          <motion.div
            className={styles.number1Overlay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <motion.p
              className={styles.number1Crown}
              animate={{ rotate: [-8, 8, -8, 8, 0] }}
              transition={{ duration: 0.5 }}
            >
              👑
            </motion.p>
            <p className={styles.number1Title}>You're #1!</p>
            <p className={styles.number1Sub}>Leading the room!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sent gift overlay */}
      <AnimatePresence>
        {sentGift && (
          <motion.div
            className={styles.sentOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${styles.sentCard} ${sentGift.isNumber1 ? styles.sentCardGold : ""}`}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <motion.span
                className={styles.sentEmoji}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {sentGift.gift.emoji}
              </motion.span>

              <p className={styles.sentTitle}>
                {sentGift.isNumber1 ? "You're on fire! 🔥" : "Gift sprayed!"}
              </p>

              <p className={styles.sentName}>{sentGift.gift.name}</p>

              <div className={styles.rankCard}>
                <p className={styles.rankLabel}>Your rank</p>

                <motion.p
                  className={styles.rankVal}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  #{sentGift.newRank}
                </motion.p>

                {sentGift.rankDiff > 0 && (
                  <motion.p
                    className={styles.rankUp}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    ⬆ Up {sentGift.rankDiff} spot
                    {sentGift.rankDiff > 1 ? "s" : ""}!
                  </motion.p>
                )}

                {sentGift.rankDiff === 0 && prevRankRef.current !== null && (
                  <p className={styles.rankSame}>Holding strong 💪</p>
                )}
              </div>

              <button
                type="button"
                className={styles.sentClose}
                onClick={() => setSentGift(null)}
              >
                Back to leaderboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === "spray" && (
        <SprayTab
          walletBalance={wallet.balance ?? 0}
          onSend={handleSend}
          isSending={isSending}
          onRecharge={() => setTab("wallet")}
          closeSprayOverlay={() => setTab(null)}
          streak={streak}
        />
      )}

      {tab === "wallet" && (
        <WalletFundOverlay
          closeWalletOverlay={() => setTab(null)}
          balance={wallet.balance ?? 0}
        />
      )}

      {/* Rivalry toast */}
      <AnimatePresence>
        {rivalryAlert && (
          <motion.div
            className={styles.rivalryToast}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {rivalryAlert}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={styles.roomNav}>
        {[{ key: "spray" as const, icon: "🎁", label: "Spray" }].map(
          ({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.roomNavItem} ${tab === key ? styles.roomNavActive : ""}`}
              onClick={() => setTab(key)}
            >
              <span className={styles.roomNavIcon}>{icon}</span>
              <span className={styles.roomNavLabel}>{label}</span>
            </button>
          ),
        )}
      </nav>
    </div>
  );
}