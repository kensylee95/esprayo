"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TOKEN_PACKAGES } from "./constants";
import styles from "./walletFundOverlay.module.scss";

export default function WalletFundOverlay({
  balance,
  closeWalletOverlay,
}: {
  balance: number;
  closeWalletOverlay: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
        <div className={styles.walCard}>
          <p className={styles.walLabel}>Token balance</p>
          <p className={styles.walBal}>{balance.toLocaleString()}</p>
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
              onClick={() => router.push(`/wallet/topup?amount=${naira}`)}
            >
              <span className={styles.pkgNaira}>₦{naira.toLocaleString()}</span>
              <span className={styles.pkgTokens}>
                {tokens} tokens{featured ? " ✦" : ""}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.pkgCtas}>
          <button
            type="button"
            className={styles.cta}
            onClick={() => router.push("/wallet/topup?provider=paystack")}
          >
            Fund with Paystack
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => router.push("/wallet/topup?provider=flutterwave")}
          >
            Fund with Flutterwave
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
