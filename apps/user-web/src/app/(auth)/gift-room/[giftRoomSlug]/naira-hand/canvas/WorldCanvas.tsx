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

// ─── Device tier detection ────────────────────────────────────────────────────
// low  = old/budget phones (Moto G, iPhone 8 and below, low-end Android)
// mid  = modern mid-range + iPhone 12 Pro Max class
// high = desktop / iPad Pro / flagship
function detectTier(): "low" | "mid" | "high" {
  if (typeof navigator === "undefined") return "high";
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android/i.test(ua);
  if (!isMobile) return "high";
  // Rough GPU heuristic via logical cores — low-end phones typically report 4 or fewer
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 4) return "low";
  return "mid";
}

const TIER = detectTier();

// ─── Per-tier caps ────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  low: {
    maxNotes: 30,
    spawnPerCall: 12,
    decayMin: 0.014,
    decayRange: 0.006,
    burstCount: 6,
    shadowBlur: false,
    flutter: false,
  },
  mid: {
    maxNotes: 60,
    spawnPerCall: 25,
    decayMin: 0.008,
    decayRange: 0.004,
    burstCount: 10,
    shadowBlur: false,
    flutter: true,
  },
  high: {
    maxNotes: 250,
    spawnPerCall: 100,
    decayMin: 0.003,
    decayRange: 0.002,
    burstCount: 19,
    shadowBlur: true,
    flutter: true,
  },
} as const;

const CFG = TIER_CONFIG[TIER];

const MAX_ACTIVE_NOTES = CFG.maxNotes;
const NOTE_CULL_MARGIN = 260; // px outside canvas before we drop a note

// ─── Note sprite dimensions ───────────────────────────────────────────────────
const NOTE_W = 130;
const NOTE_H = 240;

const MAX_SPREAD_ARC = Math.PI * 1.4;
const MAX_NOTES = 100;

const SYMBOLS = ["₦", "✦", "★", "◆", "✧"];

function gaussian() {
  // Irwin–Hall approximation of a bell curve, clamped to [-1.5, 1.5]
  const v = Math.random() + Math.random() + Math.random() + Math.random() - 2;
  return Math.max(-1.5, Math.min(1.5, v));
}

export interface WorldCanvasHandle {
  sprayNotes: (
    count: number,
    vx: number,
    vy: number,
    originX?: number,
    originY?: number,
  ) => void;
  getBoundingClientRect: () => DOMRect | undefined;
}

function WorldCanvasInner(
  {
    trigger,
    sprayOriginY = 320,
    noteSrc,
    setActiveNotes,
  }: {
    trigger: number;
    sprayOriginY?: number;
    noteSrc: string;
    setActiveNotes?: (count: number) => void;
  },
  ref: React.ForwardedRef<WorldCanvasHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const flyNotesRef = useRef<FlyNote[]>([]);

  // Source image (loaded once)
  const noteImageRef = useRef<HTMLImageElement | null>(null);
  // Offscreen cache — drawn once after image loads, reused every frame
  const noteCacheRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef(0);
  const prevTrigger = useRef(0);

  // ── Build / rebuild the offscreen note cache ─────────────────────────────
  function buildNoteCache(img: HTMLImageElement) {
    const dpr = window.devicePixelRatio || 1;
    const off = document.createElement("canvas");
    // Physical pixels = CSS size x DPR — never upscaled, always crisp on retina
    off.width = NOTE_W * dpr;
    off.height = NOTE_H * dpr;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, NOTE_W, NOTE_H);
    noteCacheRef.current = off;
  }

  // ── Load note image ───────────────────────────────────────────────────────
  useEffect(() => {
    const img = new window.Image();
    img.src = noteSrc;
    img.onload = () => {
      noteImageRef.current = img;
      buildNoteCache(img);
    };
  }, [noteSrc]);

  // ── Expose imperative handle ──────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    getBoundingClientRect() {
      return canvasRef.current?.getBoundingClientRect();
    },

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

      const remaining = MAX_ACTIVE_NOTES - flyNotesRef.current.length;
      if (remaining <= 0) return;

      const spawnCount = Math.min(count, remaining, CFG.spawnPerCall);

      for (let i = 0; i < spawnCount; i++) {
        if (flyNotesRef.current.length >= MAX_ACTIVE_NOTES) break;

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
          decay: CFG.decayMin + Math.random() * CFG.decayRange,
          scale: 0.2,
          targetScale: 0.85 + Math.random() * 0.3,
          flutter: CFG.flutter ? 0.8 + Math.random() * 3 : 0,
          flutterSpeed: CFG.flutter ? 0.08 + Math.random() * 0.12 : 0,
          age: 0,
          drag: 0.965 + Math.random() * 0.015,
        });
      }
      if (process.env.NODE_ENV === "development") {
        setActiveNotes?.(flyNotesRef.current.length);
      }
    },
  }));

  // ── Trigger: rings + burst particles ─────────────────────────────────────
  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.offsetWidth;
    const ox = W / 2;
    const oy = sprayOriginY;

    const MAX_RINGS = 6;
    const MAX_BURSTS = CFG.maxNotes; // reuse tier cap — same budget philosophy

    if (ringsRef.current.length < MAX_RINGS) {
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
    }

    const burstSlots = MAX_BURSTS - burstsRef.current.length;
    const count = Math.min(
      CFG.burstCount + Math.floor(Math.random() * 7),
      burstSlots,
    );
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

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const last = { current: performance.now() };

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;

      // Size the backing buffer to physical pixels
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;

      // Scale so all drawing coords stay in CSS-pixel space
      ctx.scale(dpr, dpr);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      if (!canvas || !ctx) return;

      const now = performance.now();
      const dt = Math.min((now - last.current) / 16.666, 2);
      last.current = now;

      // Use CSS-pixel dimensions for all logic (ctx is pre-scaled by DPR)
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      ctx.clearRect(0, 0, W, H);

      // ── Rings ────────────────────────────────────────────────────────────
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
        // ⚠ shadowBlur is expensive — skip on mobile
        if (CFG.shadowBlur) {
          ctx.shadowColor = `rgba(201,168,76,${r.alpha})`;
          ctx.shadowBlur = 4;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── Burst particles ──────────────────────────────────────────────────
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

        // Skip invisible particles
        if (b.life < 0.02) continue;

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

      // ── Fly notes ────────────────────────────────────────────────────────
      const cache = noteCacheRef.current;

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

        // ── Cull: dead or out-of-bounds ───────────────────────────────────
        if (n.life <= 0) {
          flyNotesRef.current.splice(i, 1);
          continue;
        }

        if (
          n.x < -NOTE_CULL_MARGIN ||
          n.x > W + NOTE_CULL_MARGIN ||
          n.y > H + NOTE_CULL_MARGIN
        ) {
          flyNotesRef.current.splice(i, 1);
          continue;
        }

        // Fade in / fade out
        let alpha = 1;
        if (n.life > 0.85) alpha = (1 - n.life) / 0.15;
        else if (n.life < 0.3) alpha = n.life / 0.3;

        // Skip nearly-invisible notes (save draw call entirely)
        if (alpha < 0.02) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(alpha, 1));
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);

        const perspective = 1 + Math.sin(n.rot) * 0.08;
        ctx.scale(n.scale * perspective, n.scale);

        if (cache) {
          // Use pre-rendered offscreen canvas — no per-frame image decode
          // cache backing store is NOTE_W*DPR wide but we draw at CSS size — crisp on retina
          ctx.drawImage(cache, -NOTE_W / 2, -NOTE_H / 2, NOTE_W, NOTE_H);
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
