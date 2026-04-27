"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./BottomNavbar.module.scss";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: "🏠", label: "Home", href: "/home" },
  { icon: "🎁", label: "Events", href: "/events" },
  { icon: "👛", label: "Wallet", href: "/wallet" },
  { icon: "👤", label: "Profile", href: "/profile" },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ icon, label, href }) => {
        const active = pathname === href || pathname.startsWith(`{$href}"/"`);
        return (
          <button
            type="button"
            key={href}
            className={`${styles.item} ${active ? styles.active : ""}`}
            onClick={() => router.push(href)}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
