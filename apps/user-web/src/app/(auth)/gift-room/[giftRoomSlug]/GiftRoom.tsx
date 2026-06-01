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
import SprayButton from "./SprayButton/SprayButton";

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

  const handleSend = useCallback(
    async (noteValue: number, numberSent: number, remainingAmount: number) => {
      try {
        navigator.vibrate?.(80);

        // optimistic debit
        wallet.setBalance((prev) => (prev ?? 0) - noteValue);

        sendGift({
          eventId,
          amount: noteValue*numberSent,
          displayName,
        });

        navigator.vibrate?.([100, 50, 100, 50, 200]);

        clearTimeout(streakTimerRef.current);

        setStreak((s) => s + 1);

        streakTimerRef.current = setTimeout(() => setStreak(0), 5000);

        // optional analytics
        console.log({
          noteValue,
          remainingAmount,
        });
      } catch (error) {
        wallet.setBalance((prev) => (prev ?? 0) + noteValue);

        console.error(error);
      }
    },
    [sendGift, eventId, displayName, wallet],
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
