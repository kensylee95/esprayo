import { ArrowUpRight, Coins, Radio } from "lucide-react";
import Image from "next/image";
import aweImg from "../../assets/awe-moment.jpg";
import styles from "./LiveMoment.module.scss";

export function LiveMoment() {
  return (
    <section className={styles.section}>
      <div className={styles.frame}>
        <Image
          src={aweImg}
          alt="Guests at an event reacting in awe as a live spray broadcasts to their phones"
          width={1600}
          height={1200}
          loading="lazy"
          className={styles.image}
        />

        <div className={styles.vignette} />

        {/* Floating live broadcast chip */}
        <div className={styles.broadcast}>
          <span className={styles.broadcastDot}>
            <span className={styles.pulse} />
            <Radio size={11} />
          </span>
          <div className={styles.broadcastText}>
            <span className={styles.broadcastLabel}>Broadcasting now</span>
            <span className={styles.broadcastRoom}>
              The Reception · 1,284 watching
            </span>
          </div>
        </div>

        {/* Floating big-spray notification */}
        <div className={styles.spray}>
          <span className={styles.sprayIcon}>
            <Coins size={16} />
          </span>
          <div>
            <p className={styles.sprayLine}>
              <strong>Tunde</strong> just sprayed
            </p>
            <p className={styles.sprayAmount}>
              ₦ 500,000 <ArrowUpRight size={14} />
            </p>
          </div>
        </div>

        <div className={styles.caption}>
          <span className={styles.label}>The wow moment</span>
          <h2 className={styles.title}>
            One spray. <em>The whole room reacts.</em>
          </h2>
          <p className={styles.lead}>
            When someone goes big, every phone in the room lights up.
            Notifications, animations and the live feed move as one — turning a
            single gift into a shared eruption of energy.
          </p>
        </div>
      </div>
    </section>
  );
}
