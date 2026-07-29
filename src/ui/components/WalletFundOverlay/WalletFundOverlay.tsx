"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@/hooks/useWallets";
import BackButton from "../BackButton/BackButton";
import { TOKEN_PACKAGES } from "./constants";
import styles from "./walletFundOverlay.module.scss";

export default function WalletFundOverlay({
  balance,
  closeWalletOverlay,
}: {
  balance: number;
  closeWalletOverlay?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const wallet = useWallet();
  const [topUpAmount, setTopUpAmount] = useState(0);
  const router = useRouter();

  const creditWallet = async () => {
    try {
      const reference = crypto.randomUUID();
      const result = await wallet.credit({ amount: topUpAmount, reference });
      wallet.setBalance(result.balance);
      return balance;
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div
      className={styles.portal}
      onClick={closeWalletOverlay}
      role="button"
      aria-pressed="false"
      tabIndex={0}
      onKeyDown={closeWalletOverlay}
    >
      <div
        className={styles.tabContent}
        onClick={(e) => e.stopPropagation()}
        role="button"
        aria-pressed="false"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
      >
        {" "}
        <div className={styles.backBtn}>
          <BackButton onClick={() => router.back()}></BackButton>
        </div>
        <div className={styles.walCard}>
          <p className={styles.walLabel}>Token balance</p>
          <p className={styles.walBal}>{wallet.balance}</p>
          <p className={styles.walSub}>
            1 token = ₦10 · ≈ ₦{(balance * 10).toLocaleString()}
          </p>
        </div>
        <p className={styles.pkgLabel}>Top up tokens</p>
        <div className={styles.pkgGrid}>
          {TOKEN_PACKAGES.map(({ naira, tokens, featured }) => (
            <button
              type="button"
              key={naira}
              className={`${styles.pkg} ${featured ? styles.pkgFeat : ""}`}
              onClick={() => setTopUpAmount(tokens)}
            >
              <span className={styles.pkgNaira}>₦{naira.toLocaleString()}</span>
              <span className={styles.pkgTokens}>
                {tokens} tokens{featured ? " ✦" : ""}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.pkgCtas}>
          <button type="button" className={styles.cta} onClick={creditWallet}>
            Fund Wallet
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
