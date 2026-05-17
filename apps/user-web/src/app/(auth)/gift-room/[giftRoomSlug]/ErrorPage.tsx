"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./GiftRoom.module.scss";

export default function ErrorPage({ error }: { error: string }) {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.errorState}>
        <CircleAlert size={48} className={styles.errorIcon} />

        <p className={styles.errorMessage}>{error}</p>

        <button
          type="button"
          className={styles.errorCta}
          onClick={() => router.push("/home")}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
