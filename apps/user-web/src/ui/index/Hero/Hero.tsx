"use client"
import { ArrowRight, Coins, Globe2, PlayCircle, Users } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import heroImgDark from "../../assets/hero-spray-dark.png";
import heroImgLight from "../../assets/hero-spray-light.png";
import { LiveRoomCard } from "../LiveRoomCard/LiveRoomCard";
import { TokenSprayCard } from "../TokenSprayCard/TokenSprayCard";
import styles from "./Hero.module.scss";
import { FeatureStrip } from "../FeatureStrip/FeatureStrip";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Hero() {

  return (
    <section className={styles.hero}>
      <div className={styles.heroGrid}>
        <div className={styles.heroLeft}>
          <span className={styles.label}>
            <span className={styles.labelDot} /> Live Gifting · Real Moments
          </span>
          <h1 className={styles.heroTitle}>
            Spray <em>gold</em> on every
            <br />
            unforgettable moment.
          </h1>
          <p className={styles.heroLead}>
            Sprae turns weddings, parties and concerts into shared experiences.
            Send virtual tokens, join live rooms, and watch the celebration
            light up in real time.
          </p>

          <div className={styles.ctaRow}>
            <button type="button" className={styles.btnPrimary}>
              Start spraying <ArrowRight size={16} />
            </button>
            <button type="button" className={styles.btnGhost}>
              <PlayCircle size={16} /> Join a live room
            </button>
          </div>

          <div className={styles.statsRow}>
            <Stat
              icon={<Coins size={14} />}
              value="102K"
              label="Tokens sprayed"
            />
            <div className={styles.divider} />
            <Stat icon={<Users size={14} />} value="25" label="Live rooms" />
            <div className={styles.divider} />
            <Stat icon={<Globe2 size={14} />} value="2" label="Countries" />
          </div>
        </div>

        <div className={styles.cardStack}>
          <div className={styles.glow} />
          <div className={styles.heroImageWrap}>
            {<Image
              src={heroImgLight}
              alt="Wedding guests spraying gold tokens at a celebration"
              width={500}
              height={500}
              priority
              unoptimized
              className={styles.heroImage}
            />}
          </div>
          {/*<LiveRoomCard />*/}
          {/*<TokenSprayCard />*/}
          <FeatureStrip />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className={styles.statValue}>
        <span className={styles.statIcon}>{icon}</span>
        {value}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}
