"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function GoldBurstIcon({
  size = "clamp(40px,4vw,72px)",
}: {
  size?: number | string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <DotLottieReact src="/assets/lottie/gold-badge.lottie" autoplay loop />
    </div>
  );
}
