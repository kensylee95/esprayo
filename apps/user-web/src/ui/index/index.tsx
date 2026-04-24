import { CTA } from "../components/CTA/CTA";
import { Features } from "../components/Features/Features";
import { Footer } from "../components/Footer/Footer";
import { Header } from "../components/Header/Header";
import { Hero } from "../components/Hero/Hero";
import { HowItWorks } from "../components/HowItWorks/HowItWorks";
import { LiveMoment } from "../components/LiveMoment/LiveMoment";
import styles from "./index.module.scss";

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
