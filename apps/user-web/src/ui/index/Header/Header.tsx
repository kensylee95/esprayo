import { Sparkles } from "lucide-react";
import Link from "next/link";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>
          <Sparkles size={16} strokeWidth={2.25} />
        </span>
        <span className={styles.logoText}>Sprae</span>
      </div>
      <nav className={styles.nav}>
        <Link href="#features">Features</Link>
        <Link href="#rooms">Live Rooms</Link>
        <Link href="#how">How it works</Link>
      </nav>
      <Link href={"/login"} className={styles.btnSecondary}>
        Sign in
      </Link>
    </header>
  );
}
