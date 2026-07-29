import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.backBtn} onClick={onClick}>
      <ChevronLeft size={24} className={styles.iconStyle} />
    </button>
  );
}
