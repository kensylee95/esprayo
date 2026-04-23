import styles from "./Success.module.scss";

export default function Page() {
  return (
    <main className={styles.screen}>
      <div className={styles.orb} />

      <div className={styles.ring}>
        <div className={styles.ringInner}>🎉</div>
      </div>

      <h1 className={styles.title}>Event created.</h1>

      <p className={styles.eventName}>Adaeze & Chidi&apos;s Wedding</p>

      <p className={styles.hint}>
        Your event is saved as a draft.
        <br />
        Share the code below when you&apos;re ready.
      </p>

      <div className={styles.slugCard}>
        <div className={styles.slugMeta}>
          <p className={styles.slugLabel}>Guest join code</p>
          <p className={styles.slugVal}>ADC2025</p>
        </div>

        <button type="button" className={styles.slugCopy}>
          Copy link
        </button>
      </div>

      <button type="button" className={styles.cta}>
        Open gift room now
      </button>

      <button type="button" className={styles.ghost}>
        Back to dashboard
      </button>
    </main>
  );
}
