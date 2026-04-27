import styles from "./RitualCard.module.scss";

type RowProps = {
  title: string;
  duration: string;
  tag: string;
  accent?: boolean;
};

function Row({ title, duration, tag, accent }: RowProps) {
  return (
    <div className={`${styles.row} ${accent ? styles.rowAccent : ""}`}>
      <div className={styles.rowLeft}>
        <span
          className={`${styles.rowDot} ${accent ? styles.rowDotAccent : ""}`}
        />
        <div>
          <p className={styles.rowTitle}>{title}</p>
          <span className={styles.rowTag}>{tag}</span>
        </div>
      </div>
      <span className={styles.rowDuration}>{duration}</span>
    </div>
  );
}

export function RitualCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.label}>Tonight</span>
          <h3 className={styles.cardTitle}>
            Evening <em>unwind</em>
          </h3>
        </div>
        <span className={styles.timePill}>18:42</span>
      </div>

      <div className={styles.rituals}>
        <Row title="Breath of Stillness" duration="06:00" tag="Breath" />
        <Row title="A letter to tomorrow" duration="04:30" tag="Write" />
        <Row title="Nocturne in G" duration="08:12" tag="Listen" accent />
      </div>

      <div className={styles.intentionWrap}>
        <label htmlFor="intention" className={styles.label}>
          Set an intention
        </label>
        <input
          className={styles.input}
          placeholder="Tonight, I will rest without resistance…"
        />
      </div>

      <button type="button" className={`${styles.btnPrimary} ${styles.cta}`}>
        Begin in 3 minutes
      </button>
    </div>
  );
}
