"use client";

import { useRouter } from "next/navigation";
import { useEvent } from "@/app/(auth)/gift-room/event.context";
import styles from "./NameScreen.module.scss";

export default function NameScreen() {
  const router = useRouter();
  const { slug } = useEvent();

  const handleCTAButton = () => {
    router.push(`/gift-room/${slug}`);
    return;
  };
  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <h1 className={styles.title}>What shall we call you?</h1>

        <p className={styles.hint}>
          Your name appears on the leaderboard
          <br />
          when you send a gift
        </p>
        <div className={styles.inputWrapper}>
          <input
            className={styles.input}
            defaultValue="Chief Okafor"
            placeholder="e.g. Uncle Emeka"
          />
        </div>

        <button type="button" onClick={handleCTAButton} className={styles.cta}>
          Continue
        </button>
      </div>
    </div>
  );
}
