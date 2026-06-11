"use client";

/**
 * RoomDisplay — Serenade Spray Room (20-metre Edition)
 *
 * Drop-in replacement for CelebrationDisplay / LeaderboardDisplayPage.
 * Same props: { event: IEvent }
 * Same hook:  useLeaderBoardDisplay(token, event.id)
 *
 * Design: full-bleed dark luxury. Readable at 20 m on a 1080p+ TV.
 *
 * Layout (single full-screen column):
 *   ┌──────────────────────────────────────────────────────┐
 *   │  [LIVE]   Event title          ₦total  gifts  guests │  ← top bar
 *   ├──────────────────────────────────────────────────────┤
 *   │                                                      │
 *   │   Celebrant portrait  (center, large)                │
 *   │   "In celebration of"                                │
 *   │   EVENT TITLE (giant)                                │
 *   │                                                      │
 *   ├──────────────────────────────────────────────────────┤
 *   │   #1  Name ·············· ₦XXX,XXX  (dominant row)  │
 *   │   #2  Name ·············· ₦XXX,XXX                  │
 *   │   #3  Name ·············· ₦XXX,XXX                  │
 *   ├──────────────────────────────────────────────────────┤
 *   │   ← ticker feed of live activity →                  │  ← bottom
 *   └──────────────────────────────────────────────────────┘
 *
 * Typography scale (all in vw so they scale with screen size):
 *   Event title hero:  7vw  (~134px on 1920px wide)
 *   #1 leaderboard:    5vw  (~96px)
 *   #2–3:              3.5vw (~67px)
 *   Stat values:       3vw  (~58px)
 *   Ticker:            2vw  (~38px)
 *
 * All external deps already in project:
 *   framer-motion, react (hooks)
 *   @/helpers/getters (avatarColour, initials)
 *   @/hooks/useLeaderboardDisplay
 *   @/helpers/request (getTokenClient)
 *   @/services/Event/Event.dto (IEvent)
 */

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { avatarColour, initials } from "@/helpers/getters";
import { getTokenClient } from "@/helpers/request";
import { useLeaderBoardDisplay } from "@/hooks/useLeaderboardDisplay";
import type { IEvent } from "@/services/Event/Event.dto";
import { BronzeBadgeIcon } from "../lottie-icons/BronzeBadgeIcon/BronzeBadgeIcon";
import { CrownBadge } from "../lottie-icons/CrownBadge/CrownBadge";
import { GoldBurstIcon } from "../lottie-icons/GoldBurst/GoldBurst";
import { SilverBadgeIcon } from "../lottie-icons/SilverBadgeIcon/SilverBadge";
import type { LeaderboardEntry } from "./leaderboard.dto";

/* ─── Design tokens ──────────────────────────────────────────────────────── */

const T = {
  void: "#07070C",
  surface1: "#0F0E18",
  surface2: "#181624",
  surface3: "#231F35",
  gold: "#C9A84C",
  goldLight: "#F0D472",
  goldDim: "#6A501A",
  goldFaint: "#1E1608",
  text1: "#F5F2EC",
  text2: "#8A8498",
  text3: "#3E3A50",
  success: "#4DBF72",
  violet: "#6B5CE7",
} as const;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return n.toLocaleString("en-NG");
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/* ─── Animated number ────────────────────────────────────────────────────── */

function AnimatedCount({ value, short }: { value: number; short?: boolean }) {
  const [display, setDisplay] = useState(value);
  const controls = useAnimationControls();
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    setDisplay(value);
    controls.start({
      y: ["-30%", "0%"],
      opacity: [0, 1],
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    });
    prev.current = value;
  }, [value, controls]);

  return (
    <motion.span animate={controls} style={{ display: "inline-block" }}>
      {short ? fmtShort(display) : display.toLocaleString()}
    </motion.span>
  );
}

/* ─── Live dot ───────────────────────────────────────────────────────────── */

function LiveDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.6vw",
        height: "0.6vw",
        minWidth: 8,
        minHeight: 8,
        borderRadius: "50%",
        background: T.success,
        animation: "rd-pulse 1.4s ease infinite",
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Cash particles ─────────────────────────────────────────────────────── */

interface CashParticle {
  id: number;
  x: number;
  delay: number;
  size: number;
  symbol: string;
  duration: number;
}

const CASH_SYM = ["₦", "₦", "₦", "₦", "💵", "💰"];

function useCashParticles(intensity: number) {
  const [particles, setParticles] = useState<CashParticle[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const burst = useCallback((count: number) => {
    const ps: CashParticle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.5,
      size: 28 + Math.random() * 28,
      symbol: CASH_SYM[Math.floor(Math.random() * CASH_SYM.length)],
      duration: 2.4 + Math.random() * 1.2,
    }));
    setParticles((p) => [...p.slice(-80), ...ps]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParticles([]), 5000);
  }, []);

  useEffect(() => {
    if (intensity > 0) burst(Math.min(6 + intensity * 4, 40));
  }, [intensity, burst]);

  return particles;
}

function CashRain({ particles }: { particles: CashParticle[] }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 20,
      }}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -40,
            fontSize: p.size,
            userSelect: "none",
            willChange: "transform, opacity",
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0.4, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        >
          {p.symbol}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── Confetti ───────────────────────────────────────────────────────────── */

interface ConfPiece {
  id: number;
  x: number;
  delay: number;
  colour: string;
  rotate: number;
}
const CONF_COLS = [T.goldLight, "#E07BA0", "#7B6CE0", "#4FCEDB", T.success];

