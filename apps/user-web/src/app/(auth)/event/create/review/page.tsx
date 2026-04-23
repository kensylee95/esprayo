"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import styles from "./Review.module.scss";
import { type CreateEventForm, EVENT_TYPE_EMOJI, EventType } from "./types";

export default function EventReviewScreen() {
  const [isLoading, _setIsLoading] = useState(false);
  const router = useRouter();
  const setStep = useWizardStore((s) => s.setStep);
  useEffect(() => {
    setStep(3);
  }, [setStep]);

  const form: CreateEventForm = {
    title: "Ada & Eze's wedding",
    type: EventType.ANNIVERSARY,
    venue: "transcorp, Abuja",
    welcomeMessage: "Thank you for surpporting us",
  };
  const emoji = form.type ? EVENT_TYPE_EMOJI[form.type] : "✨";
  const onSubmit = () => {};
  return (
    <div className={styles.screen}>
      <div className={styles.orb} />
      <div className={styles.content}>
        <h1 className={styles.title}>
          Review your
          <br />
          event.
        </h1>

        <div className={styles.summary}>
          {/* Cover */}
          <div className={styles.cover}>
            <span aria-hidden="true">{emoji}</span>
          </div>

          <div className={styles.body}>
            <h2 className={styles.eventTitle}>{form.title}</h2>

            <span className={styles.draftBadge}>
              <span aria-hidden="true">●</span> Draft · not yet active
            </span>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowKey}>Type</span>
                <span className={styles.rowVal}>
                  {form.type
                    ? form.type.charAt(0).toUpperCase() + form.type.slice(1)
                    : "—"}
                </span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowKey}>Venue</span>
                <span className={styles.rowVal}>{form.venue || "—"}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowKey}>Welcome Message</span>
                <span className={styles.rowVal}>
                  {form.welcomeMessage || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ctaWrap}>
        <button
          type="button"
          className={styles.btn}
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Creating…" : "Create event"}
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => router.back}
          disabled={isLoading}
        >
          Edit details
        </button>
      </div>
    </div>
  );
}
