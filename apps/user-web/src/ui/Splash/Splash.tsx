"use client";

import styles from "./Splash.module.scss";

export default function SplashScreen() {
  return (
    <div className={styles.phone}>
      <div className={styles.bar}>
        <div className={styles.notch} />
      </div>

      <div className={styles.screen}>
        <div className={styles.splash}>
          <div className={styles.orb} />
          <div className={styles.ring} />

          <div className={styles.logo}>Event Gift Room</div>
          <div className={styles.sub}>Join room to gift</div>

          <div className={styles.qrBox}>
            <div className={styles.qrInner}>
              <div className={`${styles.px} ${styles.px1}`} />
              <div className={`${styles.px} ${styles.px2}`} />
              <div className={`${styles.px} ${styles.px3}`} />
              <div className={`${styles.px} ${styles.px4}`} />
            </div>
          </div>

          <div className={styles.eventPill}>
            You're joining <span>Adaeze & Chidi's Wedding</span>
          </div>

          <button type="button" className={styles.cta}>
            Join Gift Room
          </button>
          <button type="button" className={styles.ghost}>
            Enter event code instead
          </button>
        </div>
      </div>
    </div>
  );
}
