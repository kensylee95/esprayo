import { ArrowRight, MessageCircle } from "lucide-react";
import styles from "./CTA.module.scss";

export function CTA() {
  return (
    <section id="rooms" className={styles.section}>
      <div className={styles.card}>
        <div className={styles.glow} />
        <span className={styles.label}>Your next event</span>
        <h2 className={styles.title}>
          The crowd is ready.
          <br />
          <em>Open the room.</em>
        </h2>
        <p className={styles.lead}>
          Whether it's a wedding, a club night, or a milestone birthday — Sprae
          makes the whole room part of the moment.
        </p>
        <div className={styles.ctaRow}>
          <button type="button" className={styles.btnPrimary}>
            Create a room <ArrowRight size={16} />
          </button>
          <button type="button" className={styles.btnGhost}>
            <MessageCircle size={16} /> Talk to us
          </button>
        </div>
      </div>
    </section>
  );
}
