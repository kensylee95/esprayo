import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image src="/assets/logo.png" alt="" width={25} height={25} />
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
