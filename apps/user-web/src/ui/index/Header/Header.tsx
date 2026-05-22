import Link from "next/link";
import styles from "./Header.module.scss";
import Logo from "@/ui/assets/logo.png"
import Image from "next/image";
import { ThemeToggle } from "@/ui/components/ThemeToggleBtn/ThemeToggleBtn";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>
          <Image src={Logo} height={30} width={30} alt=""/>
        </span>
        <span className={styles.logoText}></span>
      </div>
      <nav className={styles.nav}>
        <Link href="#features">Features</Link>
        <Link href="#rooms">Live Rooms</Link>
        <Link href="#how">How it works</Link>
      </nav>
      <Link href={"/login"} className={styles.btnSecondary}>
        Sign in
      </Link>
      <ThemeToggle/>
    </header>
  );
}
