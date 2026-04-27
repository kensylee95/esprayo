import { Camera, Mail, Sparkles, X } from "lucide-react";
import Link from "next/link";
import styles from "./Footer.module.scss";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>
            <Sparkles size={12} />
          </span>
          <span className={styles.logoText}>Sprae</span>
        </div>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Sprae · Bring events to life.
        </p>
        <div className={styles.links}>
          <Link href="#" aria-label="Instagram">
            <Camera size={16} />
          </Link>
          <Link href="#" aria-label="Twitter">
            <X size={16} />
          </Link>
          <Link href="#" aria-label="Email">
            <Mail size={16} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
