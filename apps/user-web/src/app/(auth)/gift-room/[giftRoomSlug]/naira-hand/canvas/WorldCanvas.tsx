"use client";

import { useEffect, useRef } from "react";

interface Ring {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  speed: number;
  delay: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  color: string;
  rot: number;
  rotV: number;
  symbol?: string;
}

let _uid = 0;
const uid = () => ++_uid;

/* Brand palette */
const GOLD_COLORS = [
  "#F0D080",
  "#C9A84C",
  "#FFD700",
  "#E8C547",
  "#8B6914",
  "#FAF5E4",
  "#2e7a40",
  "#1B5728", // occasional green flash
];

const SYMBOLS = ["₦", "✦", "★", "◆", "✧"];

export default function WorldCanvas({
  trigger,
  sprayOriginY = 320,
}: {
  trigger: number;
  sprayOriginY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const glowRef = useRef(0);
  const rafRef = useRef(0);
  const prevTrigger = useRef(0);

  /* Spawn FX on each spray */
  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.offsetWidth;
    const ox = W / 2;
    const oy = sprayOriginY;

    glowRef.current = 1;

    /* Two expanding gold rings */
    ringsRef.current.push(
      {
        id: uid(),
        x: ox,
        y: oy,
        r: 10,
        maxR: Math.min(W, window.innerHeight) * 0.6,
        alpha: 0.75,
        speed: 14,
        delay: 0,
      },
      {
        id: uid(),
        x: ox,
        y: oy,
        r: 5,
        maxR: Math.min(W, window.innerHeight) * 0.38,
        alpha: 0.45,
        speed: 20,
        delay: 6,
      },
    );

    /* Particles */
    const count = 12 + Math.floor(Math.random() * 7);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.2;
      const spd = 3 + Math.random() * 12;
      const isSymbol = Math.random() > 0.65;

      burstsRef.current.push({
        id: uid(),
        x: ox + (Math.random() - 0.5) * 28,
        y: oy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
        decay: 0.009 + Math.random() * 0.012,
        size: isSymbol ? 10 + Math.random() * 10 : 3 + Math.random() * 5,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        symbol: isSymbol
          ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          : undefined,
      });
    }
  }, [trigger, sprayOriginY]);

  /* Render loop */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas || !ctx) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* Gold glow pulse */
      const glow = glowRef.current;
      if (glow > 0.002) {
        glowRef.current = Math.max(0, glow - 0.018);
        const g1 = ctx.createRadialGradient(
          W / 2,
          H / 2,
          0,
          W / 2,
          H / 2,
          Math.max(W, H) * 0.8,
        );
        g1.addColorStop(0, `rgba(201,168,76,${glow * 0.04})`);
        g1.addColorStop(0.5, `rgba(30,92,42,${glow * 0.02})`);
        g1.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);
      }

      /* Rings */
      const rings = ringsRef.current;
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        if (ring.delay > 0) {
          ring.delay--;
          continue;
        }
        ring.r += ring.speed;
        ring.alpha -= 0.011;
        if (ring.alpha <= 0 || ring.r > ring.maxR) {
          rings.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = `rgba(201,168,76,${ring.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = `rgba(201,168,76,${ring.alpha})`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      /* Burst particles */
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.vy += 0.13;
        b.vx *= 0.988;
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.rotV;
        b.life -= b.decay;
        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.color;

        if (b.symbol) {
          ctx.font = `bold ${b.size}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(b.symbol, 0, 0);
        } else {
          ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}
