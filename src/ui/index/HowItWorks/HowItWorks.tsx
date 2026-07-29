import { DoorOpen, Flame, Smartphone } from "lucide-react";
import Image from "next/image";
import phoneImg from "../../assets/phone-spray.jpg";
import styles from "./HowItWorks.module.scss";

const steps = [
  {
    n: "01",
    Icon: DoorOpen,
    title: "Create the room",
    body: "Hosts open a live room for the event in seconds. Share a link or QR code with guests.",
  },
  {
    n: "02",
    Icon: Smartphone,
    title: "Guests join & spray",
    body: "Anyone with the link joins instantly. Pick an amount, tap spray, watch it land.",
  },
  {
    n: "03",
    Icon: Flame,
    title: "Bring it to life",
    body: "Live updates stream to the big screen and every phone. The energy compounds.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div>
            <span className={styles.label}>How it works</span>
            <h2 className={styles.title}>
              From idea to <em>celebration</em> in three steps.
            </h2>
          </div>
          <div className={styles.imageWrap}>
            <Image
              src={phoneImg}
              alt="Hand holding a phone glowing gold at a live event"
              width={1024}
              height={1024}
              loading="lazy"
              className={styles.image}
            />
            <div className={styles.imageOverlay} />
          </div>
        </div>

        <ol className={styles.steps}>
          {steps.map(({ n, Icon, title, body }) => (
            <li key={n} className={styles.step}>
              <div className={styles.stepHead}>
                <span className={styles.iconBox}>
                  <Icon size={16} />
                </span>
                <span className={styles.n}>{n}</span>
              </div>
              <h3 className={styles.stepTitle}>{title}</h3>
              <p className={styles.stepBody}>{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
