"use client";

import {
  LayoutGrid,
  LogOut,
  type LucideIcon,
  QrCode,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { deleteToken, getTokenClient } from "@/helpers/request";
import { useWallet } from "@/hooks/useWallets";
import eventService from "@/services/Event/Event";
import { EventStatus, type IEvent } from "@/services/Event/Event.dto";
import styles from "./Home.module.scss";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  sub: string;
  href: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: QrCode,
    label: "Join event",
    sub: "Enter code or scan QR",
    href: "/join",
    color: "#7C3AED", // violet
  },
  {
    icon: Sparkles,
    label: "Create event",
    sub: "Host a gift room",
    href: "/event/create/step-1",
    color: "#F59E0B", // gold
  },
  {
    icon: Wallet,
    label: "Fund wallet",
    sub: "Buy tokens",
    href: "/wallet/fund",
    color: "#10B981", // emerald
  },
  {
    icon: LayoutGrid,
    label: "My events",
    sub: "View & manage",
    href: "/event/view",
    color: "#EC4899", // pink
  },
];

function StatusBadge({ status }: { status: EventStatus }) {
  if (status === EventStatus.ACTIVE) {
    return (
      <span className={`${styles.badge} ${styles.badgeLive}`}>● LIVE</span>
    );
  }
  if (status === EventStatus.DRAFT) {
    return (
      <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>
    );
  }
  return <span className={`${styles.badge} ${styles.badgeEnded}`}>Ended</span>;
}

// Extracted outside component — no dependency on component state or props
async function fetchRecentEvents(): Promise<IEvent[]> {
  const token = await getTokenClient();
  if (!token) return [];
  const service = eventService(token);
  const eventIds = service.getRecentEventIds();
  return Promise.all(eventIds.map((id) => service.getEvent(id)));
}

export default function HomePage() {
  const [recentActiveEvents, setRecentActiveEvents] = useState<IEvent[]>([]);
  const router = useRouter();
  const wallet = useWallet();

  const handleLogout = useCallback(() => {
    deleteToken();
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    fetchRecentEvents().then(setRecentActiveEvents);
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <span className={styles.logo}>SprayIt</span>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        {/* ── Balance card ── */}
        <div
          className={styles.balanceCard}
          onClick={() => router.push("/wallet/fund")}
          role="button"
          tabIndex={0}
          aria-label="Wallet balance, tap to fund"
          onKeyDown={(e) => e.key === "Enter" && router.push("/wallet/fund")}
        >
          <div className={styles.balOrb} aria-hidden="true" />
          <p className={styles.balLabel}>Token balance</p>
          <p className={styles.balValue}>
            {(wallet.balance ?? 0).toLocaleString()}
          </p>
          <p className={styles.balSub}>
            ≈ ₦{((wallet.balance ?? 0) * 10).toLocaleString()} · tap to fund
          </p>
        </div>

        {/* ── Quick actions ── */}
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map(({ icon: Icon, label, sub, href, color }) => (
            <button
              type="button"
              key={href}
              className={styles.quickAction}
              onClick={() => router.push(href)}
            >
              <span className={styles.qaIcon} aria-hidden="true">
                <Icon color={color} size={24} />
              </span>
              <span className={styles.qaLabel}>{label}</span>
              <span className={styles.qaSub}>{sub}</span>
            </button>
          ))}
        </div>

        {/* ── Recent events ── */}
        {recentActiveEvents.length > 0 && (
          <>
            <p className={styles.sectionLabel}>Recent</p>
            <ul className={styles.eventList}>
              {recentActiveEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={styles.eventCard}
                    onClick={() => router.push(`/gift-room/${event.id}`)}
                  >
                    <div className={styles.ecInfo}>
                      <p
                        style={{ marginBottom: "10px" }}
                        className={styles.ecTitle}
                      >
                        {event.title.toUpperCase()}
                      </p>
                      <p className={styles.ecSub}>Join Code: {event.slug}</p>
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
