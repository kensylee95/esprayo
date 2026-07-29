"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventStatus, type IEvent } from "@/services/Event/Event.dto";
import styles from "./RecentEvents.module.scss";

interface Props {
  events: IEvent[];
}

function StatusBadge({ status }: { status: EventStatus }) {
  if (status === EventStatus.ACTIVE) {
    return (
      <span className={`${styles.badge} ${styles.live}`}>
        <span className={styles.liveDot} />
        LIVE
      </span>
    );
  }

  if (status === EventStatus.DRAFT) {
    return <span className={`${styles.badge} ${styles.draft}`}>Draft</span>;
  }

  return <span className={`${styles.badge} ${styles.ended}`}>Ended</span>;
}

export function RecentEvents({ events }: Props) {
  const router = useRouter();

  if (!events.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span>Recent Events</span>
      </div>

      <div className={styles.grid}>
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            className={styles.card}
            onClick={() => router.push(`/gift-room/${event.id}`)}
          >
            <div className={styles.cover}>
              {event.coverImageUrl ? (
                <Image
                  src={event.coverImageUrl}
                  alt={event.title}
                  fill
                  className={styles.image}
                />
              ) : (
                <div className={styles.placeholder} />
              )}

              <div className={styles.overlay} />

              <div className={styles.status}>
                <StatusBadge status={event.status} />
              </div>
            </div>

            <div className={styles.content}>
              <h3 className={styles.title}>{event.title.toUpperCase()}</h3>

              <div className={styles.meta}>
                <div>
                  <span className={styles.label}>Join Code</span>

                  <span className={styles.value}>{event.slug}</span>
                </div>

                <div>
                  <span className={styles.label}>Created</span>

                  <span className={styles.value}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
