import { avatarColour, initials } from "./GiftRoom.constants";
import styles from "./GiftRoom.module.scss";
export default function LeaderboardTab({
  entries,
  stats,
}: {
  entries: LeaderboardEntry[];
  stats: RoomStats;
}) {
  const max = entries[0]?.tokens || 1;
  return (
    <div className={styles.content}>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{stats.guestCount}</span>
          <span className={styles.statLbl}>Guests</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.gold}`}>
            {stats.totalTokens.toLocaleString()}
          </span>
          <span className={styles.statLbl}>Tokens</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal}>{stats.totalGifts}</span>
          <span className={styles.statLbl}>Gifts</span>
        </div>
      </div>

      <ul className={styles.lbList}>
        {entries.map((entry) => {
          const rankClass =
            entry.rank === 1
              ? styles.rank1
              : entry.rank === 2
                ? styles.rank2
                : entry.rank === 3
                  ? styles.rank3
                  : "";
          const colour = avatarColour(entry.userId);
          const pct = Math.round((entry.tokens / max) * 100);

          return (
            <li key={entry.userId}>
              <div className={`${styles.lbRow} ${rankClass}`}>
                <div
                  className={styles.lbBar}
                  style={{
                    width: `${pct}%`,
                    background: entry.rank <= 3 ? colour : "#5A5570",
                  }}
                />
                <span className={styles.lbRank}>{entry.rank}</span>
                <div
                  className={styles.lbAvatar}
                  style={{
                    background: `${colour}22`,
                    color: colour,
                  }}
                >
                  {initials(entry.displayName)}
                </div>
                <div className={styles.lbInfo}>
                  <p className={styles.lbName}>{entry.displayName}</p>
                  <p className={styles.lbSub}>
                    {entry.giftCount} gift{entry.giftCount !== 1 ? "s" : ""} ·{" "}
                    {entry.lastGift}
                  </p>
                </div>
                <span className={styles.lbScore}>
                  {entry.tokens.toLocaleString()}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
