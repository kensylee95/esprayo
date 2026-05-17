"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";
import { GIFT_CATALOG } from "../GiftRoom.constants";
import type { GiftItem } from "../GiftRoom.dto";
import TopUpModalCTA from "../TopupModalCTA";
import styles from "./SprayTab.module.scss";

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

  const y = useMotionValue(0);

  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  function dismissSheet() {
    animate(y, window.innerHeight, {
      type: "tween",
      ease: "easeIn",
      duration: 0.22,
      onComplete: closeSprayOverlay,
    });
  }

  function handleDragEnd(
    _: unknown,
    info: { offset: { y: number }; velocity: { y: number } },
  ) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      dismissSheet();
    } else {
      animate(y, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  }

  return createPortal(
    <div className={styles.portal}>
      <motion.div
        className={styles.backdrop}
        style={{ opacity: backdropOpacity }}
        onClick={dismissSheet}
      />

      <motion.div
        className={styles.tabContent}
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dragHandle} />

        <div className={styles.sprayHeader}>
          <span className={styles.sprayBalLabel}>Balance</span>
          <span className={styles.sprayBalVal}>
            {walletBalance.toLocaleString()} tkn
          </span>
          {streak > 1 && (
            <span className={styles.streakBadge}>🔥 x{streak}</span>
          )}
        </div>

        <div
          className={styles.giftGrid}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {GIFT_CATALOG.map((gift) => (
            <button
              type="button"
              key={gift.id}
              className={`${styles.giftCard}
                ${gift.featured ? styles.featured : ""}
                ${selected?.id === gift.id ? styles.giftSel : ""}
                ${walletBalance < gift.tokens ? styles.giftDisabled : ""}
              `}
              onClick={() => {
                if (walletBalance < gift.tokens) {
                  setTopModal(true);
                  return;
                }
                setSelected(gift);
              }}
            >
              {gift.featured && <span className={styles.topTag}>TOP</span>}
              <span className={styles.giftEmoji}>{gift.emoji}</span>
              <span className={styles.giftName}>{gift.name}</span>
              <span className={styles.giftCost}>{gift.tokens} tkn</span>
            </button>
          ))}
        </div>
      </motion.div>

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
            disabled={isSending || walletBalance < selected.tokens}
            className={`${styles.stripBtn} ${isOnFire ? styles.stripBtnFire : ""}`}
            onClick={() => onSend(selected)}
          >
            Send
          </button>
        </div>
      )}

      {openTopModal && (
        <TopUpModalCTA
          onRecharge={onRecharge}
          onClose={() => setTopModal(false)}
        />
      )}
    </div>,
    document.body,
  );
}
