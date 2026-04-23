import { RitualCard } from "../RitualCard/RitualCard";
import { StreakCard } from "../StreakCard/StreakCard";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <div>
          <span className={styles.label}>Chapter 01 — Stillness</span>
          <h1 className={styles.heroTitle}>
            A quieter way to <em>begin</em> your day.
          </h1>
          <p className={styles.heroLead}>
            Serenade composes your morning into a single, unhurried ritual —
            breath, intention, and a touch of gold against the dark.
          </p>

          <div className={styles.ctaRow}>
            <button type="button" className={styles.btnPrimary}>
              Begin the ritual
            </button>
            <button type="button" className={styles.btnGhost}>
              Listen to a sample <span className={styles.arrow}>→</span>
            </button>
          </div>

          <div className={styles.statsRow}>
            <Stat value="04:32" label="Avg session" />
            <div className={styles.divider} />
            <Stat value="98%" label="Calm score" />
            <div className={styles.divider} />
            <Stat value="12k" label="Members" />
          </div>
        </div>

        <div className={styles.cardStack}>
          <div className={styles.glow} />
          <RitualCard />
          <StreakCard />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