function Confetti({ active }: { active: boolean }) {
  const [ps, setPs] = useState<ConfPiece[]>([]);

  useEffect(() => {
    if (!active) return;
    const arr: ConfPiece[] = Array.from({ length: 80 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      colour: CONF_COLS[i % CONF_COLS.length],
      rotate: Math.random() * 360,
    }));
    setPs(arr);
    const t = setTimeout(() => setPs([]), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!ps.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 300,
        overflow: "hidden",
      }}
    >
      {ps.map((p) => (
        <motion.span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: "clamp(8px,0.8vw,16px)",
            height: "clamp(18px,1.8vw,36px)",
            borderRadius: 3,
            background: p.colour,
            rotate: p.rotate,
          }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate + 540 }}
          transition={{ duration: 3.5, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/* ─── Glory moment overlay ───────────────────────────────────────────────── */

interface GloryData {
  displayName: string;
  amount: number;
  rank: number;
  colour: string;
}

function GloryMoment({
  glory,
  onDone,
}: {
  glory: GloryData | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!glory) return;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [glory, onDone]);

  return (
    <AnimatePresence>
      {glory && (
        <motion.div
          key={glory.displayName + glory.amount}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(7,7,12,.92)",
            pointerEvents: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Gold ring */}
          <motion.div
            style={{
              width: "clamp(160px,18vw,280px)",
              height: "clamp(160px,18vw,280px)",
              borderRadius: "50%",
              border: `2px solid ${T.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "3vw",
              boxShadow: `0 0 60px 0 ${T.gold}40`,
            }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{ fontSize: "clamp(60px,8vw,120px)", lineHeight: 1 }}>
              {glory.rank === 1 ? (
                <CrownBadge size="clamp(160px,18vw,280px)" />
              ) : (
                <GoldBurstIcon size="clamp(160px,18vw,280px)" />
              )}
            </span>
          </motion.div>

          <motion.p
            style={{
              fontFamily:
                '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontSize: "clamp(3.5rem,8vw,10rem)",
              fontWeight: 700,
              color: glory.colour,
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            {glory.displayName}
          </motion.p>

          <motion.p
            style={{
              fontFamily: '"DM Mono", "Fira Mono", monospace',
              fontSize: "clamp(1.2rem,3vw,3.5rem)",
              color: T.goldLight,
              marginTop: "1.5vw",
              letterSpacing: "0.08em",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          >
            SPRAYED ₦{fmt(glory.amount)}
          </motion.p>

          {glory.rank === 1 && (
            <motion.p
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: "clamp(0.8rem,1.5vw,1.8rem)",
                color: T.text2,
                marginTop: "1vw",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Leading the room
            </motion.p>
          )}

          {/* Ornamental lines */}
          <motion.div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2vw",
              marginTop: "3vw",
              opacity: 0.4,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.4, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div style={{ width: "8vw", height: "1px", background: T.gold }} />
            <div
              style={{
                width: "0.4vw",
                height: "0.4vw",
                borderRadius: "50%",
                background: T.gold,
              }}
            />
            <div style={{ width: "8vw", height: "1px", background: T.gold }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Top-3 leaderboard row ──────────────────────────────────────────────── */

const RANK_SIZE = ["5vw", "3.5vw", "3.5vw"];
const RANK_SCORE = ["4.5vw", "3.2vw", "3.2vw"];
const RANK_ALPHA = ["FF", "CC", "99"];
function RankIcon({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return <CrownBadge />;

    case 2:
      return <SilverBadgeIcon />;

    case 3:
      return <BronzeBadgeIcon />;

    default:
      return null;
  }
}

interface PodiumRowProps {
  entry: LeaderboardEntry;
  totalScore: number;
}

function PodiumRow({ entry, totalScore }: PodiumRowProps) {
  const idx = Math.min(entry.rank - 1, 2);
  const colour = avatarColour(entry.userId);
  const pct = totalScore > 0 ? (entry.score / totalScore) * 100 : 0;
  const isFirst = entry.rank === 1;

  const prev = useRef(entry.score);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (entry.score > prev.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1800);
      prev.current = entry.score;
      return () => clearTimeout(t);
    }
    prev.current = entry.score;
  }, [entry.score]);

  return (
    <motion.div
      layout
      layoutId={entry.userId}
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "3vw",
        padding: isFirst ? "2.4vw 3vw" : "1.6vw 3vw",
        overflow: "hidden",
        borderTop: `1px solid ${T.surface3}`,
      }}
    >
      {/* Progress bar fill (subtle) */}
      <motion.div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          background: flash
            ? `linear-gradient(90deg, ${T.goldFaint}, ${colour}18)`
            : `linear-gradient(90deg, ${colour}12, transparent)`,
          transition: "background 0.8s ease",
          pointerEvents: "none",
          borderRight: flash ? `2px solid ${T.gold}60` : "none",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Gold left accent for #1 */}
      {isFirst && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: T.gold,
            opacity: 0.8,
          }}
        />
      )}

      {/* Rank */}
      <div
        style={{
          width: "3.5vw",
          minWidth: 40,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <RankIcon rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div
        style={{
          width: isFirst ? "5vw" : "3.8vw",
          height: isFirst ? "5vw" : "3.8vw",
          minWidth: isFirst ? 56 : 44,
          minHeight: isFirst ? 56 : 44,
          borderRadius: "50%",
          background: `${colour}22`,
          color: colour,
          border: `1.5px solid ${colour}${RANK_ALPHA[idx]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"DM Mono", monospace',
          fontSize: isFirst
            ? "clamp(14px,1.5vw,24px)"
            : "clamp(12px,1.1vw,20px)",
          fontWeight: 600,
          flexShrink: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {initials(entry.displayName)}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily:
              '"Cormorant Garamond", "Playfair Display", Georgia, serif',
            fontSize: RANK_SIZE[idx],
            fontWeight: isFirst ? 700 : 600,
            color: isFirst ? T.text1 : `${T.text1}CC`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.1,
            letterSpacing: isFirst ? "-0.02em" : "-0.01em",
          }}
        >
          {entry.displayName}
        </p>
        <p
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "clamp(10px,1vw,18px)",
            color: T.text3,
            marginTop: "0.4vw",
            letterSpacing: "0.06em",
          }}
        >
          {entry.giftCount} SPRAY{entry.giftCount !== 1 ? "S" : ""}
        </p>
      </div>

      {/* Score */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p
          style={{
            fontFamily: '"DM Mono", "Fira Mono", monospace',
            fontSize: RANK_SCORE[idx],
            color: isFirst ? T.goldLight : T.gold,
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          ₦<AnimatedCount value={entry.score} />
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Silence nudge ──────────────────────────────────────────────────────── */

function SilenceNudge({ lastAt }: { lastAt: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(lastAt ? Math.floor((Date.now() - lastAt) / 1000) : 0);
    }, 1000);
    return () => clearInterval(iv);
  }, [lastAt]);

  if (!lastAt || elapsed < 45) return null;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, repeat: Infinity }}
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: "clamp(12px,1.2vw,20px)",
        color: T.gold,
        letterSpacing: "0.12em",
        textAlign: "center",
      }}
    >
      Last spray {label} ago — who's next? ✦
    </motion.p>
  );
}

