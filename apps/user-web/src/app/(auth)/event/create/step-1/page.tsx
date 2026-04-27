"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import styles from "./StepOne.module.scss";
export default function Step1() {
  const router = useRouter();
  const setStep = useWizardStore((s) => s.setStep);
  useEffect(() => {
    setStep(1);
  }, [setStep]);

  const handleNext = () => {
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
            <div className={`${styles.chip} ${styles.active}`}>💍 Wedding</div>
            <div className={styles.chip}>🎂 Birthday</div>
            <div className={styles.chip}>🎓 Graduation</div>
            <div className={styles.chip}>💑 Anniversary</div>
            <div className={styles.chip}>👶 Naming</div>
            <div className={styles.chip}>✨ Other</div>
          </div>
        </section>
        <button type="button" onClick={handleNext} className={styles.btn}>
          Continue
        </button>
      </section>
    </main>
  );
}
