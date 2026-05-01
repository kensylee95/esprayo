"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EventType } from "../review/types";
import { useCreateEventStore } from "../useCreateEventStore";
import styles from "./StepOne.module.scss";

export default function Step1() {
  const router = useRouter();

  const setStep = useCreateEventStore((s) => s.setStep);
  const type = useCreateEventStore((s) => s.type);
  const setType = useCreateEventStore((s) => s.setType);

  useEffect(() => {
    setStep(1);
  }, [setStep]);

  const handleNext = () => {
    if (!type) return;
    router.push("step-2");
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <section>
          <div className={styles.orb} />

          <h1 className={styles.title}>What kind of event?</h1>

          <p className={styles.sub}>
            Choose the type that best describes your celebration
          </p>

          <div className={styles.grid}>
            <button
              type="button"
              onClick={() => setType(EventType.WEDDING)}
              className={`${styles.chip} ${
                type === EventType.WEDDING ? styles.active : ""
              }`}
            >
              💍 Wedding
            </button>

            <button
              type="button"
              onClick={() => setType(EventType.BIRTHDAY)}
              className={`${styles.chip} ${
                type === EventType.BIRTHDAY ? styles.active : ""
              }`}
            >
              🎂 Birthday
            </button>

            <button
              type="button"
              onClick={() => setType(EventType.GRADUATION)}
              className={`${styles.chip} ${
                type === EventType.GRADUATION ? styles.active : ""
              }`}
            >
              🎓 Graduation
            </button>

            <button
              type="button"
              onClick={() => setType(EventType.ANNIVERSARY)}
              className={`${styles.chip} ${
                type === EventType.ANNIVERSARY ? styles.active : ""
              }`}
            >
              💑 Anniversary
            </button>

            <button
              type="button"
              onClick={() => setType(EventType.NAMING)}
              className={`${styles.chip} ${
                type === EventType.NAMING ? styles.active : ""
              }`}
            >
              👶 Naming
            </button>

            <button
              type="button"
              onClick={() => setType(EventType.OTHER)}
              className={`${styles.chip} ${
                type === EventType.OTHER ? styles.active : ""
              }`}
            >
              ✨ Other
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={handleNext}
          className={styles.btn}
          disabled={!type}
        >
          Continue
        </button>
      </section>
    </main>
  );
}
