"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function AmountCounter({
  amount,
}: {
  amount: number;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={amount}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.16 }}
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "6px 18px",
            borderRadius: 40,
            background: "rgba(255,215,0,0.07)",
            border: "1px solid rgba(255,215,0,0.2)",
          }}
        >
          <span
            style={{
              color: "#FFD700",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            ₦{amount.toLocaleString()}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}