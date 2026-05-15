import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.backBtn} onClick={onClick}>
      <ChevronLeft className={styles.iconStyle} />
    </button>
  );
}
