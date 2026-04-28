"use client";
import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DmMono, outfit } from "@/font";
import { useGoogleAuth } from "@/hooks/useGoogeAuth";
import { NumericKeyboard } from "../NumericKeypad/NumericKeypad";
import styles from "./Login.module.scss";

export default function SerenadeLogin() {
  const { handleGoogleCredential } = useGoogleAuth();
  const [showKeyBoard, setShowKeyboard] = useState(false);
  const router = useRouter();

  const [phone, setPhone] = useState("0812129877");

  const digits = phone.replace(/\D/g, "");
  const handleGoogleLogin = async (res: CredentialResponse) => {
    try {
      if (!res.credential) return;
      await handleGoogleCredential(res.credential);
      router.push("/home");
    } catch (e) {
      console.log(e);
    }
  };
  const onKeyPress = (key: string) => {
    if (key === "⌫") {
      setPhone((v) => v.slice(0, -1));
      return;
    }

    if (digits.length >= 10) return;

    const raw = (digits + key).slice(0, 10);

    const grouped = raw.replace(/(\d{4})(\d{3})(\d{0,3})/, (_, a, b, c) =>
      `${a} ${b} ${c}`.trim(),
    );

    setPhone(grouped);
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.wrapper}>
        {/*<div className={styles.brand}>SprayIt</div>*/}

        <h1 className={styles.title}>Welcome. Enter your number.</h1>

        <p className={`${styles.subtitle} ${outfit.className}`}>
          We'll send a one-time code to verify your identity
        </p>

        <label
          htmlFor="mobile number"
          className={`${styles.label} ${outfit.className}`}
        >
          Mobile number
        </label>

        <div className={`${styles.numDisplay} ${outfit.className}`}>
          <span>🇳🇬</span>
          <span className={`${styles.code} ${DmMono.className}`}>+234</span>

          <button
            type="button"
            onClick={() => setShowKeyboard(true)}
            className={`${styles.value} ${DmMono.className}`}
          >
            {phone}
            <span className={styles.cursor} />
          </button>
        </div>

        <button type="button" className={styles.cta}>
          Send verification code
        </button>
        <span className={`${styles.or} ${DmMono.className}`}>
          or continue with
        </span>
        <div
          style={{ position: "relative", width: "100%", marginBottom: "14px" }}
        >
          <button type="button" className={styles.ctaGoogle}>
            Continue with Google
          </button>
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              overflow: "hidden",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {}}
              width="500"
            />
          </div>
        </div>
      </div>
      {showKeyBoard && (
        <div className={styles.numpad}>
          <NumericKeyboard
            onClose={() => setShowKeyboard(false)}
            onKeyPress={onKeyPress}
          />
        </div>
      )}
    </div>
  );
}
