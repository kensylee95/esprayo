"use client";

import styles from "./Leaderboard.module.scss";

export default function LeaderboardScreen() {
  return (
    <div className={styles.phone}>
      <div className={styles.bar}>
        <div className={styles.notch} />
      </div>

      <div className={styles.screen}>
        <div className={styles.lb}>
          <div className={styles.topBar}>
            <div className={styles.eventName}>Adaeze & Chidi</div>
            <span className={styles.live}>● LIVE</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.val}>47</div>
              <div className={styles.label}>Guests</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.valGold}>18,420</div>
              <div className={styles.label}>Tokens</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.val}>93</div>
              <div className={styles.label}>Gifts</div>
            </div>
          </div>

          <div className={styles.sectionLabel}>Top supporters</div>

          <div className={styles.list}>
            {[
              {
                rank: 1,
                name: "Chief Okafor",
                score: 5400,
                cls: "r1",
                code: "CO",
              },
              {
                rank: 2,
                name: "Aunt Grace",
                score: 3980,
                cls: "r2",
                code: "AG",
              },
              {
                rank: 3,
                name: "Hajia Fatima",
                score: 3100,
                cls: "r3",
                code: "HF",
              },
              { rank: 4, name: "Oga Tunde", score: 2100, code: "OT" },
              { rank: 5, name: "Dr. Adeyemi", score: 1500, code: "DA" },
            ].map((u) => (
              <div
                key={u.rank}
                className={`${styles.row} ${u.cls ? styles[u.cls] : ""}`}
              >
                <div className={styles.barFill} />
                <div className={styles.rank}>{u.rank}</div>
                <div className={styles.avatar}>{u.code}</div>

                <div className={styles.info}>
                  <div className={styles.name}>{u.name}</div>
                  <div className={styles.sub}>activity · last gift</div>
                </div>

                <div className={styles.score}>{u.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
