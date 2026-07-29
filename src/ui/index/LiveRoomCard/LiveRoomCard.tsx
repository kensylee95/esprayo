import { Coins, Eye, TrendingUp } from "lucide-react";
import styles from "./LiveRoomCard.module.scss";

type Drop = { name: string; amount: string; initial: string; tone: string };

const drops: Drop[] = [
  { name: "Ada", amount: "+250", initial: "A", tone: "violet" },
  { name: "Tunde", amount: "+1,000", initial: "T", tone: "gold" },
  { name: "Zara", amount: "+75", initial: "Z", tone: "rose" },
];

export function LiveRoomCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.liveDot}>
            <span className={styles.pulse} /> LIVE
          </span>
          <h3 className={styles.cardTitle}>
            Tola & Femi · <em>The Reception</em>
          </h3>
        </div>
        <span className={styles.viewersPill}>
          <Eye size={12} /> 1,284
        </span>
      </div>

      <div className={styles.feed}>
        {drops.map((d, i) => (
          <div
            key={i}
            className={`${styles.row} ${i === 1 ? styles.rowAccent : ""}`}
          >
            <div className={styles.rowLeft}>
              <span
                className={`${styles.avatar} ${styles[`avatar_${d.tone}`]}`}
              >
                {d.initial}
              </span>
              <div>
                <p className={styles.rowTitle}>
                  {d.name} sprayed{" "}
                  <Coins size={12} className={styles.inlineIcon} />
                </p>
                <span className={styles.rowTag}>just now</span>
              </div>
            </div>
            <span className={styles.amount}>{d.amount}</span>
          </div>
        ))}
      </div>

      <div className={styles.totalBar}>
        <span className={styles.label}>
          <TrendingUp size={12} /> Room total
        </span>
        <span className={styles.total}>₦ 1,248,500</span>
      </div>
    </div>
  );
}
