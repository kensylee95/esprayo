"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

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

interface FlyNote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  life: number;
  decay: number;
  scale: number;
}

let _uid = 0;
const uid = () => ++_uid;

const GOLD_COLORS = [
  "#F0D080", "#C9A84C", "#FFD700", "#E8C547",
  "#8B6914", "#FAF5E4", "#2e7a40", "#1B5728",
];
const SYMBOLS = ["₦", "✦", "★", "◆", "✧"];
const NOTE_W = 150;
const NOTE_H = 300;

export interface WorldCanvasHandle {
  sprayNotes: (count: number, vx: number, vy: number) => void;
}

function WorldCanvasInner(
  { trigger, sprayOriginY = 320, noteSrc }: {
    trigger: number;
    sprayOriginY?: number;
    noteSrc: string;
  },
  ref: React.ForwardedRef<WorldCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const flyNotesRef = useRef<FlyNote[]>([]);
  const noteImageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef(0);
  const prevTrigger = useRef(0);

  // Preload note image
  useEffect(() => {
    const img = new window.Image();
    img.src = noteSrc;
    img.onload = () => { noteImageRef.current = img; };
  }, [noteSrc]);

  useImperativeHandle(ref, () => ({
sprayNotes(count, vx, vy) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ox = canvas.offsetWidth / 2;
  const oy = canvas.offsetHeight * 0.55; // ← above the stack, not behind it

  for (let i = 0; i < count; i++) {
    // normalize swipe direction so first note travels exactly where you swiped
    const mag = Math.sqrt(vx ** 2 + vy ** 2) || 1;
    const nx = vx / mag;
    const ny = vy / mag;

    // first note goes straight in swipe direction, rest fan out slightly
    const spread = i === 0 ? 0 : (Math.random() - 0.5) * 0.6;
    const spd = 14 + Math.random() * 12;

    flyNotesRef.current.push({
      x: ox + (Math.random() - 0.5) * 30,
      y: oy,
      vx: (nx * Math.cos(spread) - ny * Math.sin(spread)) * spd,
      vy: (ny * Math.cos(spread) + nx * Math.sin(spread)) * spd,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.15,
      life: 1,
      decay: 0.003 + Math.random() * 0.003,
      scale: 0.55 + Math.random() * 0.45,
    });
  }
},
  }));

  // Spawn rings + bursts on each spray trigger
  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.offsetWidth;
    const ox = W / 2;
    const oy = sprayOriginY;

    ringsRef.current.push(
      {
        id: uid(), x: ox, y: oy, r: 10,
        maxR: Math.min(W, window.innerHeight) * 0.6,
        alpha: 0.75, speed: 14, delay: 0,
      },
      {
        id: uid(), x: ox, y: oy, r: 5,
        maxR: Math.min(W, window.innerHeight) * 0.38,
        alpha: 0.45, speed: 20, delay: 6,
      },
    );

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

  // Render loop
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

      // Rings
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const ring = ringsRef.current[i];
        if (ring.delay > 0) { ring.delay--; continue; }
        ring.r += ring.speed;
        ring.alpha -= 0.011;
        if (ring.alpha <= 0 || ring.r > ring.maxR) {
          ringsRef.current.splice(i, 1); continue;
        }
        ctx.save();
        ctx.strokeStyle = `rgba(201,168,76,${ring.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = `rgba(201,168,76,${ring.alpha})`;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Bursts
      for (let i = burstsRef.current.length - 1; i >= 0; i--) {
        const b = burstsRef.current[i];
        b.vy += 0.13; b.vx *= 0.988;
        b.x += b.vx; b.y += b.vy;
        b.rot += b.rotV; b.life -= b.decay;
        if (b.life <= 0) { burstsRef.current.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
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

      // Fly notes
// Fly notes — paper physics
const img = noteImageRef.current;
for (let i = flyNotesRef.current.length - 1; i >= 0; i--) {
  const n = flyNotesRef.current[i];

  // gravity kicks in gradually — note travels straight first then curves
  const gravityRamp = 1 - Math.min(n.life, 0.85); // no gravity at full life, increases as it ages
  n.vy += 0.55 * gravityRamp;
  n.vx *= 0.97;  // air drag slows horizontal
  n.vy *= 0.98;  // slight vertical drag so it doesn't rocket down

  n.x += n.vx;
  n.y += n.vy;
  n.rot += n.rotV;
  // rotation increases as it slows — paper tumble effect
  n.rotV += (Math.random() - 0.5) * 0.008;
  n.life -= n.decay;
  if (n.life <= 0) { flyNotesRef.current.splice(i, 1); continue; }

  ctx.save();
  ctx.globalAlpha = Math.min(n.life * 2, 1);
  ctx.translate(n.x, n.y);
  ctx.rotate(n.rot);
  ctx.scale(n.scale, n.scale);
  if (img) {
    ctx.drawImage(img, -NOTE_W / 2, -NOTE_H / 2, NOTE_W, NOTE_H);
  } else {
    ctx.fillStyle = "#C9A84C";
    ctx.fillRect(-NOTE_W / 2, -NOTE_H / 2, NOTE_W, NOTE_H);
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
        zIndex: 100,
      }}
    />
  );
}

const WorldCanvas = forwardRef(WorldCanvasInner);
export default WorldCanvas;