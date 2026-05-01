"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { IEvent } from "@/services/Event/Event.dto";
import styles from "./EventList.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventStatus = "active" | "draft" | "ended" | "cancelled";

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: EventStatus;
  venue: string | null;
  startsAt: Date;
  tokenBalance: number;
  giftCount: number;
  emoji: string;
}

type FilterTab = "all" | "active" | "draft" | "ended";

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Live" },
  { key: "draft", label: "Draft" },
  { key: "ended", label: "Ended" },
];

const EVENT_TYPE_EMOJI: Record<string, string> = {
  wedding: "💍",
  birthday: "🎂",
  graduation: "🎓",
  anniversary: "💑",
  naming: "👶",
  other: "✨",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { cls: string; label: string }> = {
    active: { cls: styles.badgeLive, label: "● LIVE" },
    draft: { cls: styles.badgeDraft, label: "Draft" },
    ended: { cls: styles.badgeEnded, label: "Ended" },
    cancelled: { cls: styles.badgeCancelled, label: "Cancelled" },
  };
  const { cls, label } = map[status];
  return <span className={`${styles.badge} ${cls}`}>{label}</span>;
}

function EventCard({
  event,
  onClick,
}: {
  event: EventSummary;
  onClick: () => void;
}) {
  const cardCls =
    event.status === "active"
      ? styles.cardLive
      : event.status === "draft"
        ? styles.cardDraft
        : styles.cardEnded;

  return (
    <button
      type="button"
      className={`${styles.eventCard} ${cardCls}`}
      onClick={onClick}
    >
      <div className={`${styles.eventIcon} ${styles[`icon_${event.status}`]}`}>
        {event.emoji}
      </div>
      <div className={styles.eventInfo}>
        <p className={styles.eventTitle}>{event.title}</p>
        <p className={styles.eventMeta}>
          {new Date(event.startsAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
      </div>
      <div className={styles.eventRight}>
        <StatusBadge status={event.status} />
        {event.tokenBalance > 0 && (
          <span
            className={`${styles.tokenCount} ${event.status === "ended" ? styles.tokenMuted : ""}`}
          >
            {event.tokenBalance.toLocaleString()} tkn
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsList({ userEvents }: { userEvents: IEvent[] }) {
  const router = useRouter();

  const [filter, setFilter] = useState<FilterTab>("all");

  const events: EventSummary[] = useMemo(() => {
    return userEvents.map((eventData) => ({
      ...eventData,
      emoji: EVENT_TYPE_EMOJI[eventData.type.toLowerCase()] ?? "✨",
    }));
  }, [userEvents]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filter === "all") return true;
      if (filter === "active") return e.status === "active";
      if (filter === "draft") return e.status === "draft";
      if (filter === "ended")
        return e.status === "ended" || e.status === "cancelled";
      return true;
    });
  }, [events, filter]);

  const counts = useMemo(
    () => ({
      active: events.filter((e) => e.status === "active").length,
      draft: events.filter((e) => e.status === "draft").length,
      ended: events.filter(
        (e) => e.status === "ended" || e.status === "cancelled",
      ).length,
    }),
    [events],
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Events</h1>
            <p className={styles.pageSub}>
              {counts.active} active · {counts.draft} draft · {counts.ended}{" "}
              ended
            </p>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className={styles.tabs} role="tablist">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              role="tab"
              aria-selected={filter === key}
              className={`${styles.tab} ${filter === key ? styles.tabActive : ""} ${
                filter === key && key === "active" ? styles.tabLive : ""
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🎁</p>
            <p className={styles.emptyText}>No events here yet</p>
          </div>
        ) : (
          <ul className={styles.eventList}>
            {filtered.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
