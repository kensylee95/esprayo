"use client";

import {
  LayoutGrid,
  LogOut,
  type LucideIcon,
  QrCode,
  Sparkles,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { deleteToken, getTokenClient } from "@/helpers/request";
import { useWallet } from "@/hooks/useWallets";
import eventService from "@/services/Event/Event";
import type { IEvent } from "@/services/Event/Event.dto";
import styles from "./Home.module.scss";
import { RecentEvents } from "./RecentEvents/RecentEvents";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuickAction {
  icon: LucideIcon;
  label: string;
  sub: string;
  href: string;
  /** Icon fill color */
  color: string;
  /** CSS custom properties injected onto the tile */
  cssVars: React.CSSProperties;
}

// ── Config ────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: QrCode,
    label: "Join event",
    sub: "Scan or enter code",
    href: "/join",
    color: "#7C3AED",
    cssVars: {
      "--qa-accent-clr": "#7C3AED",
      "--qa-icon-bg": "rgba(124,58,237,0.08)",
      "--qa-icon-border": "rgba(124,58,237,0.18)",
    } as React.CSSProperties,
  },
  {
    icon: Sparkles,
    label: "Create event",
    sub: "Host a gift room",
    href: "/event/create",
    color: "#C9A84C",
    cssVars: {
      "--qa-accent-clr": "#C9A84C",
      "--qa-icon-bg": "rgba(201,168,76,0.08)",
      "--qa-icon-border": "rgba(201,168,76,0.18)",
    } as React.CSSProperties,
  },
  {
    icon: Wallet,
    label: "Fund wallet",
    sub: "Buy tokens",
    href: "/wallet/fund",
    color: "#10B981",
    cssVars: {
      "--qa-accent-clr": "#10B981",
      "--qa-icon-bg": "rgba(16,185,129,0.08)",
      "--qa-icon-border": "rgba(16,185,129,0.18)",
    } as React.CSSProperties,
  },
  {
    icon: LayoutGrid,
    label: "My events",
    sub: "View & manage",
    href: "/event/view",
    color: "#EC4899",
    cssVars: {
      "--qa-accent-clr": "#EC4899",
      "--qa-icon-bg": "rgba(236,72,153,0.08)",
      "--qa-icon-border": "rgba(236,72,153,0.18)",
    } as React.CSSProperties,
  },
];

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchRecentEvents(): Promise<IEvent[]> {
  const token = await getTokenClient();
  if (!token) return [];
  const service = eventService(token);
  const eventIds = service.getRecentEventIds();
  return Promise.all(eventIds.map((id) => service.getEvent(id)));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [recentEvents, setRecentEvents] = useState<IEvent[]>([]);
  const router = useRouter();
  const wallet = useWallet();

  const handleLogout = useCallback(() => {
    deleteToken();
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    fetchRecentEvents().then(setRecentEvents);
  }, []);

  const balance = wallet.balance ?? 0;
  const nairaEquivalent = (balance * 10).toLocaleString();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <span className={styles.logo}>
            <Image src="/assets/logo.png" width={30} height={30} alt="" />
          </span>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={14} aria-hidden="true" />
            Logout
          </button>
        </header>

        {/* ── Balance card ── */}
        <div className={styles.balanceWrap}>
          <div
            className={styles.balanceCard}
            onClick={() => router.push("/wallet/fund")}
            role="button"
            tabIndex={0}
            aria-label={`Token balance: ${balance.toLocaleString()}. Tap to fund.`}
            onKeyDown={(e) => e.key === "Enter" && router.push("/wallet/fund")}
          >
            {/* Decorative rings */}
            <div className={styles.balDecoRing} aria-hidden="true" />
            <div className={styles.balDecoRingInner} aria-hidden="true" />
            <div className={styles.balDecoDot} aria-hidden="true" />

            <div className={styles.balTop}>
              <p className={styles.balLabel}>Token balance</p>
              <div className={styles.balLiveChip} aria-hidden="true">
                <span className={styles.balLiveDot} />
                ACTIVE
              </div>
            </div>

            <p className={styles.balValue}>
              <span className={styles.balCurrencySymbol}>T</span>
              {balance.toLocaleString()}
            </p>

            <div className={styles.balBottom}>
              <p className={styles.balNaira}>≈ ₦{nairaEquivalent}</p>
              <div className={styles.balFundCta} aria-hidden="true">
                Fund →
              </div>
            </div>
          </div>
        </div>

        {/* ── Section divider (mobile only) ── */}
        <div className={styles.sectionDivider} aria-hidden="true">
          <div className={styles.dividerLine} />
          <span className={styles.dividerLabel}>Actions</span>
          <div className={styles.dividerLine} />
        </div>

        {/* ── Quick actions ── */}
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map(
            ({ icon: Icon, label, sub, href, color, cssVars }) => (
              <button
                type="button"
                key={href}
                className={styles.quickAction}
                style={cssVars}
                onClick={() => router.push(href)}
              >
                <span className={styles.qaIconWrap} aria-hidden="true">
                  <Icon color={color} size={17} />
                </span>
                <span className={styles.qaLabel}>{label}</span>
                <span className={styles.qaSub}>{sub}</span>
              </button>
            ),
          )}
        </div>

        {/* ── Recent events ── */}
        <RecentEvents events={recentEvents} />
      </main>
    </div>
  );
}
