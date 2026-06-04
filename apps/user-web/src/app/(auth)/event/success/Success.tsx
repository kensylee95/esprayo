"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  HomeIcon,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IEvent } from "@/services/Event/Event.dto";
import styles from "./Success.module.scss";

const page = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  },
};

const ringVariant = (delay: number) => ({
  animate: {
    scale: [0.6, 2.2],
    opacity: [0.5, 0],
    transition: {
      duration: 3,
      ease: "easeOut" as const,
      repeat: Infinity,
      delay,
    },
  },
});

const particleVariant = (i: number) => {
  const angle = (i / 12) * 2 * Math.PI;
  return {
    animate: {
      x: [0, Math.cos(angle) * 90],
      y: [0, Math.sin(angle) * 90],
      opacity: [1, 0],
      scale: [1, 0],
      transition: {
        duration: 1.1,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay: i * 0.04 + 0.3,
      },
    },
  };
};

export default function SuccessPage({ event }: { event: IEvent }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(event.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.rings}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={styles.ring}
            variants={ringVariant(i * 1)}
            animate="animate"
          />
        ))}
      </div>

      <div className={styles.particles}>
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className={`${styles.particle} ${i % 2 === 0 ? styles.particleSmall : ""}`}
            variants={particleVariant(i)}
            animate="animate"
          />
        ))}
      </div>

      <motion.div
        className={styles.card}
        variants={page}
        initial="hidden"
        animate="show"
      >
        {/* seal */}
        <motion.div className={styles.sealWrap} variants={scaleIn}>
          <div className={styles.seal}>
            <CheckCircle className={styles.checkIcon} strokeWidth={1.25} />
          </div>
          <motion.div
            className={styles.sealHalo}
            animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.08, 0.18] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* text */}
        <motion.div className={styles.textBlock} variants={fadeUp}>
          <p className={styles.eyebrow}>Event Created</p>
          <h1 className={styles.headline}>Your event is now in draft state.</h1>
          <p className={styles.body}>
            Everything is set. Your gift room is ready to receive guests — share
            the link and activate the room when ready and let the celebration
            begin.
          </p>
        </motion.div>

        {/* event code */}
        <motion.div className={styles.codeBlock} variants={fadeUp}>
          <p className={styles.codeLabel}>Event Code</p>
          <div className={styles.codeRow}>
            <span className={styles.code}>{event.slug}</span>
            <motion.button
              className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ""}`}
              onClick={handleCopy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Copy event code"
            >
              {copied ? (
                <Check size={15} strokeWidth={2} />
              ) : (
                <Copy size={15} strokeWidth={1.5} />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* divider */}
        <motion.div className={styles.divider} variants={fadeUp}>
          <span className={styles.dividerDot} />
          <motion.span
            className={styles.dividerLine}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
          />
          <span className={styles.dividerDot} />
        </motion.div>

        {/* actions */}
        <motion.div className={styles.actions} variants={fadeUp}>
          <motion.button
            className={styles.btnPrimary}
            onClick={() => router.push(`/event/view/${event.id}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LayoutDashboard size={16} strokeWidth={1.5} />
            <span>Enter Event room</span>
            <ArrowRight size={15} strokeWidth={2} className={styles.arrow} />
          </motion.button>

          <motion.button
            className={styles.btnGhost}
            onClick={() => router.push("/home")}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <HomeIcon size={15} strokeWidth={1.5} />
            <span>Go Home</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </main>
  );
}
