"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipLoader } from "react-spinners";

import type { IEvent } from "@/services/Event/Event.dto";
import styles from "./Success.module.scss";

export default function SuccessPage({ event }: { event: IEvent }) {
  const router = useRouter();

  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async (eventId: string) => {
    if (isCopying) return;

    setIsCopying(true);

    try {
      const roomLink = `${window.location.origin}/gift-room/${eventId}`;

      await navigator.clipboard.writeText(roomLink);

      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <main className={styles.screen}>
      <div className={styles.orb} />

      <div className={styles.ring}>
        <div className={styles.ringInner}>🎉</div>
      </div>

      <h1 className={styles.title}>Event created.</h1>

      <p className={styles.eventName}>{event.title}</p>

      <p className={styles.hint}>
        Your event is saved as a draft.
        <br />
        Share the code below when you&apos;re ready.
      </p>

      <div className={styles.slugCard}>
        <div className={styles.slugMeta}>
          <p className={styles.slugLabel}>Guest join code</p>

          <p className={styles.slugVal}>{event.slug}</p>
        </div>

        <button
          onClick={() => handleCopyLink(event.id)}
          disabled={isCopying}
          type="button"
          className={styles.slugCopy}
        >
          {isCopying ? (
            <ClipLoader size={16} />
          ) : isCopied ? (
            <>
              <Check size={16} />
              Copied!
            </>
          ) : (
            "Copy link"
          )}
        </button>
      </div>

      <button
        onClick={() => router.push(`/gift-room/${event.id}`)}
        type="button"
        className={styles.cta}
      >
        Open gift room now
      </button>

      <button
        onClick={() => router.push("/home")}
        type="button"
        className={styles.ghost}
      >
        Back to dashboard
      </button>
    </main>
  );
}
