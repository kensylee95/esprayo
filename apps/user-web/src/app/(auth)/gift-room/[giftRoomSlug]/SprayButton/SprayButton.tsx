"use client";

import { Sparkles } from "lucide-react";
import styles from "./SprayButton.module.scss";

export default function SprayButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      <div className={styles.iconWrap}>
        <Sparkles
          className={styles.icon}
          size={24}
          strokeWidth={active ? 2 : 1.5}
          aria-hidden="true"
        />
        <div className={styles.particle} data-p="1" />
        <div className={styles.particle} data-p="2" />
        <div className={styles.particle} data-p="3" />
        <div className={styles.particle} data-p="4" />
      </div>
      <span className={styles.label}>Spray</span>
    </button>
  );
}
