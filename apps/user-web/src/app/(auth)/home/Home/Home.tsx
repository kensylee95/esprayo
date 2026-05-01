"use client";

import { useRouter } from "next/navigation";
import styles from "./Home.module.scss";

interface QuickAction {
  icon: string;
  label: string;
  sub: string;
  href: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "🎁",
    label: "Join event",
    sub: "Enter code or scan QR",
    href: "/join",
  },
  {
    icon: "✨",
    label: "Create event",
    sub: "Host a gift room",
    href: "/event/create/step-1",
  },
  { icon: "💸", label: "Fund wallet", sub: "Buy tokens", href: "/wallet/fund" },
  { icon: "📊", label: "My events", sub: "View & manage", href: "/event/view" },
];

interface RecentEvent {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  status: "live" | "draft" | "ended";
}

// In production, fetch from GET /events/mine
const RECENT_EVENTS: RecentEvent[] = [
  {
    id: "1",
    emoji: "💍",
    title: "Adaeze & Chidi's Wedding",
    sub: "Active · 47 guests · 18,420 tkn",
    status: "live",
  },
  {
    id: "2",
    emoji: "🎂",
    title: "Emeka's 40th Birthday",
    sub: "Draft · starts Apr 30",
    status: "draft",
  },
];

function StatusBadge({ status }: { status: RecentEvent["status"] }) {
  if (status === "live") {
    return (
      <span className={`${styles.badge} ${styles.badgeLive}`}>● LIVE</span>
    );
  }
  if (status === "draft") {
    return (
      <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>
    );
  }
  return <span className={`${styles.badge} ${styles.badgeEnded}`}>Ended</span>;
}

export default function HomePage() {
  const router = useRouter();

  // In production: fetch from useAuth() hook
  const user = { initials: "CO", tokenBalance: 1250 };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <span className={styles.logo}>Serenade</span>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => router.push("/profile")}
            aria-label="Go to profile"
          >
            {user.initials}
          </button>
        </header>

        {/* ── Balance card ── */}
        <div
          className={styles.balanceCard}
          onClick={() => router.push("/wallet")}
          role="button"
          tabIndex={0}
          aria-label="Wallet balance, tap to fund"
          onKeyDown={(e) => e.key === "Enter" && router.push("/wallet")}
        >
          <div className={styles.balOrb} aria-hidden="true" />
          <p className={styles.balLabel}>Token balance</p>
          <p className={styles.balValue}>
            {user.tokenBalance.toLocaleString()}
          </p>
          <p className={styles.balSub}>
            ≈ ₦{(user.tokenBalance * 10).toLocaleString()} · tap to fund
          </p>
        </div>

        {/* ── Quick actions ── */}
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map(({ icon, label, sub, href }) => (
            <button
              type="button"
              key={href}
              className={styles.quickAction}
              onClick={() => router.push(href)}
            >
              <span className={styles.qaIcon} aria-hidden="true">
                {icon}
              </span>
              <span className={styles.qaLabel}>{label}</span>
              <span className={styles.qaSub}>{sub}</span>
            </button>
          ))}
        </div>

        {/* ── Recent events ── */}
        {RECENT_EVENTS.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Recent</p>
            <ul className={styles.eventList}>
              {RECENT_EVENTS.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={styles.eventCard}
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    <div className={styles.ecIcon} aria-hidden="true">
                      {event.emoji}
                    </div>
                    <div className={styles.ecInfo}>
                      <p className={styles.ecTitle}>{event.title}</p>
                      <p className={styles.ecSub}>{event.sub}</p>
                    </div>
                    <StatusBadge status={event.status} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
