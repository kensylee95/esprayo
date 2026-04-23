"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import Input from "@/ui/components/InputWithLabel/InputWithLabel";
import styles from "./StepTwo.module.scss";
export default function Page() {
  const router = useRouter();
  const setStep = useWizardStore((s) => s.setStep);
  useEffect(() => {
    setStep(2);
  }, [setStep]);

  const handleNext = () => {
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
        <Input label="EVENT TITLE" placeholder="Adaeze & Chidi's Wedding" />
        <Input
          label="Venue (optional)"
          placeholder="e.g Transcorp Hilton, Abuja"
        />
        <Input
          label="Welcome message (optional)"
          placeholder="Thank you for celebrating with us!"
        />
        <button type="button" onClick={handleNext} className={styles.btn}>
          Continue
        </button>
      </section>
    </main>
  );
}
