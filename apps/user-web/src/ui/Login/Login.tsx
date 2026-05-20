"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { DmMono, outfit } from "@/font";
import { getTokenClient } from "@/helpers/request";
import authService from "@/services/Auth/Auth";
import NigeriaFlag from "./assets/flag-of-nigeria.webp";
import styles from "./Login.module.scss";

export default function SerenadeLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // -----------------------------
  // PHONE INPUT (CLEAN ONLY NUMBERS)
  // -----------------------------
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);

    if (phoneError) setPhoneError(null);
  };

  // -----------------------------
  // SEND OTP
  // -----------------------------
  const sendOtp = async () => {
    try {
      const digits = phone.replace(/\D/g, "");

      if (digits.length < 10) {
        setPhoneError("Please enter a valid 10-digit phone number");
        return;
      }

      setPhoneError(null); // clear error on success path

      setLoading(true);

      const token = await getTokenClient();
      if (!token) return;

      const service = authService(token);

      await service.sendPhoneOtp({
        phoneNumber: `+234${digits}`,
      });

      router.push("/verify-otp");
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setPhoneError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // GOOGLE LOGIN HANDLER
  // -----------------------------
  const loginWithGoogle = () => {
    setLoading(true);
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const redirectUri = `${backendUrl}/${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL}`;

    const scope = ["openid", "email", "profile"].join(" ");

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = url;
    setLoading(false);
  };

  return (
    <div className={styles.loginScreen}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Welcome. Enter your number.</h1>

        <p className={`${styles.subtitle} ${outfit.className}`}>
          We'll send a one-time code to verify your identity
        </p>

        <label
          htmlFor="mobile"
          className={`${styles.label} ${outfit.className}`}
        >
          Mobile number
        </label>

        {/* -----------------------------
            PHONE INPUT ROW
        ------------------------------ */}
        <div
          className={`${styles.numDisplay}  ${phoneError ? styles.inputError : ""} ${outfit.className}`}
        >
          <span className={styles.flag}>
            <Image src={NigeriaFlag} alt="NG" width={22} height={22} />
          </span>

          <span className={`${styles.code} ${DmMono.className}`}>+234</span>

          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="9061892234"
            className={`${styles.input} ${DmMono.className}`}
          />
        </div>
        {phoneError && <p className={styles.errorText}>{phoneError}</p>}

        {/* -----------------------------
            SEND OTP BUTTON
        ------------------------------ */}
        <button
          type="button"
          onClick={sendOtp}
          className={styles.cta}
          disabled={loading || phone.length !== 10}
        >
          {loading ? "Sending..." : "Send verification code"}
        </button>

        <span className={`${styles.or} ${DmMono.className}`}>
          or continue with
        </span>

        {/* -----------------------------
            GOOGLE LOGIN
        ------------------------------ */}
        <div style={{ position: "relative", width: "100%" }}>
          <button
            disabled={loading}
            type="button"
            className={styles.ctaGoogle}
            onClick={loginWithGoogle}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
