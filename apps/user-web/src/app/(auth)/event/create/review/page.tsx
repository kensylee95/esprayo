"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import styles from "./Review.module.scss";
import { EVENT_TYPE_EMOJI } from "./types";
import { useCreateEventStore } from "../useCreateEventStore";
import { useEvent } from "../../hooks/useEvents";

export default function EventReviewScreen() {
  const router = useRouter();

  const setStep = useWizardStore((s) => s.setStep);

  const title = useCreateEventStore((s) => s.title);
  const type = useCreateEventStore((s) => s.type);
  const venue = useCreateEventStore((s) => s.venue);
  const welcomeMessage = useCreateEventStore((s) => s.welcomeMessage);
  const clearForm = useCreateEventStore((s) => s.resetForm);

  const { createEvent, loading, error } = useEvent();

  useEffect(() => {
    setStep(3);
  }, [setStep]);

  const emoji = type ? EVENT_TYPE_EMOJI[type] : "✨";

  const onSubmit = async () => {
    if(!type) return
    if(title==="" || venue==="" || welcomeMessage==="") return null
    try {
      await createEvent({
        title,
        type,
        venue,
        welcomeMessage,
      });

      // optional: clear wizard store here
      clearForm()
      router.push("success");
    } catch (e) {
      // error already stored in hook if needed
      console.error(e);
    }
  };

  const formatType = type
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : "—";

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
          <div className={styles.cover}>
            <span aria-hidden="true">{emoji}</span>
          </div>

          <div className={styles.body}>
            <h2 className={styles.eventTitle}>{title || "Untitled Event"}</h2>

            <span className={styles.draftBadge}>
              <span aria-hidden="true">●</span> Draft · not yet active
            </span>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowKey}>Type:</span>
                <span className={styles.rowVal}>{formatType}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowKey}>Venue:</span>
                <span className={styles.rowVal}>{venue || "—"}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowKey}>Welcome Message:</span>
                <span className={styles.rowVal}>
                  {welcomeMessage || "—"}
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
          disabled={loading}
        >
          {loading ? "Creating…" : "Create event"}
        </button>

        <button
          type="button"
          className={styles.ghost}
          onClick={() => router.back()}
          disabled={loading}
        >
          Edit details
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}