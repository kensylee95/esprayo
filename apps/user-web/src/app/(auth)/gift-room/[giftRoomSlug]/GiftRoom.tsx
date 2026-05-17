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
import NavButton from "../NavButton/NavButton";
import { playNumber1Sound } from "./audio";
import { triggerNumber1Burst } from "./confetti";
import type { GiftItem, Overlay } from "./GiftRoom.dto";
import styles from "./GiftRoom.module.scss";
import { useGiftRoom } from "./hooks/useGiftRoom";
import LeaderboardTab from "./LeaderboardTab";
import SprayButton from "./SprayButton/SprayButton";
import SprayTab from "./SprayTab/SprayTab";

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
  /*const [sentGift, setSentGift] = useState<{
    gift: GiftItem;
    newRank: number;
    rankDiff: number;
    isNumber1: boolean;
  } | null>(null);
   */
  const [streak, setStreak] = useState(0);
  //const [showNumber1, setShowNumber1] = useState(false);

  // const prevRankRef = useRef<number | null>(null);
  const streakTimerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    getTokenClient().then(setToken);
  }, []);

  const { leaderboard, stats, roomError, liveAlert, rivalryAlert, getAudio } =
    useGiftRoom(token, eventId);

  const { sendGift, isSending } = useGiftSender(token);

  const handleSend = useCallback(
    async (gift: GiftItem) => {
      try {
        navigator.vibrate?.(80);
        const ctx = getAudio();

        // optimistic debit — no await needed
        wallet.setBalance((prev) => (prev ?? 0) - gift.tokens);

        sendGift({ eventId, giftId: gift.id, displayName });

        triggerNumber1Burst();
        if (ctx) playNumber1Sound(ctx);
        navigator.vibrate?.([100, 50, 100, 50, 200]);

        clearTimeout(streakTimerRef.current);
        setStreak((s) => s + 1);
        streakTimerRef.current = setTimeout(() => setStreak(0), 5000);
      } catch (error) {
        // roll back if sendGift throws synchronously
        wallet.setBalance((prev) => (prev ?? 0) + gift.tokens);
        console.error(error);
      }
    },
    [sendGift, eventId, displayName, wallet, getAudio],
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

      {tab === "spray" && (
        <SprayTab
          walletBalance={wallet.balance ?? 0}
          onSend={handleSend}
          isSending={isSending}
          onRecharge={() => {
            setTab(null);
            router.push("/wallet/fund");
          }}
          closeSprayOverlay={() => setTab(null)}
          streak={streak}
        />
      )}

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
