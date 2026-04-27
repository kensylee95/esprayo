"use client";

import { createPortal } from "react-dom";
import styles from "./GiftRoom.module.scss";

export default function TopUpModalCTA({
  onClose,
  onRecharge,
}: {
  onClose: () => void;
  onRecharge: () => void;
}) {
  return createPortal(
    <div
      className={styles.topUpModalPortal}
      onClick={onClose}
      role="button"
      aria-pressed="false"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClose}
    >
      <div
        className={styles.topUpModal}
        onClick={(e) => e.stopPropagation()}
        role="button"
        aria-pressed="false"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
      >
        <p className={styles.rechargeText}>
          Recharge your account to spray gift on the celebrant
        </p>

        <button type="button" className={styles.cta} onClick={onRecharge}>
          Recharge Now
        </button>

        <button type="button" className={styles.ghost} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}
