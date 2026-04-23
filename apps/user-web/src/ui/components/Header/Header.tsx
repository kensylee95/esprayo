import Link from "next/link";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoMark} />
        <span className={styles.logoText}>Serenade</span>
      </div>
      <nav className={styles.nav}>
        <Link href="#">Rituals </Link>
        <Link href="#">Library</Link>
        <Link href="#">Journal</Link>
      </nav>
      <button type="button" className={styles.btnSecondary}>
        Sign in
      </button>
    </header>
  );
}
