"use client";
import { useRouter } from "next/navigation";
import styles from "./GiftRoom.module.scss";
export default function ErrorPage({ error }: { error: string }) {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <div className={styles.errorState}>
        <p className={styles.errorMessage}>{error}</p>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/home")}
        >
          Go back
        </button>
      </div>
    </div>
  );
}