/* ─── Ticker feed ────────────────────────────────────────────────────────── */

interface FeedItem {
  id: string;
  text: string;
  emoji: string;
  at: number;
}

function Ticker({ items }: { items: FeedItem[] }) {
  if (!items.length) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(20px,3vw,50px)",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.slice(0, 4).map((item, i) => (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: i === 0 ? 1 : 0.5 - i * 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "clamp(12px,1.3vw,22px)",
              color: i === 0 ? T.text1 : T.text2,
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {item.emoji} {item.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

const GLORY_THRESHOLD = 5000;
const MAX_FEED = 8;

export default function RoomDisplay({ event }: { event: IEvent }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);

  const { leaderboard, stats, liveAlert } = useLeaderBoardDisplay(
    token,
    event.id,
  );

  const safeBoard: LeaderboardEntry[] = useMemo(
    () => (Array.isArray(leaderboard) ? leaderboard.slice(0, 3) : []),
    [leaderboard],
  );

  const totalNaira = stats?.totalGifts ?? 0;
  const giftCount = stats?.totalGifts ?? 0;
  const guestCount = stats?.guestCount ?? 0;
  const slug = event.slug;

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [cashIntensity, setCash] = useState(0);
  const cashParticles = useCashParticles(cashIntensity);
  const [glory, setGlory] = useState<GloryData | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [lastGiftAt, setLastGiftAt] = useState<number | null>(null);
  const prevBoardRef = useRef<LeaderboardEntry[]>([]);
  const prevFirst = useRef<string | null>(null);

  const topScore = safeBoard[0]?.score ?? 1;

  const addFeed = useCallback((emoji: string, text: string) => {
    setFeed((f) =>
      [
        { id: `${Date.now()}-${Math.random()}`, text, emoji, at: Date.now() },
        ...f,
      ].slice(0, MAX_FEED),
    );
  }, []);

  useEffect(() => {
    if (!safeBoard.length) return;
    const prev = prevBoardRef.current;

    safeBoard.forEach((entry) => {
      const prevEntry = prev.find((p) => p.userId === entry.userId);
      const gained = prevEntry ? entry.score - prevEntry.score : 0;

      if (gained > 0) {
        setLastGiftAt(Date.now());
        setCash(Math.min(1 + Math.floor(gained / 1000), 10));
        setTimeout(() => setCash(0), 120);

        const moved = prevEntry && entry.rank < (prevEntry.rank ?? 99);
        addFeed(
          "",
          `${entry.displayName} sprayed ₦${fmt(gained)}${moved ? ` · up to #${entry.rank}` : ""}`,
        );

        if (gained >= GLORY_THRESHOLD) {
          setGlory({
            displayName: entry.displayName,
            amount: gained,
            rank: entry.rank,
            colour: avatarColour(entry.userId),
          });
        }
      }
    });

    const currentFirst = safeBoard[0]?.userId ?? null;
    if (
      prevFirst.current &&
      currentFirst &&
      currentFirst !== prevFirst.current
    ) {
      setConfetti(true);
      addFeed("👑", `${safeBoard[0].displayName} takes the top spot!`);
      setTimeout(() => setConfetti(false), 120);
    }
    prevFirst.current = currentFirst;
    prevBoardRef.current = safeBoard;
  }, [safeBoard, addFeed]);

  const prevAlert = useRef<string | null>(null);
  useEffect(() => {
    if (liveAlert && liveAlert !== prevAlert.current) {
      prevAlert.current = liveAlert;
    }
  }, [liveAlert]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes rd-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.65)} }
        @keyframes rd-breathe { 0%,100%{opacity:.06} 50%{opacity:.12} }
        @keyframes rd-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <Confetti active={confetti} />
      <GloryMoment glory={glory} onDone={() => setGlory(null)} />

      <main
        style={{
          minHeight: "100dvh",
          background: T.void,
          display: "grid",
          gridTemplateRows: "auto 1fr auto auto",
          position: "relative",
          overflow: "hidden",
          fontFamily: '"DM Mono", monospace',
        }}
      >
        {/* ── Ambient: golden radial orb top-right ── */}
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            width: "50vw",
            height: "50vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${T.gold}07 0%, transparent 60%)`,
            top: "-15%",
            right: "-10%",
            animation: "rd-breathe 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            width: "30vw",
            height: "30vw",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${T.violet}06 0%, transparent 65%)`,
            bottom: "10%",
            left: "-8%",
          }}
        />

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "clamp(16px,1.8vw,32px) clamp(24px,3vw,56px)",
            borderBottom: `1px solid ${T.surface3}`,
            zIndex: 10,
            position: "relative",
            gap: "2vw",
          }}
        >
          {/* Left: Live + event name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(14px,1.5vw,24px)",
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.7vw",
                background: "#0E1F0E",
                border: `1px solid ${T.success}30`,
                borderRadius: 100,
                padding: "clamp(6px,.6vw,10px) clamp(14px,1.4vw,22px)",
                flexShrink: 0,
              }}
            >
              <LiveDot />
              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "clamp(11px,1vw,16px)",
                  color: T.success,
                  letterSpacing: "0.15em",
                }}
              >
                LIVE
              </span>
            </div>

            <p
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: "clamp(1.4rem,2.4vw,3rem)",
                fontWeight: 600,
                color: T.text1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1,
              }}
            >
              {event.title}
            </p>

            {event.description && (
              <p
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: "italic",
                  fontSize: "clamp(0.9rem,1.2vw,1.5rem)",
                  color: T.gold,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {event.description}
              </p>
            )}
          </div>

          {/* Right: Stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(12px,1.5vw,24px)",
              flexShrink: 0,
            }}
          >
            {[
              {
                label: "TOTAL SPRAYED",
                value: totalNaira,
                prefix: "₦",
                short: true,
              },
              { label: "SPRAYS", value: giftCount, short: false },
              { label: "GUESTS", value: guestCount, short: false },
            ].map(({ label, value, prefix, short }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "clamp(8px,.8vw,14px) clamp(14px,1.6vw,26px)",
                  background: T.surface1,
                  border: `1px solid ${T.surface3}`,
                  borderRadius: 12,
                }}
              >
                <p
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "clamp(1rem,2.2vw,2.8rem)",
                    color: T.goldLight,
                    fontWeight: 500,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {prefix}
                  <AnimatedCount value={value} short={short} />
                </p>
                <p
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "clamp(9px,.8vw,12px)",
                    color: T.text3,
                    letterSpacing: "0.15em",
                    marginTop: "0.5vw",
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.header>

        {/* ── HERO CANVAS ── */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3vw",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <CashRain particles={cashParticles} />

          {/* Cover image backdrop (blurred) */}
          {event.coverImageUrl && (
            <>
              <Image
                src={event.coverImageUrl}
                alt=""
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.08,
                  filter: "blur(40px) saturate(1.4)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(ellipse at center, transparent 10%, ${T.void}E0 70%)`,
                  pointerEvents: "none",
                }}
              />
            </>
          )}

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: "clamp(100px,12vw,180px)",
              height: "clamp(100px,12vw,180px)",
              borderRadius: "50%",
              overflow: "hidden",
              border: `2px solid ${T.gold}70`,
              boxShadow: `0 0 0 1px ${T.gold}20, 0 0 48px 0 ${T.gold}18`,
              flexShrink: 0,
              zIndex: 2,
              position: "relative",
              marginBottom: "2vw",
            }}
          >
            {event.coverImageUrl ? (
              <Image
                src={event.coverImageUrl}
                alt={event.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg, ${T.goldDim}, ${T.surface3})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: "clamp(2rem,4vw,5rem)",
                  color: T.gold,
                }}
              >
                {event.title.charAt(0)}
              </div>
            )}
          </motion.div>

          {/* Ornamental rule */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5vw",
              marginBottom: "1.4vw",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "6vw",
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${T.gold}80)`,
              }}
            />
            <span
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: "italic",
                fontSize: "clamp(0.9rem,1.4vw,1.8rem)",
                color: T.gold,
                opacity: 0.7,
                letterSpacing: "0.12em",
              }}
            >
              In celebration of
            </span>
            <div
              style={{
                width: "6vw",
                height: "1px",
                background: `linear-gradient(90deg, ${T.gold}80, transparent)`,
              }}
            />
          </motion.div>

          {/* Event name — the giant hero text */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            style={{
              fontFamily:
                '"Cormorant Garamond", "Playfair Display", Georgia, serif',
              fontSize: "clamp(2.5rem,7vw,9rem)",
              fontWeight: 700,
              color: T.text1,
              textAlign: "center",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              position: "relative",
              zIndex: 2,
              maxWidth: "80vw",
            }}
          >
            {event.title}
          </motion.h1>

          {/* Silence nudge */}
          <div style={{ marginTop: "1.5vw", position: "relative", zIndex: 2 }}>
            <SilenceNudge lastAt={lastGiftAt} />
          </div>
        </div>

        {/* ── PODIUM (top 3) ── */}
        <div
          style={{
            borderTop: `1px solid ${T.surface3}`,
            position: "relative",
            zIndex: 5,
          }}
        >
          {safeBoard.length === 0 ? (
            <div style={{ padding: "3vw", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: "italic",
                  fontSize: "clamp(1.2rem,2.5vw,3rem)",
                  color: T.text3,
                }}
              >
                Waiting for the first spray…
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {safeBoard.map((entry) => (
                <PodiumRow
                  key={entry.userId}
                  entry={entry}
                  totalScore={topScore}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* ── BOTTOM TICKER ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(16px,2vw,36px)",
            padding: "clamp(12px,1.2vw,20px) clamp(24px,3vw,56px)",
            borderTop: `1px solid ${T.surface3}`,
            background: T.surface1,
            minHeight: "clamp(48px,5vw,80px)",
            position: "relative",
            zIndex: 10,
            overflow: "hidden",
          }}
        >
          {/* "Join" pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px,1vw,16px)",
              flexShrink: 0,
              borderRight: `1px solid ${T.surface3}`,
              paddingRight: "clamp(16px,2vw,32px)",
            }}
          >
            <div
              style={{
                width: "clamp(28px,2.5vw,44px)",
                height: "clamp(28px,2.5vw,44px)",
                background: T.text1,
                borderRadius: 6,
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  width: "80%",
                  height: "80%",
                  background: T.void,
                  borderRadius: 4,
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "clamp(9px,.8vw,13px)",
                  color: T.text3,
                  letterSpacing: "0.12em",
                }}
              >
                SCAN TO SPRAY
              </p>
              <p
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "clamp(10px,.9vw,14px)",
                  color: T.gold,
                  letterSpacing: "0.04em",
                }}
              >
                {process.env.NEXT_PUBLIC_APP_URL}/join/{slug}
              </p>
            </div>
          </div>

          <Ticker items={feed} />

          {/* Brand */}
          <p
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "clamp(1rem,1.8vw,2.2rem)",
              fontWeight: 700,
              color: T.gold,
              opacity: 0.25,
              flexShrink: 0,
              letterSpacing: "0.06em",
            }}
          >
            Serenade
          </p>
        </div>
      </main>
    </>
  );
}
