"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Copy,
  Gift,
  MapPin,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import { EventStatus, type IEvent } from "@/services/Event/Event.dto";
import { useEvent } from "../../../../../../hooks/useEvents";
import s from "./EventDetail.module.scss";

interface CancelSheetProps {
  eventTitle: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

function CancelSheet({ eventTitle, onConfirm, onDismiss }: CancelSheetProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={s.sheetOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <motion.div
        className={s.sheet}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.sheetHandle} />

        <div className={s.sheetIconWrap}>
          <X size={22} className={s.sheetIconSvg} />
        </div>

        <p className={s.sheetTitle}>Cancel this event?</p>
        <p className={s.sheetSub}>
          <strong>{eventTitle}</strong> will be permanently cancelled. All RSVPs
          will be voided.
        </p>

        <div className={s.sheetWarn}>
          <AlertTriangle size={13} className={s.warnIcon} />
          <p className={s.warnText}>This action cannot be undone.</p>
        </div>

        <button
          type="button"
          className={s.btnConfirmCancel}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Cancelling…" : "Yes, cancel event"}
        </button>
        <button
          type="button"
          className={s.btnKeep}
          onClick={onDismiss}
          disabled={loading}
        >
          Keep event
        </button>
      </motion.div>
    </motion.div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function EventDetail({ event }: { event: IEvent }) {
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [showCancelSheet, setShowCancel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const router = useRouter();

  const isDraft = status === "draft";
  const isLive = status === "active";
  const isCancelled = status === "cancelled";
  const isEnded = status === "ended";
  const isInactive = isCancelled || isEnded;
  const eventHook = useEvent();

  const handleActivate = useCallback(async () => {
    if (!isDraft) return;
    setActivating(true);
    try {
      const token = await getTokenClient();
      if (!token) return;
      await eventHook.activateEvent(event.id, token);
      setStatus(EventStatus.ACTIVE);
    } finally {
      setActivating(false);
    }
  }, [isDraft, event.id, eventHook]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(event.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event.slug]);

  return (
    <>
      <motion.div
        className={s.page}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Cover hero ── */}
        <div className={`${s.cover} ${isInactive ? s.coverMuted : ""}`}>
          {event.coverImageUrl ? (
            <Image
              width={1024}
              height={1024}
              src={event.coverImageUrl}
              alt={event.title}
              className={s.coverImg}
            />
          ) : (
            <div className={s.coverPlaceholder}>
              <div className={s.coverOrb} />
            </div>
          )}

          {/* overlay gradient */}
          <div className={s.coverGradient} />

          {/* back button */}
          <button
            type="button"
            className={s.coverBack}
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ChevronLeft size={18} />
          </button>

          {/* status pill on cover */}
          <div className={s.coverStatus}>
            <span
              className={`${s.statusDot} ${s[`dot${capitalize(status)}`]}`}
            />
            <span className={s.statusText}>{capitalize(status)}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <motion.div
          className={s.body}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* title + type */}
          <div className={s.titleRow}>
            <h1 className={s.title}>{event.title.toUpperCase()}</h1>
            <span className={s.typePill}>{event.type}</span>
          </div>

          {/* meta row */}
          <div className={s.metaRow}>
            {event.venue && (
              <span className={s.metaItem}>
                <MapPin size={12} className={s.metaIcon} />
                {event.venue}
              </span>
            )}
            {/*<span className={s.metaItem}>
              <Calendar size={12} className={s.metaIcon} />
              {new Date(event.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>*/}
          </div>

          {/* join code card */}
          <div className={s.codeCard}>
            <div className={s.codeCardLeft}>
              <p className={s.codeLabel}>Event code</p>
              <p className={s.codeValue}>{event.slug}</p>
            </div>
            <motion.button
              type="button"
              className={`${s.copyBtn} ${copied ? s.copyBtnDone : ""}`}
              onClick={handleCopy}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label="Copy event code"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="check"
                    className={s.copyInner}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check size={13} />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    className={s.copyInner}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy size={13} />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* welcome message */}
          {event.welcomeMessage && (
            <p className={s.welcome}>{event.welcomeMessage}</p>
          )}
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          className={s.actions}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {isDraft && (
            <motion.button
              type="button"
              className={s.btnPrimary}
              onClick={handleActivate}
              disabled={activating}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {activating ? (
                <span className={s.btnInner}>
                  <span className={s.spinnerDot} />
                  Activating…
                </span>
              ) : (
                <span className={s.btnInner}>
                  <Zap size={15} strokeWidth={1.5} />
                  Activate event
                </span>
              )}
            </motion.button>
          )}

          {isLive && (
            <div className={s.btnLive}>
              <Check size={14} strokeWidth={2} />
              Event is live
            </div>
          )}

          {!isInactive && (
            <motion.button
              type="button"
              className={s.btnGift}
              onClick={() => router.push(`/gift-room/${event.id}`)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Gift size={15} strokeWidth={1.5} />
              Open gift room
            </motion.button>
          )}

          {!isInactive && (
            <button
              type="button"
              className={s.btnCancel}
              onClick={() => setShowCancel(true)}
            >
              <X size={14} />
              Cancel event
            </button>
          )}

          {isCancelled && (
            <div className={s.btnCancelledStatic}>
              <X size={14} /> Event cancelled
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showCancelSheet && (
          <CancelSheet
            eventTitle={event.title.toUpperCase()}
            onConfirm={() => {}}
            onDismiss={() => setShowCancel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
