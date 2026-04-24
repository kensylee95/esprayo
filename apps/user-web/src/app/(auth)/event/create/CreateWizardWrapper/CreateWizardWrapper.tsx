"use client";
import { ArrowBigLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { useWizardStore } from "@/stores/create-event-stores/useWizardStore";
import styles from "./CreateWizardWrapper.module.scss";

type WizardProps = {
  children: React.ReactNode;
};

export function Wizard({ children }: WizardProps) {
  const step = useWizardStore((s) => s.step);
  const router = useRouter();
  const handleBackBtn = () => {
    if (step <= 1) return;
    router.back();
  };
  const setStep = useWizardStore((s) => s.setStep);
  useEffect(() => {
    setStep(1);
    router.push("step-1");
  }, [router.push, setStep]);

  return (
    <div className={styles.scr}>
      {/* STEP INDICATOR ONLY */}
      <div style={{ padding: "28px 22px 0 22px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 100,
                background:
                  i < step
                    ? "#C9A84C"
                    : i === step
                      ? "linear-gradient(90deg,#C9A84C,#F0D080)"
                      : "#1E1B2E",
              }}
            />
          ))}
        </div>
        <div className={styles.rowStepper}>
          <div className={styles.stepperText}>Step {step} of 3</div>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBackBtn}
              className={styles.icon}
            >
              <ArrowBigLeftIcon height={24} width={24} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }}>{children}</div>
    </div>
  );
}
