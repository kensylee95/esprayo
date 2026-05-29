"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import { useGiftRoom } from "@/hooks/useGiftRoom";
import type { IEvent } from "@/services/Event/Event.dto";
import styles from "./LeaderboardDisplay.module.scss";
import type { LeaderboardEntry } from "./leaderboard.dto";
import LbRow from "./leaderboardRow";

// ── Helpers ───────────────────────────────────────────────────────────────────

function LiveDot() {
  return <span className={styles.liveDot} aria-hidden="true" />;
}


function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const controls = useAnimationControls();
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;

    setDisplay(value);

    // trigger flip animation
    controls.start({
      rotateX: [90, -10, 0],
      opacity: [0, 1, 1],
      y: [6, 0, 0],
      transition: {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      },
    });

    prev.current = value;
  }, [value, controls]);

  return (
    <motion.span
      animate={controls}
      style={{
        display: "inline-block",
        transformOrigin: "50% 50%",
        perspective: 1000,
      }}
    >
      {display.toLocaleString()}
    </motion.span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastData {
  id: string;
  who: string;
  what: string;
  tokens: number;
  emoji?: string;
}

function Toast({ toast }: { toast: ToastData }) {
  return (
    <motion.div
      className={styles.toast}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      layout
    >
      <span className={styles.toastEmoji}>{toast.emoji ?? "🎁"}</span>
      <div className={styles.toastText}>
        <p className={styles.toastWho}>{toast.who}</p>
        <p className={styles.toastWhat}>{toast.what}</p>
      </div>
      <span className={styles.toastTokens}>
        +{toast.tokens.toLocaleString()} tkn
      </span>
    </motion.div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  delay: number;
  colour: string;
  rotate: number;
}

const CONFETTI_COLOURS = [
  "#F5C842",
  "#E8834F",
  "#9B6CF5",
  "#4FCEDB",
  "#F56CA8",
];

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const ps: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      rotate: Math.random() * 360,
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(t);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className={styles.confettiWrap} aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={styles.confettiPiece}
          style={{ left: `${p.x}%`, background: p.colour, rotate: p.rotate }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate + 360 }}
          transition={{ duration: 3, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ── Silence badge ─────────────────────────────────────────────────────────────

function SilenceBadge({ lastGiftAt }: { lastGiftAt: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(lastGiftAt ? Math.floor((Date.now() - lastGiftAt) / 1000) : 0);
    }, 1000);
    return () => clearInterval(iv);
  }, [lastGiftAt]);

  if (!lastGiftAt || elapsed < 30) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = mins > 0 ? `${mins}m ${secs}s ago` : `${secs}s ago`;

  return (
    <motion.div
      className={styles.silenceBadge}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Last gift: {label} — be the next! ✨
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardDisplayPage({ event }: { event: IEvent }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);
  const streakRef = useRef<Record<string, { count: number; lastAt: number }>>(
    {},
  );

  const { leaderboard, stats } = useGiftRoom(token, event.id);

  // ── Safe values ───────────────────────────────────────────────────────────
  const safeLeaderboard: LeaderboardEntry[] = useMemo(
    () => (Array.isArray(leaderboard) ? leaderboard : []),
    [leaderboard],
  );

  const max = safeLeaderboard[0]?.score || 1;

  const eventTitle = stats?.eventTitle || event.title?.toUpperCase() || "";
  const eventSub = event.description || "";
  const eventEmoji = stats?.eventEmoji || "🎁";
  const slug = event.slug;

  const totalTokens = stats?.totalTokens ?? 0;
  const totalNaira = totalTokens * 10;
  const giftCount = stats?.totalGifts ?? 0;
  const guestCount = stats?.guestCount ?? 0;

  // ── Rank-change tracking ──────────────────────────────────────────────────
  const prevRanksRef = useRef<Record<string, number>>({});
  const prevLeaderRef = useRef<LeaderboardEntry[]>([]);
  const seenUsersRef = useRef<Set<string>>(new Set());

  // ── Toast queue ───────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const addToast = useCallback((t: Omit<ToastData, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      4500,
    );
  }, []);

  // ── Confetti (fires when #1 changes) ─────────────────────────────────────
  const [confetti, setConfetti] = useState(false);
  const prevFirst = useRef<string | null>(null);

  // ── Last gift timestamp ───────────────────────────────────────────────────
  const [lastGiftAt, setLastGiftAt] = useState<number | null>(null);

  // ── New-user set (first appearance) ──────────────────────────────────────
  const [newUsers, setNewUsers] = useState<Set<string>>(new Set());

  // ── Effect: diff leaderboard on every update ──────────────────────────────
  useEffect(() => {
    if (safeLeaderboard.length === 0) return;

    const prevRanks = prevRanksRef.current;
    const prevLeader = prevLeaderRef.current;

    // Detect new users (first appearance)
    const freshUsers = new Set<string>();
    safeLeaderboard.forEach((e) => {
      if (!seenUsersRef.current.has(e.userId)) {
        seenUsersRef.current.add(e.userId);
        if (prevLeader.length > 0) freshUsers.add(e.userId); // skip initial load
      }
    });
    if (freshUsers.size > 0) setNewUsers(freshUsers);

    // Detect token increases → toast + last-gift timestamp
    safeLeaderboard.forEach((entry) => {
      const prev = prevLeader.find((p) => p.userId === entry.userId);
      const gained = prev ? entry.score - prev.score : 0;

      if (gained > 0) {
        setLastGiftAt(Date.now());
        const movedUp =
          prevRanks[entry.userId] != null &&
          entry.rank < prevRanks[entry.userId];

        const now = Date.now();

        const prevStreak = streakRef.current[entry.userId];

        const withinWindow = prevStreak && now - prevStreak.lastAt < 8000;

        const newCount =
          gained > 0
            ? withinWindow
              ? prevStreak.count + 1
              : 1
            : (prevStreak?.count ?? 0);

        streakRef.current[entry.userId] = {
          count: newCount,
          lastAt: gained > 0 ? now : (prevStreak?.lastAt ?? now),
        };

        entry.streak = newCount;

        addToast({
          who: entry.displayName,
          what: movedUp
            ? `🔥 jumped to #${entry.rank}!`
            : `sent a gift · now #${entry.rank}`,
          tokens: gained,
          emoji: eventEmoji,
        });
      }

      // Overtake: someone dropped from a higher rank
      if (prev && entry.rank < (prevRanks[entry.userId] ?? entry.rank)) {
        const displaced = prevLeader.find(
          (p) => p.rank === entry.rank && p.userId !== entry.userId,
        );
        if (displaced) {
          addToast({
            who: `${entry.displayName} overtook ${displaced.displayName}`,
            what: `Now sitting at #${entry.rank} 👀`,
            tokens: 0,
            emoji: "⚡",
          });
        }
      }
    });

    // Confetti when #1 changes hands
    const currentFirst = safeLeaderboard[0]?.userId ?? null;
    if (
      prevFirst.current &&
      currentFirst &&
      currentFirst !== prevFirst.current
    ) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 100); // re-trigger
    }
    prevFirst.current = currentFirst;

    // Save snapshot
    const nextRanks: Record<string, number> = {};
    safeLeaderboard.forEach((e) => {
      nextRanks[e.userId] = e.rank;
    });
    prevRanksRef.current = nextRanks;
    prevLeaderRef.current = safeLeaderboard;

    // Clear new-user flags after animation window
    if (freshUsers.size > 0) {
      setTimeout(() => setNewUsers(new Set()), 2000);
    }
  }, [safeLeaderboard, addToast, eventEmoji]);

  return (
    <main className={styles.display}>
      <Confetti active={confetti} />

      <div className={styles.orb1} />
      <div className={styles.orb2} />

      {/* ── Header ── */}
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className={styles.headerLeft}>
          <p className={styles.eventLabel}>Gift room · live</p>
          <h1 className={styles.eventTitle}>
            {eventEmoji && <span aria-hidden="true">{eventEmoji}</span>}{" "}
            {eventTitle}
          </h1>
          {eventSub && <p className={styles.eventSub}>{eventSub}</p>}
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <LiveDot />
            LIVE
          </div>
          <p className={styles.headerMeta}>
            Gifts: {giftCount} · Guests: {guestCount}
          </p>
        </div>
      </motion.header>

      {/* ── Stats ── */}
      <motion.div
        className={styles.stats}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
      >
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.statGold}`}>
            <AnimatedCount value={totalTokens} />
          </span>
          <span className={styles.statLbl}>Tokens gifted</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statVal}>
            ₦<AnimatedCount value={totalNaira} />
          </span>
          <span className={styles.statLbl}>Total value</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statVal}>
            <AnimatedCount value={giftCount} />
          </span>
          <span className={styles.statLbl}>Gifts sent</span>
        </div>
      </motion.div>

      {/* ── Silence badge ── */}
      <SilenceBadge lastGiftAt={lastGiftAt} />

      {/* ── Leaderboard ── */}
      <section className={styles.leaderboard} aria-label="Live leaderboard">
        {safeLeaderboard.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className={styles.emptyText}>Waiting for first gift…</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {safeLeaderboard.map((entry, i) => (
              <LbRow
                key={entry.userId}
                entry={entry}
                max={max}
                nextTokens={safeLeaderboard[i - 1]?.score}
                isNew={newUsers.has(entry.userId)}
              />
            ))}
          </AnimatePresence>
        )}
      </section>

      {/* ── Toast stack ── */}
      <div className={styles.toastStack} aria-live="polite" aria-atomic="false">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className={styles.footerLeft}>
          <div className={styles.qrBox}>
            <div className={styles.qrInner} />
          </div>
          <p className={styles.footerJoin}>
            Scan to join the gift room
            <br />
            <strong>
              {process.env.NEXT_PUBLIC_APP_URL}/join/{slug}
            </strong>
          </p>
        </div>
        <p className={styles.footerBrand}>Serenade</p>
      </motion.footer>
    </main>
  );
}
