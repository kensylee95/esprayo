"use client";

import { useState } from "react";
import { NumericKeyboard } from "../NumericKeypad/NumericKeypad";
import styles from "./OtpVerification.module.scss";

type Props = {
  phone: string;
  onVerify?: () => void;
  onBack?: () => void;
};

export default function OTPVerification({ phone, onVerify, onBack }: Props) {
  const [otp, setOtp] = useState("");

  const onKeyPress = (key: string) => {
    if (key === "⌫") {
      setOtp((v) => v.slice(0, -1));
      return;
    }

    if (otp.length >= 6) return;

    setOtp((v) => v + key);
  };

  const isComplete = otp.length === 6;

  return (
    <div className={styles.otpScreen}>
      <button type="button" className={styles.back} onClick={onBack}>
        ←
      </button>

      <div className={styles.brand}>Serenade</div>

      <h1 className={styles.title}>
        Check your
        <br />
        messages.
      </h1>

      <p className={styles.subtitle}>
        We sent a 6-digit code to
        <br />
        <span className={styles.phone}>{phone}</span>
      </p>

      <label htmlFor="OTP" className={styles.label}>
        Verification code
      </label>

      <div className={styles.otpBoxes}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`${styles.box} ${otp[i] ? styles.filled : ""}`}
          >
            {otp[i] || ""}
          </div>
        ))}
      </div>

      <div className={styles.timer}>
        Code expires in <span>04:32</span>
      </div>

      <button
        type="button"
        className={styles.cta}
        disabled={!isComplete}
        onClick={onVerify}
      >
        Verify & continue
      </button>

      <div className={styles.resend}>
        Didn’t receive it?
        <button type="button" className={styles.resendBtn}>
          Resend code
        </button>
      </div>

      <NumericKeyboard onKeyPress={onKeyPress} />
    </div>
  );
}
