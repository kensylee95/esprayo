"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";
import { getTokenClient } from "@/helpers/request";
import eventService from "@/services/Event/Event";
import { EventStatus } from "@/services/Event/Event.dto";
import BackButton from "@/ui/components/BackButton/BackButton";
import styles from "./join.module.scss";

// ─── Constants ────────────────────────────────────────────────────────────────

const CODE_LENGTH = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventPreview {
  id: string;
  initial: string;
  coverImageUrl?: string;
  title: string;
  sub: string;
  status: "live" | "draft";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JoinEventPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [preview, setPreview] = useState<EventPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Lookup ──────────────────────────────────────────────────────────────────

  async function lookupCode(fullCode: string) {
    if (fullCode.length !== CODE_LENGTH) return;
    const token = await getTokenClient();
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const service = eventService(token);
      const event = await service.getBySlug(fullCode);

      setPreview({
        id: event.id,
        initial: event.title.trim().charAt(0).toUpperCase(),
        coverImageUrl: event.coverImageUrl ?? undefined,
        title: event.title,
        sub: `${event.gifterCount} ${event.gifterCount === 1 ? "guest" : "guests"}`,
        status: event.status === EventStatus.ACTIVE ? "live" : "draft",
      });

      service.saveRecentEventId(event.id);
      inputRefs.current.forEach((el) => {
        el?.blur();
      });
    } catch (e) {
      console.log(e);
      setPreview(null);
      setError("No event found with that code. Check and try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Input handlers ──────────────────────────────────────────────────────────

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

    if (next.every(Boolean)) {
      lookupCode(next.join(""));
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
    router.push(`/gift-room/${preview.id}/name-screen`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* Decorative rings */}
      <div className={styles.orb} aria-hidden="true" />

      {/* Back */}
      <div className={styles.alignButton}>
        <BackButton onClick={() => router.back()} />
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <h1 className={styles.title}>
          Join a <span className={styles.titleAccent}>gift</span>
          <br />
          room.
        </h1>
        <p className={styles.sub}>
          Enter the 5-character code or scan the QR at the venue
        </p>
      </div>

      {/* Code entry */}
      <div className={styles.codeCard}>
        <label htmlFor="join code" className={styles.codeLabel}>
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

      {/* Event preview — animates in on match */}
      {preview && (
        <div className={styles.preview}>
          {/* Cover image or initial fallback */}
          {preview.coverImageUrl ? (
            <Image
              src={preview.coverImageUrl}
              alt={preview.title}
              className={styles.previewCover}
            />
          ) : (
            <div className={styles.previewCoverFallback} aria-hidden="true">
              <span className={styles.previewCoverInitial}>
                {preview.initial}
              </span>
            </div>
          )}

          {/* Info bar with inline CTA */}
          <div className={styles.previewBody}>
            <div className={styles.previewInfo}>
              <p className={styles.previewTitle}>
                {preview.title.toUpperCase()}
              </p>
              <p className={styles.previewSub}>Found · {preview.sub}</p>
            </div>
            <div className={styles.previewActions}>
              {preview.status === "live" && (
                <span className={styles.liveBadge}>
                  <span className={styles.liveBadgeDot} aria-hidden="true" />
                  LIVE
                </span>
              )}
              <button
                type="button"
                className={styles.ctaInline}
                onClick={handleEnter}
                disabled={loading}
              >
                {loading ? "…" : "Enter →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ghost CTA — keeps layout stable before event is found */}
      {!preview && (
        <div className={styles.ctaWrap}>
          <button type="button" className={styles.cta} disabled>
            Enter gift room
          </button>
        </div>
      )}
    </div>
  );
}
