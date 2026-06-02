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
  targetScale: number;

  flutter: number;
  flutterSpeed: number;

  age: number;
  drag: number;
}

let _uid = 0;
const uid = () => ++_uid;

const GOLD_COLORS = [
  "#F0D080",
  "#C9A84C",
  "#FFD700",
  "#E8C547",
  "#8B6914",
  "#FAF5E4",
  "#2e7a40",
  "#1B5728",
];

const SYMBOLS = ["₦", "✦", "★", "◆", "✧"];

const NOTE_W = 130;
const NOTE_H = 240;

const MAX_SPREAD_ARC = Math.PI * 1.4;
const MAX_NOTES = 100;

function gaussian() {
  return Math.random() + Math.random() + Math.random() + Math.random() - 2;
}

export interface WorldCanvasHandle {
  sprayNotes: (
    count: number,
    vx: number,
    vy: number,
    originX?: number,
    originY?: number,
  ) => void;
}

function WorldCanvasInner(
  {
    trigger,
    sprayOriginY = 320,
    noteSrc,
  }: {
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

  useEffect(() => {
    const img = new window.Image();
    img.src = noteSrc;
    img.onload = () => {
      noteImageRef.current = img;
    };
  }, [noteSrc]);

  useImperativeHandle(ref, () => ({
    sprayNotes(count, vx, vy, originX, originY) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ox = originX ?? canvas.offsetWidth / 2;
      const oy = originY ?? canvas.offsetHeight * 0.72;

      const baseAngle = Math.atan2(vy, vx);
      const mag = Math.sqrt(vx * vx + vy * vy) || 1;

      const t = Math.min(count / MAX_NOTES, 1);
      const arc = MAX_SPREAD_ARC * Math.sqrt(t);

      const swipeStrength = Math.min(mag / 1500, 1);

      for (let i = 0; i < count; i++) {
        const fraction = gaussian() * 0.4;
        const angle = baseAngle + fraction * arc;

        const edgeFalloff = 1 - Math.min(Math.abs(fraction), 1) * 0.3;

        const speed =
          (9 + Math.random() * 7 + swipeStrength * 12) * edgeFalloff;

        flyNotesRef.current.push({
          x: ox,
          y: oy,

          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,

          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.12,

          life: 1,
          decay: 0.003 + Math.random() * 0.002,

          scale: 0.2,
          targetScale: 0.85 + Math.random() * 0.3,

          flutter: 0.8 + Math.random() * 3,
          flutterSpeed: 0.08 + Math.random() * 0.12,

          age: 0,
          drag: 0.965 + Math.random() * 0.015,
        });
      }
    },
  }));

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
        decay: 0.01 + Math.random() * 0.01,
        size: isSymbol ? 12 + Math.random() * 10 : 4 + Math.random() * 5,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        symbol: isSymbol
          ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
          : undefined,
      });
    }
  }, [trigger, sprayOriginY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const last = { current: performance.now() };

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      if (!canvas || !ctx) return;
      const now = performance.now();
      const dt = Math.min((now - last.current) / 16.666, 2);
      last.current = now;

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Rings
      for (let i = ringsRef.current.length - 1; i >= 0; i--) {
        const r = ringsRef.current[i];
        if (r.delay > 0) {
          r.delay--;
          continue;
        }

        r.r += r.speed * dt;
        r.alpha -= 0.011 * dt;

        if (r.alpha <= 0 || r.r > r.maxR) {
          ringsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(201,168,76,${r.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = `rgba(201,168,76,${r.alpha})`;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Bursts
      for (let i = burstsRef.current.length - 1; i >= 0; i--) {
        const b = burstsRef.current[i];

        b.vy += 0.13 * dt;
        b.vx *= 0.988;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.rot += b.rotV * dt;
        b.life -= b.decay * dt;

        if (b.life <= 0) {
          burstsRef.current.splice(i, 1);
          continue;
        }

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

      // Fly notes (FLUID PHYSICS)
      const img = noteImageRef.current;

      for (let i = flyNotesRef.current.length - 1; i >= 0; i--) {
        const n = flyNotesRef.current[i];

        n.age += dt;

        n.scale += (n.targetScale - n.scale) * 0.08;

        n.vy += 0.035 * dt;

        n.vx *= n.drag;
        n.vy *= n.drag;

        const flutterX = Math.sin(n.age * n.flutterSpeed) * n.flutter;

        const flutterY =
          Math.cos(n.age * n.flutterSpeed * 0.7) * (n.flutter * 0.25);

        const lift = Math.sin(n.rot) * 0.03;

        n.vx += lift;

        n.x += (n.vx + flutterX) * dt;
        n.y += (n.vy + flutterY) * dt;

        n.rot += n.rotV * dt;
        n.rotV *= 0.995;

        n.life -= n.decay * dt;

        if (n.life <= 0) {
          flyNotesRef.current.splice(i, 1);
          continue;
        }

        let alpha = 1;
        if (n.life > 0.85) alpha = (1 - n.life) / 0.15;
        else if (n.life < 0.3) alpha = n.life / 0.3;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(alpha, 1));

        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);

        const perspective = 1 + Math.sin(n.rot) * 0.08;
        ctx.scale(n.scale * perspective, n.scale);

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
