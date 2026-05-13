"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { GIFT_CATALOG } from "./GiftRoom.constants";
import type { GiftItem } from "./GiftRoom.dto";
import styles from "./GiftRoom.module.scss";
import TopUpModalCTA from "./TopupModalCTA";

export default function SprayTab({
  walletBalance,
  onSend,
  isSending,
  closeSprayOverlay,
  onRecharge,
  streak = 0,
}: {
  walletBalance: number;
  onSend: (gift: GiftItem) => void;
  isSending: boolean;
  closeSprayOverlay: () => void;
  onRecharge: () => void;
  streak?: number;
}) {
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [openTopModal, setTopModal] = useState(false);

  const isOnFire = streak >= 3;

  return createPortal(
    <div
      className={styles.portal}
      onClick={closeSprayOverlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && closeSprayOverlay()}
    >
      <div
        className={styles.tabContent}
        onClick={(e) => e.stopPropagation()}
        role="button"
        aria-pressed="false"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
      >
        <div className={styles.sprayHeader}>
          <span className={styles.sprayBalLabel}>Balance</span>
          <span className={styles.sprayBalVal}>
            {walletBalance.toLocaleString()} tkn
          </span>

          {/* Streak badge — only shows when active */}
          {streak > 1 && (
            <span className={styles.streakBadge}>
              🔥 x{streak}
            </span>
          )}
        </div>

        <div className={styles.giftGrid}>
          {GIFT_CATALOG.map((gift) => (
            <button
              type="button"
              key={gift.id}
              className={`${styles.giftCard}
              ${gift.featured ? styles.featured : ""}
              ${selected?.id === gift.id ? styles.giftSel : ""}
              ${walletBalance < gift.tokens ? styles.giftDisabled : ""}
            `}
              onClick={() => setSelected(gift)}
              disabled={walletBalance < gift.tokens}
            >
              {gift.featured && <span className={styles.topTag}>TOP</span>}
              <span className={styles.giftEmoji}>{gift.emoji}</span>
              <span className={styles.giftName}>{gift.name}</span>
              <span className={styles.giftCost}>{gift.tokens} tkn</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.sendStrip}>
          <span className={styles.stripEmoji}>{selected.emoji}</span>

          <div className={styles.stripInfo}>
            <p className={styles.stripName}>{selected.name}</p>
            <p className={styles.stripCost}>
              {selected.tokens} tokens · {walletBalance - selected.tokens}{" "}
              remaining
            </p>
          </div>

          <button
            type="button"
            className={`${styles.stripBtn} ${isOnFire ? styles.stripBtnFire : ""}`}
            onClick={() => onSend(selected)}
            disabled={isSending}
          >
            {isSending ? "…" : isOnFire ? `🔥 Spray` : "Spray"}
          </button>
        </div>
      )}

      {walletBalance <= 0 && openTopModal && (
        <TopUpModalCTA
          onRecharge={onRecharge}
          onClose={() => setTopModal(false)}
        />
      )}
    </div>,
    document.body,
  );
}