"use client";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Copy,
  Gift,
  Play,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import { EventStatus, type IEvent } from "@/services/Event/Event.dto";
import { useEvent } from "../../../hooks/useEvents";
import s from "./EventDetail.module.scss";

interface EventDetailProps {
  event: IEvent;
  onBack?: () => void;
  onActivate?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onOpenGiftRoom?: (id: string) => void;
}

// ── Cancel sheet ──────────────────────────────────────────────────────────────

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
    <div
      className={s.sheetOverlay}
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onDismiss();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className={s.sheet}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
          }
        }}
        role="button"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.sheetHandle} />
        <div className={s.sheetIcon}>🚫</div>
        <p className={s.sheetTitle}>Cancel event?</p>
        <p className={s.sheetSub}>
          This will cancel{" "}
          <strong style={{ color: "inherit" }}>{eventTitle}</strong> and notify
          all registered guests.
        </p>

        <div className={s.sheetWarn}>
          <AlertTriangle size={14} className={s.warnIcon} />
          <p className={s.warnText}>
            <strong>This action is irreversible.</strong> All RSVPs will be
            voided and the event will be permanently marked as cancelled.
          </p>
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
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EventDetail({ event }: EventDetailProps) {
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
      if (!token) return null;
      await eventHook.activateEvent(event.id, token);
      setStatus(EventStatus.ACTIVE);
    } finally {
      setActivating(false);
    }
  }, [isDraft, event.id, eventHook]);

  /*  const handleConfirmCancel = useCallback(async () => {
      const token = await getTokenClient();
      if (!token) return null;
      setStatus(EventStatus.CANCELLED);
      setShowCancel(false);
    }, [event.id]);
    */

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(event.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [event.slug]);

  return (
    <>
      <div className={s.page}>
        {/* Cover */}
        <div className={`${s.cover} ${isInactive ? s.coverMuted : ""}`}>
          {
            <button
              type="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.back;
                }
              }}
              className={s.coverBack}
              onClick={() => router.back}
              aria-label="Go back"
            >
              <ChevronLeft />
            </button>
          }
        </div>

        {/* Body */}
        <div className={s.body}>
          <h1 className={s.detTitle}>{event.title}</h1>

          <div className={s.badges}>
            <span className={`${s.badge} ${s[`badge${capitalize(status)}`]}`}>
              {status}
            </span>
            <span className={`${s.badge} ${s.badgeType}`}>{event.type}</span>
            <span className={`${s.badge} ${s.badgeSlug}`}>{event.slug}</span>
          </div>

          {/* Join code */}
          <div className={s.infoCard}>
            <div className={s.joinRow}>
              <span className={s.infoKey}>Join code</span>
              <div className={s.joinRight}>
                <span className={s.joinCode}>{event.slug}</span>
                <button
                  type="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCopy;
                    }
                  }}
                  className={`${s.copyBtn} ${copied ? s.copyBtnCopied : ""}`}
                  onClick={handleCopy}
                  aria-label="Copy join code"
                >
                  {copied ? (
                    <>
                      <Check size={11} /> copied
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={s.actions}>
          {isDraft && (
            <button
              type="button"
              className={s.btnPrimary}
              onClick={handleActivate}
              disabled={activating}
            >
              <Play size={14} />
              {activating ? "Activating…" : "Activate event"}
            </button>
          )}

          {isLive && (
            <button
              type="button"
              className={`${s.btnPrimary} ${s.btnPrimaryActive}`}
              disabled
            >
              <Check size={14} /> Event is live
            </button>
          )}

          {!isInactive && (
            <button
              type="button"
              className={s.btnGift}
              onClick={() => router.push(`/gift-room/${event.id}`)}
            >
              <Gift size={14} /> Open gift room
            </button>
          )}

          {!isInactive && (
            <button
              type="button"
              className={s.btnCancel}
              onClick={() => setShowCancel(true)}
            >
              <X size={14} /> Cancel event
            </button>
          )}

          {isCancelled && (
            <button type="button" className={s.btnCancel} disabled>
              <X size={14} /> Event cancelled
            </button>
          )}
        </div>
      </div>

      {showCancelSheet && (
        <CancelSheet
          eventTitle={event.title}
          onConfirm={() => {}}
          onDismiss={() => setShowCancel(false)}
        />
      )}
    </>
  );
}
