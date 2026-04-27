import { Sparkles, Zap } from "lucide-react";
import styles from "./TokenSprayCard.module.scss";

const presets = ["50", "200", "500", "1K"];

export function TokenSprayCard() {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <span className={styles.label}>
          <Zap size={11} /> Quick spray
        </span>
        <div className={styles.presets}>
          {presets.map((p, i) => (
            <button
              type="button"
              key={p}
              className={`${styles.chip} ${i === 2 ? styles.chipActive : ""}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className={styles.sprayBtn}>
        Spray <Sparkles size={14} />
      </button>
    </div>
  );
}
