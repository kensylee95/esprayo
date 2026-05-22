import { Shield, Smartphone, Zap } from "lucide-react";
import styles from "./FeatureStrip.module.scss";

const features = [
  { icon: <Zap size={14} />, label: "Instant Sprays" },
  { icon: <Shield size={14} />, label: "Secure payments" },
  { icon: <Smartphone size={14} />, label: "Any device" },
];

export function FeatureStrip() {
  return (
    <div className={styles.strip}>
      {features.map(({ icon, label }) => (
        <div key={label} className={styles.item}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}