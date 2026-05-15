import { AnimatePresence, motion } from "framer-motion";

import { avatarColour, initials } from "./GiftRoom.constants";
import type { LeaderboardEntry, RoomStats } from "./GiftRoom.dto";
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

      {/* motion.ul enables layout context for children */}
      <motion.ul className={styles.lbList} layout>
        <AnimatePresence initial={false}>
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
              <motion.li
                key={entry.userId} // key stays on userId — drives layout tracking
                layout // animates position when rank order changes
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{
                  layout: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
              >
                <div className={`${styles.lbRow} ${rankClass}`}>
                  {/* Bar width animates smoothly via CSS transition */}
                  <div
                    className={styles.lbBar}
                    style={{
                      width: `${pct}%`,
                      background: entry.rank <= 3 ? colour : "#5A5570",
                      transition: "width 0.6s ease", // smooth bar growth
                    }}
                  />

                  {/* Rank number — animates when it changes */}
                  <motion.span
                    className={styles.lbRank}
                    key={`rank-${entry.userId}-${entry.rank}`}
                    initial={{ scale: 1.4, color: "#FFD700" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.35 }}
                  >
                    {entry.rank}
                  </motion.span>

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

                  {/* Score — pulses gold when it updates */}
                  <motion.span
                    className={styles.lbScore}
                    key={`score-${entry.userId}-${entry.tokens}`}
                    initial={{ scale: 1.25, color: "#FFD700" }}
                    animate={{ scale: 1, color: "#ffffff" }}
                    transition={{ duration: 0.4 }}
                  >
                    {entry.tokens.toLocaleString()}
                  </motion.span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
