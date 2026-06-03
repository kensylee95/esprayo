"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTokenClient } from "@/helpers/request";
import { useGiftSender } from "@/hooks/useSendGift";
import { useWallet } from "@/hooks/useWallets";
import BackButton from "@/ui/components/BackButton/BackButton";
import WalletFundOverlay from "@/ui/components/WalletFundOverlay/WalletFundOverlay";
import { useGiftRoom } from "../../../../hooks/useGiftRoom";
import NavButton from "../NavButton/NavButton";
//import { playNumber1Sound } from "./audio";
//import { triggerNumber1Burst } from "./confetti";
import type { Overlay } from "./GiftRoom.dto";
import styles from "./GiftRoom.module.scss";
import LeaderboardTab from "./LeaderboardTab";
//import SprayTab from "./SprayTab/SprayTab";
import NairaWidget from "./naira-hand";
import type { NoteValue } from "./naira-hand/types";
import SprayButton from "./SprayButton/SprayButton";

const giftWorker =
  typeof window !== "undefined"
    ? new Worker(new URL("./workers/giftWorker.ts", import.meta.url), {
        type: "module",
      })
    : null;

export default function GiftRoomPage({
  eventData,
}: {
  eventData: { eventName: string; eventId: string };
}) {
  const router = useRouter();
  const { eventId } = eventData;
  const wallet = useWallet();

  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Overlay | null>(null);
  const [displayName] = useState("Chief Okafor");

  const [streak, setStreak] = useState(0);
  const streakTimerRef = useRef<NodeJS.Timeout>(undefined);
  const streakCountRef = useRef(0);
  const streakFlushRef = useRef(false);
  const flushHandlerRef =
    useRef<(amount: number, noteValue: number) => void>(undefined);
  flushHandlerRef.current = (amount: number, noteValue: number) => {
    sendGift({
      eventId,
      amount,
      displayName,
      denomination: noteValue as NoteValue,
    }).catch(() => {
      wallet.setBalance((prev) => (prev ?? 0) + amount);
    });
  };
  useEffect(() => {
    if (!giftWorker) return;
    giftWorker.onmessage = (e) => {
      if (e.data.type === "flush") {
        flushHandlerRef.current?.(e.data.amount, e.data.noteValue);
      }
    };
  }, []); // ← empty deps, runs once

  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);

  const initialBalanceRef = useRef<number | null>(null);
  if (initialBalanceRef.current === null && wallet.balance != null) {
    initialBalanceRef.current = wallet.balance;
  }

  const { leaderboard, stats, roomError, liveAlert, rivalryAlert } =
    useGiftRoom(token, eventId);

  const { sendGift } = useGiftSender(token);

  // Init worker once
  const giftWorkerRef = useRef<Worker | null>(null);
  const pendingDebitRef = useRef(0); // track optimistic debit for rollback

  const balanceFlushRef = useRef(false);

  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/giftWorker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e) => {
      if (e.data.type === "flush") {
        // network call on main thread but only fires once per 300ms pause
        sendGift({
          eventId,
          amount: e.data.amount,
          displayName,
          denomination: e.data.noteValue,
        }).catch(() => {
          // rollback optimistic debit on failure
          wallet.setBalance((prev) => (prev ?? 0) + pendingDebitRef.current);
          pendingDebitRef.current = 0;
        });
        pendingDebitRef.current = 0;
      }
    };

    giftWorkerRef.current = worker;
    return () => worker.terminate();
  }, [eventId, displayName, sendGift, wallet]);

  const handleSend = useCallback(
    (noteValue: NoteValue, numberSent: number, _remainingAmount: number) => {
      const debit = noteValue * numberSent;

      pendingDebitRef.current += debit;

      if (!balanceFlushRef.current) {
        balanceFlushRef.current = true;
        requestAnimationFrame(() => {
          wallet.setBalance((prev) => (prev ?? 0) - pendingDebitRef.current);
          pendingDebitRef.current = 0;
          balanceFlushRef.current = false;
        });
      }

      giftWorker?.postMessage({
        type: "spray",
        data: { noteValue, numberSent },
      });

      streakCountRef.current += 1;
      clearTimeout(streakTimerRef.current);
      streakTimerRef.current = setTimeout(() => {
        setStreak(0);
        streakCountRef.current = 0;
      }, 5000);

      if (!streakFlushRef.current) {
        streakFlushRef.current = true;
        requestAnimationFrame(() => {
          setStreak(streakCountRef.current);
          streakFlushRef.current = false;
        });
      }

      if (streakCountRef.current % 3 === 1) {
        navigator.vibrate?.(40);
      }
    },
    [wallet],
  );

  if (roomError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>{roomError}</p>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.push("/home")}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.roomHeader}>
        <BackButton onClick={() => router.push("/home")} />
        <div className={styles.roomInfo}>
          <p className={styles.roomTitle}>{stats.eventTitle}</p>
        </div>
        <AnimatePresence>
          {streak > 1 && (
            <motion.span
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={styles.streakBadge}
            >
              🔥 x{streak}
            </motion.span>
          )}
        </AnimatePresence>
        <span className={styles.liveBadge}>● LIVE</span>
      </header>
      <AnimatePresence>
        {liveAlert && (
          <motion.div
            className={styles.liveAlert}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {liveAlert}
          </motion.div>
        )}
      </AnimatePresence>

      <LeaderboardTab entries={leaderboard} stats={stats} />

      {/* tab === "spray" && (
        <SprayTab
          walletBalance={wallet.balance ?? 0}
          onSend={handleSend}
          onRecharge={() => {
            setTab(null);
            router.push("/wallet/fund");
          }}
          closeSprayOverlay={() => setTab(null)}
          streak={streak}
        />
      )*/}

      <AnimatePresence>
        {tab === "spray" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.sprayOverlay}
          >
            <NairaWidget
              totalAmount={initialBalanceRef.current ?? 0}
              noteValue={1_000}
              visibleStack={5}
              onSprayReset={() => {
                router.push("/wallet/fund");
              }}
              onGift={handleSend}
              onComplete={() => {
                //handleSend
                console.log("spraying completed");
              }}
            />

            <button
              type="button"
              className={styles.closeSpray}
              onClick={() => setTab(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === "wallet" && (
        <WalletFundOverlay
          closeWalletOverlay={() => setTab(null)}
          balance={wallet.balance ?? 0}
        />
      )}

      <AnimatePresence>
        {rivalryAlert && (
          <motion.div
            className={styles.rivalryToast}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {rivalryAlert}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={styles.roomNav}>
        <div className={styles.roomNav}>
          <NavButton
            icon={Trophy}
            label="Top"
            active={false}
            onClick={() => {}}
          />
          <SprayButton active={false} onClick={() => setTab("spray")} />
          <NavButton
            icon={Wallet}
            label="Wallet"
            active={tab === "wallet"}
            onClick={() => router.push("/wallet/fund")}
          />
        </div>
      </nav>
    </div>
  );
}
