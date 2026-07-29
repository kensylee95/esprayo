"use client";

import type { LucideIcon } from "lucide-react";
import styles from "./NavButton.module.scss";

export default function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${active ? styles.active : ""}`}
      onClick={onClick}
    >
      <Icon
        className={styles.icon}
        size={24}
        strokeWidth={active ? 2 : 1.5}
        aria-hidden="true"
      />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
