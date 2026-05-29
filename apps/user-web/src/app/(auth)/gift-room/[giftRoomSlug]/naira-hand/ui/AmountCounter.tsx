"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AmountCounterProps {
  amount: number;
  mints: number;
}

export default function AmountCounter({ amount, mints }: AmountCounterProps) {
  return (
    <>
      {/* ── Centre: remaining amount ── */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(201,168,76,0.55)",
            fontWeight: 400,
          }}
        >
          Remaining
        </span>
        <div
          style={{
            padding: "7px 22px",
            borderRadius: 40,
            background: "rgba(201,168,76,0.07)",
            border: "1px solid rgba(201,168,76,0.22)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={amount}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: "block",
                color: "#F0D080",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: "-0.02em",
                textShadow: "0 0 24px rgba(201,168,76,0.55)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ₦{amount.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Top-left: remaining mints ── */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 20,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(201,168,76,0.55)",
            fontWeight: 400,
          }}
        >
          Remaining Mints
        </span>
        <div
          style={{
            padding: "7px 22px",
            borderRadius: 40,
            background: "rgba(201,168,76,0.07)",
            border: "1px solid rgba(201,168,76,0.22)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={mints}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{
                display: "block",
                color: "#F0D080",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: "-0.02em",
                textShadow: "0 0 24px rgba(201,168,76,0.55)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {mints}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
