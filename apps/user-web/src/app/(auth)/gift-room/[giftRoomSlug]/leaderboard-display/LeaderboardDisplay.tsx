"use client";

import { SocketEvents } from "@app/socket-events";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useEvent } from "../../event.context";
import styles from "./LeaderboardDisplay.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  tokens: number;
  giftCount: number;
  lastGift: string;
}

interface LatestGift {
  displayName: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  newRank: number;
}

interface RoomSnapshot {
  leaderboard: LeaderboardEntry[];
  eventTokenBalance: number;
  eventNairaBalance: number;
  giftCount: number;
  guestCount: number;
  eventTitle: string;
  eventSubtitle: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLOURS = [
  "#C9A84C",
  "#7B6CE0",
  "#E07BA0",
  "#6ED88A",
  "#EF9F27",
  "#E87070",
];

function avatarColour(userId: string): string {
  const sum = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLOURS[sum % AVATAR_COLOURS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveDot() {
  return <span className={styles.liveDot} aria-hidden="true" />;
}

function LbRow({ entry, max }: { entry: LeaderboardEntry; max: number }) {
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

  return (
    <div className={`${styles.lbRow} ${rankCls}`}>
      <div
        className={styles.lbBar}
        style={{ width: `${pct}%`, background: colour }}
        aria-hidden="true"
      />
      <div className={styles.lbRank}>{entry.rank}</div>
      <div
        className={styles.lbAvatar}
        style={{ background: `${colour}22`, color: colour }}
        aria-hidden="true"
      >
        {initials(entry.displayName)}
      </div>
      <div className={styles.lbInfo}>
        <p className={styles.lbName}>{entry.displayName}</p>
        <p className={styles.lbSub}>
          {entry.giftCount} gift{entry.giftCount !== 1 ? "s" : ""}
          &nbsp;·&nbsp; last: {entry.lastGift}
        </p>
      </div>
      <div className={styles.lbRight}>
        <span className={styles.lbScore}>
          {entry.tokens.toLocaleString()} tkn
        </span>
        <span className={styles.lbNaira}>
          ≈ ₦{(entry.tokens * 10).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardDisplayPage() {
  const { slug: eventId } = useEvent();

  const [snapshot, setSnapshot] = useState<RoomSnapshot>({
    leaderboard: [],
    eventTokenBalance: 0,
    eventNairaBalance: 0,
    giftCount: 0,
    guestCount: 0,
    eventTitle: "Loading…",
    eventSubtitle: "",
    slug: "",
  });

  const [latestGift, setLatestGift] = useState<LatestGift | null>(null);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Display screen uses a read-only token — no auth required for display role
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/gift-room`, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit(SocketEvents.roomJoin, {
        eventId: `gift-room:${eventId}`,
        role: "display",
      });
    });

    // Initial state when joining
    socket.on(
      SocketEvents.leaderboardSnapshot,
      (data: {
        leaderboard: LeaderboardEntry[];
        totalTokens: number;
        eventTitle?: string;
        eventSubtitle?: string;
        slug?: string;
      }) => {
        setSnapshot((prev) => ({
          ...prev,
          leaderboard: data.leaderboard,
          eventTokenBalance: data.totalTokens,
          eventNairaBalance: data.totalTokens * 10,
          eventTitle: data.eventTitle ?? prev.eventTitle,
          eventSubtitle: data.eventSubtitle ?? prev.eventSubtitle,
          slug: data.slug ?? prev.slug,
        }));
      },
    );

    // Every gift push
    socket.on(
      SocketEvents.leaderboardUpdate,
      (data: {
        leaderboard: LeaderboardEntry[];
        eventTokenBalance: number;
        eventNairaBalance: number;
        giftCount?: number;
        latestGift: LatestGift;
      }) => {
        setSnapshot((prev) => ({
          ...prev,
          leaderboard: data.leaderboard,
          eventTokenBalance: data.eventTokenBalance,
          eventNairaBalance: data.eventNairaBalance,
          giftCount: data.giftCount ?? prev.giftCount,
        }));
        setLatestGift(data.latestGift);
        // Clear toast after 4s
        setTimeout(() => setLatestGift(null), 4000);
      },
    );

    return () => {
      socket.emit(SocketEvents.roomLeave, { eventId });
      socket.disconnect();
    };
  }, [eventId]);

  const {
    leaderboard,
    eventTokenBalance,
    eventNairaBalance,
    giftCount,
    guestCount,
    eventTitle,
    eventSubtitle,
    slug,
  } = snapshot;

  const max = leaderboard[0]?.tokens || 1;

  return (
    <main className={styles.display}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eventLabel}>Gift room · live</p>
          <h1 className={styles.eventTitle}>{eventTitle}</h1>
          {eventSubtitle && <p className={styles.eventSub}>{eventSubtitle}</p>}
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <LiveDot />
            LIVE
          </div>
          <p className={styles.headerMeta}>
            Gifts: {giftCount}&nbsp;·&nbsp;Guests: {guestCount}
          </p>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className={styles.stats} role="region" aria-label="Event statistics">
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.statGold}`}>
            {eventTokenBalance.toLocaleString()}
          </span>
          <span className={styles.statLbl}>Tokens gifted</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>
            ₦{Number(eventNairaBalance).toLocaleString()}
          </span>
          <span className={styles.statLbl}>Total value</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{giftCount}</span>
          <span className={styles.statLbl}>Gifts sent</span>
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <section className={styles.leaderboard} aria-label="Live leaderboard">
        {leaderboard.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Waiting for the first gift…</p>
          </div>
        ) : (
          leaderboard.map((entry) => (
            <LbRow key={entry.userId} entry={entry} max={max} />
          ))
        )}
      </section>

      {/* ── Latest gift toast ── */}
      {latestGift && (
        <div className={styles.toast} role="status" aria-live="polite">
          <span className={styles.toastEmoji} aria-hidden="true">
            {latestGift.giftEmoji}
          </span>
          <div className={styles.toastText}>
            <p className={styles.toastWho}>
              {latestGift.displayName} just sent a {latestGift.giftName}
            </p>
            <p className={styles.toastWhat}>
              now ranked{" "}
              <strong className={styles.toastRank}>
                #{latestGift.newRank}
              </strong>{" "}
              on the leaderboard
            </p>
          </div>
          <span className={styles.toastTokens}>
            +{latestGift.tokens.toLocaleString()} tkn
          </span>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.qrBox}>
            <div className={styles.qrInner} />
          </div>
          <p className={styles.footerJoin}>
            Scan to join the gift room
            <br />
            <strong>
              {process.env.NEXT_PUBLIC_APP_URL}/join?code={slug}
            </strong>
          </p>
        </div>
        <p className={styles.footerBrand}>Serenade</p>
      </footer>
    </main>
  );
}
