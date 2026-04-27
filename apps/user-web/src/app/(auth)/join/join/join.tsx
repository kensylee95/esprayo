"use client";

import { useRouter } from "next/navigation";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import styles from "./join.module.scss";

const CODE_LENGTH = 7;

interface EventPreview {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  status: "live" | "draft";
}

export default function JoinEventPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [preview, setPreview] = useState<EventPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  //const code = digits.join("");
  //const isComplete = code.length === CODE_LENGTH && digits.every(Boolean);

  // Simulate event lookup — replace with GET /events/join/:slug
  async function lookupCode(fullCode: string) {
    if (fullCode.length !== CODE_LENGTH) return;
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    if (fullCode.toUpperCase() === "ADC2025") {
      setPreview({
        id: "evt-123",
        emoji: "💍",
        title: "Adaeze & Chidi's Wedding",
        sub: "47 guests active",
        status: "live",
      });
    } else {
      setError("No event found with that code. Check and try again.");
      setPreview(null);
    }
    setLoading(false);
  }

  function handleDigitChange(index: number, value: string) {
    const char = value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = next.join("");
    if (full.length === CODE_LENGTH && next.every(Boolean)) {
      lookupCode(full);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
        setPreview(null);
        setError("");
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((c, i) => {
      next[i] = c;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    if (pasted.length === CODE_LENGTH) lookupCode(pasted);
  }

  function handleEnter() {
    if (!preview) return;
    router.push(`/gift-room/${preview.id}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb} aria-hidden="true" />

      <button
        type="button"
        className={styles.back}
        onClick={() => router.back()}
        aria-label="Go back"
      >
        ←
      </button>

      <div className={styles.hero}>
        <h1 className={styles.title}>
          Join a<br />
          gift room.
        </h1>
        <p className={styles.sub}>
          Enter the 7-letter code or scan the QR at the venue
        </p>
      </div>

      {/* ── Code entry ── */}
      <div className={styles.codeCard}>
        <label htmlFor="Join Code" className={styles.codeLabel}>
          Enter join code
        </label>
        <div className={styles.boxes}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              className={`${styles.box} ${digit ? styles.filled : ""} ${
                !digit && digits.slice(0, i).every(Boolean) ? styles.active : ""
              }`}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Code character ${i + 1}`}
              autoComplete="off"
              autoCapitalize="characters"
            />
          ))}
        </div>
        {loading && <p className={styles.searching}>Looking up code…</p>}
        {error && <p className={styles.errorMsg}>{error}</p>}
      </div>

      {/* ── Divider ── */}
      <div className={styles.dividerRow}>
        <div className={styles.divLine} />
        <span className={styles.divText}>or</span>
        <div className={styles.divLine} />
      </div>

      {/* ── QR zone ── */}
      <button type="button" className={styles.qrZone} aria-label="Scan QR code">
        <span className={styles.qrIcon} aria-hidden="true">
          📷
        </span>
        <span className={styles.qrTitle}>Scan QR code</span>
        <span className={styles.qrSub}>
          Point your camera at the QR at the venue
        </span>
      </button>

      {/* ── Event preview ── */}
      {preview && (
        <div className={styles.preview}>
          <span className={styles.previewEmoji} aria-hidden="true">
            {preview.emoji}
          </span>
          <div className={styles.previewInfo}>
            <p className={styles.previewTitle}>{preview.title}</p>
            <p className={styles.previewSub}>Found · {preview.sub}</p>
          </div>
          {preview.status === "live" && (
            <span className={styles.liveBadge}>● LIVE</span>
          )}
        </div>
      )}

      {/* ── CTA ── */}
      <div className={styles.ctaWrap}>
        <button
          type="button"
          className={styles.cta}
          onClick={handleEnter}
          disabled={!preview || loading}
        >
          {loading ? "Looking up…" : "Enter gift room"}
        </button>
      </div>
    </div>
  );
}
