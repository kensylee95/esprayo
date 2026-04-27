import styles from "./StreakCard.module.scss";

export function StreakCard() {
  return (
    <div className={styles.streakCard}>
      <div className={styles.left}>
        <div className={styles.avatar} />
        <div>
          <p className={styles.title}>Streak — 14 quiet mornings</p>
          <p className={styles.sub}>NEXT · 06:30</p>
        </div>
      </div>
      <span className={styles.status}>ON TRACK</span>
    </div>
  );
}
