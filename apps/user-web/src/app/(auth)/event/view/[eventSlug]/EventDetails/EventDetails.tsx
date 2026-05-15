"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import BackButton from "@/ui/components/BackButton/BackButton";
import styles from "./EventDetail.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventDetail {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: "active" | "draft" | "ended" | "cancelled";
  venue: string | null;
  tokenBalance: number;
  nairaBalance: number;
  giftCount: number;
  gifterCount: number;
  tokenRateNaira: number;
  showNairaValues: boolean;
  welcomeMessage: string | null;
}

/*const EVENT_TYPE_EMOJI: Record<string, string> = {
  wedding: "💍",
  birthday: "🎂",
  graduation: "🎓",
  anniversary: "💑",
  naming: "👶",
  other: "✨",
};*/

// ─── Cancel sheet ─────────────────────────────────────────────────────────────

function CancelSheet({
  status,
  onConfirm,
  onDismiss,
  loading,
}: {
  title: string;
  status: string;
  onConfirm: () => void;
  onDismiss: () => void;
  loading: boolean;
}) {
  const isLive = status === "active";

  return (
    <div
      className={styles.sheetOverlay}
      role="button"
      tabIndex={0}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onDismiss();
        }
        if (e.key === "Escape") {
          onDismiss();
        }
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} aria-hidden="true" />
        <div className={styles.sheetIcon} aria-hidden="true">
          ⚠️
        </div>
        <h2 id="cancel-title" className={styles.sheetTitle}>
          Cancel this event?
        </h2>
        <p className={styles.sheetSub}>
          {isLive
            ? "This will close the gift room immediately. Guests will no longer be able to join or send gifts."
            : "This draft event will be permanently cancelled."}
        </p>

        {isLive && (
          <div className={styles.sheetWarn}>
            <span className={styles.warnIcon} aria-hidden="true">
              ℹ️
            </span>
            <p className={styles.warnText}>
              <strong>Gifts already sent are not refunded.</strong> Token
              balances for any pending transactions will be returned to wallets
              within 24 hours.
            </p>
          </div>
        )}

        <button
          type="button"
          className={styles.btnConfirmCancel}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Cancelling…" : "Yes, cancel event"}
        </button>
        <button
          type="button"
          className={styles.btnKeep}
          onClick={onDismiss}
          disabled={loading}
        >
          {isLive ? "Keep event open" : "Keep draft"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage({
  event,
  loading,
}: {
  event: EventDetail;
  loading?: boolean;
}) {
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("serenade_token") ?? "")
      : "";

  const handleCopy = useCallback(async () => {
    if (!event) return;
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_API_URL}/join?code=${event.slug}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event]);

  const handleCancel = useCallback(async () => {
    if (!event) return;
    setCancelling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Cancel failed");
      router.push("/events");
    } catch (err) {
      console.error(err);
      setCancelling(false);
    }
  }, [event, token, router]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Event not found.</div>
      </div>
    );
  }

  const isActive = event.status === "active";
  const isDraft = event.status === "draft";
  const isEnded = event.status === "ended" || event.status === "cancelled";
  const canCancel = isActive || isDraft;

  return (
    <div className={styles.page}>
      {/* ── Cover ── */}
      <div className={`${styles.cover} ${isEnded ? styles.coverMuted : ""}`}>
        <BackButton onClick={() => router.back()} />
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        <h1 className={styles.detTitle}>{event.title}</h1>

        <div className={styles.badges}>
          {event.status === "active" && (
            <span className={`${styles.badge} ${styles.badgeLive}`}>
              ● LIVE
            </span>
          )}
          {event.status === "draft" && (
            <span className={`${styles.badge} ${styles.badgeDraft}`}>
              Draft
            </span>
          )}
          {event.status === "ended" && (
            <span className={`${styles.badge} ${styles.badgeEnded}`}>
              Ended
            </span>
          )}
          {event.status === "cancelled" && (
            <span className={`${styles.badge} ${styles.badgeCancelled}`}>
              Cancelled
            </span>
          )}
          <span className={`${styles.badge} ${styles.badgeType}`}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </span>
          <span className={`${styles.badge} ${styles.badgeSlug}`}>
            {event.slug}
          </span>
        </div>

        {/* ── Stats ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span
              className={`${styles.statVal} ${isEnded ? styles.statMuted : styles.statGold}`}
            >
              {event.tokenBalance > 0
                ? event.tokenBalance.toLocaleString()
                : "—"}
            </span>
            <span className={styles.statLbl}>Tokens gifted</span>
          </div>
          <div className={styles.statCard}>
            <span
              className={`${styles.statVal} ${isEnded ? styles.statMuted : ""}`}
            >
              {event.gifterCount > 0 ? event.gifterCount : "—"}
            </span>
            <span className={styles.statLbl}>Guests</span>
          </div>
          <div className={styles.statCard}>
            <span
              className={`${styles.statVal} ${isEnded ? styles.statMuted : ""}`}
            >
              {event.giftCount > 0 ? event.giftCount : "—"}
            </span>
            <span className={styles.statLbl}>Gifts sent</span>
          </div>
          <div className={styles.statCard}>
            <span
              className={`${styles.statVal} ${isEnded ? styles.statMuted : styles.statGold}`}
            >
              {event.nairaBalance > 0
                ? `₦${Number(event.nairaBalance).toLocaleString()}`
                : "—"}
            </span>
            <span className={styles.statLbl}>Naira value</span>
          </div>
        </div>

        {/* ── Info rows ── */}
        <div className={styles.infoCard}>
          {event.venue && (
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Venue</span>
              <span className={styles.infoVal}>{event.venue}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <span className={styles.infoKey}>Token rate</span>
            <span className={`${styles.infoVal} ${styles.infoValGold}`}>
              ₦{event.tokenRateNaira} / token
            </span>
          </div>
          <div className={styles.infoRow} style={{ borderBottom: "none" }}>
            <span className={styles.infoKey}>Show naira</span>
            <span className={styles.infoVal}>
              {event.showNairaValues ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        {isActive && (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => router.push(`/gift-room/${event.id}`)}
          >
            View gift room
          </button>
        )}

        {isDraft && (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={async () => {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/activate`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              router.push(`/gift-room/${event.id}`);
            }}
          >
            Open gift room
          </button>
        )}

        {(isActive || isDraft) && (
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleCopy}
          >
            <span aria-hidden="true">📋</span>
            {copied ? "Copied!" : `Copy join code ${event.slug}`}
          </button>
        )}

        {isDraft && (
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => router.push(`/events/${event.id}/edit`)}
          >
            <span aria-hidden="true">✏️</span>
            Edit event details
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className={styles.btnCancel}
            onClick={() => setShowCancel(true)}
          >
            Cancel event
          </button>
        )}
      </div>

      {/* ── Cancel confirmation sheet ── */}
      {showCancel && (
        <CancelSheet
          title={event.title}
          status={event.status}
          onConfirm={handleCancel}
          onDismiss={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
