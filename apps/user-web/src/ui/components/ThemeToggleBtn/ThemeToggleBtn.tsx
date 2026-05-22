"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./ThemeToggleBtn.module.scss";

export function ThemeToggle() {
const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      className={styles.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      aria-label="Toggle theme"
    >
      {/* Glow */}
      <motion.div
        className={styles.glow}
        animate={{
          opacity: isDark ? 0.8 : 0.45,
          scale: isDark ? 1 : 0.92,
        }}
        transition={{ duration: 0.35 }}
      />

      {/* Sliding luxury orb */}
      <motion.div
        className={styles.thumb}
        layout
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        animate={{
          x: isDark ? 34 : 0,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedTheme}
            initial={{ opacity: 0, rotate: -120, scale: 0.4 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 120, scale: 0.4 }}
            transition={{ duration: 0.22 }}
            className={styles.iconWrap}
          >
            {isDark ? (
              <MoonStar size={16} strokeWidth={2.1} />
            ) : (
              <SunMedium size={16} strokeWidth={2.1} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Background labels */}
      <div className={styles.labels}>
        <span>Light</span>
        <span>Dark</span>
      </div>
    </motion.button>
  );
}