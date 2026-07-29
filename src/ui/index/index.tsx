import { CTA } from "./CTA/CTA";
import { Features } from "./Features/Features";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";
import { Hero } from "./Hero/Hero";
import { HowItWorks } from "./HowItWorks/HowItWorks";
import styles from "./index.module.scss";
import { LiveMoment } from "./LiveMoment/LiveMoment";

export default function Index() {
  return (
    <div className={styles.page}>
      <Header />
      <main>
        <Hero />
        <Features />
        <LiveMoment />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
