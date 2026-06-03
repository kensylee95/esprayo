"use client";

import { useAnimate } from "framer-motion";
import { useEffect, useRef } from "react";

interface AmountCounterProps {
  amount: number;
  mints: number;
}

function AnimatedValue({
  value,
  format,
  fontSize,
}: {
  value: number;
  format: (v: number) => string;
  fontSize: string;
}) {
  const [scope, animate] = useAnimate();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    animate(
      scope.current,
      { opacity: [0, 1], y: [-6, 0] },
      { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
    );
  }, [value, animate]);

  return (
    <span
      ref={scope}
      style={{
        display: "block",
        color: "#F0D080",
        fontWeight: 700,
        fontSize,
        letterSpacing: "-0.02em",
        textShadow: "0 0 24px rgba(201,168,76,0.55)",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {format(value)}
    </span>
  );
}

/* ───────────── Responsive tokens ───────────── */
const TOP_OFFSET = "clamp(12px, 3vw, 28px)";
const LABEL_SIZE = "clamp(8px, 2.2vw, 10px)";
const VALUE_SIZE = "clamp(14px, 4.2vw, 22px)";

const PADDING_X = "clamp(10px, 3.5vw, 22px)";
const PADDING_Y = "clamp(5px, 1.5vw, 7px)";
const GAP = "clamp(2px, 0.8vw, 4px)";

const counterBox: React.CSSProperties = {
  padding: `${PADDING_Y} ${PADDING_X}`,
  borderRadius: 999,
  background: "rgba(201,168,76,0.07)",
  border: "1px solid rgba(201,168,76,0.22)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  maxWidth: "90vw",
};

const label: React.CSSProperties = {
  fontSize: LABEL_SIZE,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(201,168,76,0.55)",
  fontWeight: 400,
  whiteSpace: "nowrap",
};

export default function AmountCounter({ amount, mints }: AmountCounterProps) {
  return (
    <>
      {/* ── Center: Remaining Amount ── */}
      <div
        style={{
          position: "absolute",
          top: TOP_OFFSET,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: GAP,
          maxWidth: "92vw",
        }}
      >
        <span style={label}>Remaining</span>

        <div style={counterBox}>
          <AnimatedValue
            value={amount}
            fontSize={VALUE_SIZE}
            format={(v) => `₦${v.toLocaleString()}`}
          />
        </div>
      </div>

      {/* ── Top-left: Remaining Mints ── */}
      <div
        style={{
          position: "absolute",
          top: TOP_OFFSET,
          left: "clamp(10px, 3vw, 20px)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: GAP,
          maxWidth: "45vw",
        }}
      >
        <span style={label}>Remaining Mints</span>

        <div style={counterBox}>
          <AnimatedValue value={mints} fontSize={VALUE_SIZE} format={String} />
        </div>
      </div>
    </>
  );
}
