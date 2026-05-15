import confetti from "canvas-confetti";

function burst(
  count: number,
  spread: number,
  origin: { x: number; y: number },
  colors: string[],
  gravity = 1,
  scalar = 1,
) {
  confetti({
    particleCount: count,
    spread,
    origin,
    colors,
    gravity,
    scalar,
  });
}

/* ─────────────────────────────
   ✨ LUXURY GOLD PALETTE
──────────────────────────── */

const LUXURY_GOLD = ["#FFD700", "#FFDF70", "#F5C542", "#FFF4B0", "#FFFFFF"];

/* ─────────────────────────────
   🎉 BURSTS (UNIFIED LUXURY)
──────────────────────────── */

export function triggerSenderBurst() {
  burst(140, 90, { x: 0.5, y: 0.7 }, LUXURY_GOLD, 0.9, 1.4);

  setTimeout(() => {
    burst(70, 55, { x: 0.4, y: 0.7 }, LUXURY_GOLD, 1.1, 1.05);
  }, 140);
}

export function triggerNumber1Burst() {
  burst(260, 140, { x: 0.2, y: 0.5 }, LUXURY_GOLD, 0.7, 1.7);

  setTimeout(() => {
    burst(260, 140, { x: 0.8, y: 0.5 }, LUXURY_GOLD, 0.7, 1.7);
  }, 120);
}

export function triggerRoomBurst() {
  burst(40, 65, { x: Math.random() * 0.6 + 0.2, y: 0.8 }, LUXURY_GOLD, 1.2, 1);
}
