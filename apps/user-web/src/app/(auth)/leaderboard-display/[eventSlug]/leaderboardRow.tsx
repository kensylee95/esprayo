"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { avatarColour, initials } from "@/helpers/getters";
import styles from "./LeaderboardDisplay.module.scss";
import type { LeaderboardEntry } from "./leaderboard.dto";

// ── Animated count-up number ─────────────────────────────────────────────────
function CountUp({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);
  useEffect(
    () => spring.on("change", (v) => setDisplay(Math.round(v))),
    [spring],
  );

  return <span className={className}>{display.toLocaleString()}</span>;
}

// ── Rank medal ────────────────────────────────────────────────────────────────
function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className={styles.lbRankMedal}>👑</span>;
  if (rank === 2) return <span className={styles.lbRankMedal}>🥈</span>;
  if (rank === 3) return <span className={styles.lbRankMedal}>🥉</span>;
  return <span className={styles.lbRank}>{rank}</span>;
}

// ── Gap chip ─────────────────────────────────────────────────────────────────
function GapChip({ gap }: { gap: number }) {
  if (gap <= 0) return null;
  return (
    <span className={styles.lbGap}>↑ {gap.toLocaleString()} tkn to next</span>
  );
}

// ── Main row ─────────────────────────────────────────────────────────────────
interface LbRowProps {
  entry: LeaderboardEntry;
  max: number;
  nextTokens?: number; // tokens of the person ranked above
  isNew?: boolean; // first appearance this session
}

export default function LbRow({ entry, max, nextTokens, isNew }: LbRowProps) {
  const colour = avatarColour(entry.userId);
  const pct = Math.round((entry.tokens / max) * 100);

  const rankCls =
    entry.rank === 1
      ? styles.rank1
      : entry.rank === 2
        ? styles.rank2
        : entry.rank === 3
          ? styles.rank3
          : "";

  const gap =
    nextTokens != null && nextTokens > entry.tokens
      ? nextTokens - entry.tokens
      : 0;

  // Spotlight: flash gold border when tokens increase
  const prevTokens = useRef(entry.tokens);
  const [spotlight, setSpotlight] = useState(false);
  useEffect(() => {
    if (entry.tokens > prevTokens.current) {
      setSpotlight(true);
      const t = setTimeout(() => setSpotlight(false), 2000);
      prevTokens.current = entry.tokens;
      return () => clearTimeout(t);
    }
    prevTokens.current = entry.tokens;
  }, [entry.tokens]);

  const hasStreak = (entry.streak ?? 0) >= 3;

  return (
    <motion.div
      layout
      layoutId={`lb-row-${entry.userId}`}
      initial={isNew ? { opacity: 0, y: 32, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 380, damping: 36 }}
      className={`${styles.lbRow} ${rankCls} ${spotlight ? styles.spotlight : ""}`}
    >
      {/* Background bar */}
      <motion.div
        className={styles.lbBar}
        style={{ background: colour }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />

      {/* Rank */}
      <div className={styles.lbRankWrap}>
        <RankDisplay rank={entry.rank} />
      </div>

      {/* Avatar */}
      <motion.div
        className={styles.lbAvatar}
        style={{ background: `${colour}22`, color: colour }}
        whileHover={{ scale: 1.08 }}
        aria-hidden="true"
      >
        {initials(entry.displayName)}
      </motion.div>

      {/* Info */}
      <div className={styles.lbInfo}>
        <div className={styles.lbNameRow}>
          <p className={styles.lbName}>{entry.displayName}</p>
          {hasStreak && (
            <motion.span
              className={styles.streakBadge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              title={`${entry.streak} gifts in a row!`}
            >
              🔥×{entry.streak}
            </motion.span>
          )}
          {isNew && (
            <span className={styles.firstBadge} title="First gift!">
              ⚡
            </span>
          )}
        </div>
        <p className={styles.lbSub}>
          {entry.giftCount} gift{entry.giftCount !== 1 ? "s" : ""}
        </p>
        <GapChip gap={gap} />
      </div>

      {/* Score */}
      <div className={styles.lbRight}>
        <span className={styles.lbScore}>
          <CountUp value={entry.tokens} /> tkn
        </span>
        <span className={styles.lbNaira}>
          ≈ ₦<CountUp value={entry.tokens * 10} />
        </span>
      </div>
    </motion.div>
  );
}
