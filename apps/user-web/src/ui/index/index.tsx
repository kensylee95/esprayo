import { Header } from "../components/Header/Header";
import { Hero } from "../components/Hero/Hero";
import styles from "./index.module.scss";

export default function Index() {
  return (
    <div className={styles.page}>
      <Header />
      <Hero />
    </div>
  );
}
