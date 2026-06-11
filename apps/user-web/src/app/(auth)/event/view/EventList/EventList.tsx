"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { IEvent } from "@/services/Event/Event.dto";
import BackButton from "@/ui/components/BackButton/BackButton";
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
  coverImageUrl?: string | null;
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
  if (status === "active") {
    return (
      <span className={`${styles.badge} ${styles.badgeLive}`}>
        <span className={styles.badgeLiveDot} aria-hidden="true" />
        LIVE
      </span>
    );
  }

  const map: Record<
    Exclude<EventStatus, "active">,
    { cls: string; label: string }
  > = {
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

  const formattedDate = new Date(event.startsAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <button
      type="button"
      className={`${styles.eventCard} ${cardCls}`}
      onClick={onClick}
    >
      {/* ── Cover image ── */}
      {event.coverImageUrl ? (
        <div className={styles.coverImageWrap}>
          <Image
            src={event.coverImageUrl}
            width={500}
            height={500}
            alt={event.title}
            className={styles.coverImage}
          />
          {/* Status badge overlaid on the image */}
          <div className={styles.coverBadgeOverlay}>
            <StatusBadge status={event.status} />
          </div>
          {/* Emoji overlaid bottom-left */}
          <div
            className={`${styles.coverEmoji} ${styles[`icon_${event.status}`]}`}
          >
            {event.emoji}
          </div>
        </div>
      ) : null}

      {/* ── Row: icon + info + right (only when no cover image) ── */}
      <div className={styles.cardBody}>
        {!event.coverImageUrl && (
          <div
            className={`${styles.eventIcon} ${styles[`icon_${event.status}`]}`}
          >
            {event.emoji}
          </div>
        )}

        <div className={styles.eventInfo}>
          <p className={styles.eventTitle}>{event.title}</p>
          <p className={styles.eventMeta}>
            {formattedDate}
            {event.venue ? ` · ${event.venue}` : ""}
          </p>
        </div>

        <div className={styles.eventRight}>
          {/* Badge only shown here when there's no cover image */}
          {!event.coverImageUrl && <StatusBadge status={event.status} />}
          {event.tokenBalance > 0 && (
            <span
              className={`${styles.tokenCount} ${
                event.status === "ended" ? styles.tokenMuted : ""
              }`}
            >
              {event.tokenBalance.toLocaleString()} tkn
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsList({ userEvents }: { userEvents: IEvent[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");

  const events: EventSummary[] = useMemo(
    () =>
      userEvents.map((e) => ({
        ...e,
        emoji: EVENT_TYPE_EMOJI[e.type.toLowerCase()] ?? "✨",
      })),
    [userEvents],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "active") return events.filter((e) => e.status === "active");
    if (filter === "draft") return events.filter((e) => e.status === "draft");
    if (filter === "ended")
      return events.filter(
        (e) => e.status === "ended" || e.status === "cancelled",
      );
    return events;
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
      <div className={styles.backButton}>
        <BackButton onClick={() => router.back()} />
      </div>
      <main className={styles.main}>
        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitleGroup}>
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

        {/* ── List / empty state ── */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap} aria-hidden="true">
              🎁
            </div>
            <p className={styles.emptyText}>No events here yet</p>
            <p className={styles.emptySub}>
              {filter === "all"
                ? "Create your first gift room"
                : `No ${filter} events`}
            </p>
          </div>
        ) : (
          <ul className={styles.eventList}>
            {filtered.map((event) => (
              <li key={event.id}>
                <EventCard
                  event={event}
                  onClick={() => router.push(`/event/view/${event.id}`)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
