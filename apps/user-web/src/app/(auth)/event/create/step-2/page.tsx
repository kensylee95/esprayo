"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import Input from "@/ui/components/InputWithLabel/InputWithLabel";
import { useCreateEventStore } from "../useCreateEventStore";
import styles from "./StepTwo.module.scss";

export default function Page() {
  const router = useRouter();

  const setStep = useWizardStore((s) => s.setStep);

  const title = useCreateEventStore((s) => s.title);
  const venue = useCreateEventStore((s) => s.venue);
  const welcomeMessage = useCreateEventStore((s) => s.welcomeMessage);
  const setField = useCreateEventStore((s) => s.setField);

  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const isValid = title.trim().length > 0;

  const handleNext = () => {
    if (!isValid) return;
    router.push("review");
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.orb} />

        <h1 className={styles.title}>Name your event.</h1>

        <p className={styles.sub}>
          This appears at the top of the gift room and on the display screen
        </p>

        <form className={styles.form}>
          <Input
            label="EVENT TITLE"
            placeholder="Adaeze & Chidi's Wedding"
            value={title}
            onChange={(e) => setField("title", e.target.value)}
          />

          <Input
            label="Venue (optional)"
            placeholder="e.g Transcorp Hilton, Abuja"
            value={venue}
            onChange={(e) => setField("venue", e.target.value)}
          />

          <Input
            label="Welcome message (optional)"
            placeholder="Thank you for celebrating with us!"
            value={welcomeMessage}
            onChange={(e) => setField("welcomeMessage", e.target.value)}
          />

          <button
            type="button"
            onClick={handleNext}
            className={styles.btn}
            disabled={!isValid}
          >
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
