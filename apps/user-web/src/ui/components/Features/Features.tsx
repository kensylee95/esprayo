import { Radio, Sparkles, Wallet, Zap } from "lucide-react";
import Image from "next/image";
import crowdImg from "../../assets/crowd-glow.jpg";
import styles from "./Features.module.scss";

const items = [
  {
    Icon: Sparkles,
    title: "Virtual token spray",
    body: "Send tokens with a tap. Confetti, sound, and on-screen animations make every gift feel real.",
  },
  {
    Icon: Radio,
    title: "Live event rooms",
    body: "Open a room for your event and let guests join from anywhere. The celebration scales infinitely.",
  },
  {
    Icon: Zap,
    title: "Real-time broadcast",
    body: "Updates stream instantly to the big screen, host dashboard, and every guest's phone.",
  },
  {
    Icon: Wallet,
    title: "Cash out anytime",
    body: "Convert tokens to real funds with one tap. Transparent fees, instant settlement.",
  },
];

export function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.banner}>
        <Image
          src={crowdImg}
          alt="Crowd at a live event with gold confetti raining down"
          width={1600}
          height={900}
          loading="lazy"
          className={styles.bannerImg}
        />
        <div className={styles.bannerOverlay} />
        <div className={styles.bannerContent}>
          <span className={styles.bannerLabel}>From 12 to 12,000 guests</span>
          <h2 className={styles.bannerTitle}>
            Every room, <em>electric</em>.
          </h2>
        </div>
      </div>

      <div className={styles.head}>
        <span className={styles.label}>What you get</span>
        <h2 className={styles.title}>
          Built for the moments that <em>matter</em>.
        </h2>
      </div>

      <div className={styles.grid}>
        {items.map(({ Icon, title, body }) => (
          <div key={title} className={styles.card}>
            <span className={styles.icon}>
              <Icon size={18} strokeWidth={2} />
            </span>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardBody}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
