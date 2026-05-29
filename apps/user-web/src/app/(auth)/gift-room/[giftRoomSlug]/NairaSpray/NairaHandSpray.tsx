"use client";

import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import Image from "next/image";
import { ArrowUp } from "lucide-react";

import NOTE_SRC from "./assets/naira-note.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NairaHandProps {
  totalAmount: number;
  noteValue?: number;
  visibleStack?: number;
  onComplete?: () => void;
}

// ─── Stack config ─────────────────────────────────────────────────────────────

const getStackConfig = (index: number, total: number) => ({
  rotate: (index - Math.floor(total / 2)) * 1.2,
  x: (index - Math.floor(total / 2)) * 2,
  y: -(index * 5),
  zIndex: index + 1,
});

// ─── Physics helpers ──────────────────────────────────────────────────────────

function computeExitTrajectory(velocityY: number, velocityX: number) {
  const speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);
  const t = Math.min(speed / 1200, 1);
  return {
    exitY:     -300 - t * 200,
    exitX:     velocityX * 0.14 + (Math.random() - 0.5) * 50,
    exitRot:   (velocityX >= 0 ? 1 : -1) * (15 + t * 220),
    exitScale: 0.5 + Math.random() * 0.2,
    dur:       0.36 + t * 0.2,
  };
}

// ─── World physics types ──────────────────────────────────────────────────────

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

interface Shimmer {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alpha: number;
  life: number;
  decay: number;
}

// ─── World Canvas — physics overlay ──────────────────────────────────────────

let _uid = 0;
const uid = () => ++_uid;

function WorldCanvas({
  trigger,
  sprayOriginY,
}: {
  trigger: number;          // increments on each spray
  sprayOriginY: number;     // px from top of container where top note lives
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef  = useRef<Ring[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const shimmersRef = useRef<Shimmer[]>([]);
  const glowRef   = useRef(0);       // 0–1, world glow intensity
  const rafRef    = useRef<number>(0);
  const prevTrigger = useRef(0);

  // spawn on each new spray
  useEffect(() => {
    if (trigger === 0) return;
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;

    const ox = W / 2;
    const oy = sprayOriginY;

    // glow
    glowRef.current = 1;

    // 2 shockwave rings
    ringsRef.current.push(
      { id: uid(), x: ox, y: oy, r: 12,  maxR: Math.min(W, window.innerHeight) * 0.58, alpha: 0.7,  speed: 16, delay: 0 },
      { id: uid(), x: ox, y: oy, r: 6,   maxR: Math.min(W, window.innerHeight) * 0.35, alpha: 0.4,  speed: 22, delay: 5 },
      { id: uid(), x: ox, y: oy, r: 2,   maxR: Math.min(W, window.innerHeight) * 0.18, alpha: 0.28, speed: 30, delay: 10 },
    );

    // burst particles
    const COLORS = ["#FFD700","#FFF3A0","#FF8C00","#FFE566","#FFAA00","#FFF8DC","#FFD700"];
    const SYMBOLS = ["₦","✦","★","◆"];
    const count = 28 + Math.floor(Math.random() * 12);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.1;
      const spd   = 3.5 + Math.random() * 11;
      const isSymbol = Math.random() > 0.7;
      burstsRef.current.push({
        id: uid(),
        x: ox + (Math.random() - 0.5) * 30,
        y: oy,
        vx: Math.cos(angle) * spd * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * spd,
        life: 1,
        decay: 0.010 + Math.random() * 0.013,
        size: isSymbol ? 10 + Math.random() * 8 : 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.22,
        symbol: isSymbol ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] : undefined,
      });
    }

    // ground shimmer strips
    const H = canvas.offsetHeight;
    for (let i = 0; i < 5; i++) {
      shimmersRef.current.push({
        id: uid(),
        x: W * 0.05 + Math.random() * W * 0.9,
        y: H * 0.72 + Math.random() * H * 0.18,
        w: 50 + Math.random() * 140,
        h: 1.5 + Math.random() * 3.5,
        alpha: 0.4 + Math.random() * 0.4,
        life: 1,
        decay: 0.014 + Math.random() * 0.014,
      });
    }
  }, [trigger, sprayOriginY]);

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      const W = canvas!.width;
      const H = canvas!.height;
      ctx.clearRect(0, 0, W, H);

      // ── world glow radial ────────────────────────────────────────────────
      const glow = glowRef.current;
      if (glow > 0.002) {
        glowRef.current = Math.max(0, glow - 0.016);

        // centre burst
        const g1 = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H) * 0.85);
        g1.addColorStop(0,   `rgba(255,200,0,${glow * 0.09})`);
        g1.addColorStop(0.35,`rgba(255,140,0,${glow * 0.055})`);
        g1.addColorStop(0.7, `rgba(180,80,0,${glow * 0.022})`);
        g1.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);

        // edge vignette gold
        const g2 = ctx.createRadialGradient(W/2, H, 0, W/2, H * 0.5, H * 1.2);
        g2.addColorStop(0,   `rgba(255,215,0,${glow * 0.14})`);
        g2.addColorStop(0.4, `rgba(255,150,0,${glow * 0.06})`);
        g2.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);

        // bright flare at note origin
        const fx = W/2, fy = sprayOriginY;
        const g3 = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
        g3.addColorStop(0,   `rgba(255,240,150,${glow * 0.55})`);
        g3.addColorStop(0.3, `rgba(255,200,0,${glow * 0.2})`);
        g3.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = g3;
        ctx.fillRect(fx-120, fy-120, 240, 240);
      }

      // ── shockwave rings ──────────────────────────────────────────────────
      const rings = ringsRef.current;
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        if (ring.delay > 0) { ring.delay--; continue; }
        ring.r     += ring.speed;
        ring.alpha -= 0.013;
        if (ring.alpha <= 0 || ring.r > ring.maxR) { rings.splice(i, 1); continue; }

        ctx.save();
        ctx.strokeStyle = `rgba(255,215,0,${ring.alpha})`;
        ctx.lineWidth   = 1.6;
        ctx.shadowColor = `rgba(255,215,0,${ring.alpha * 0.8})`;
        ctx.shadowBlur  = 18;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();

        // inner faint fill ring for richness
        ctx.strokeStyle = `rgba(255,240,100,${ring.alpha * 0.25})`;
        ctx.lineWidth   = ring.r * 0.04;
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── ground shimmer ───────────────────────────────────────────────────
      const shimmers = shimmersRef.current;
      for (let i = shimmers.length - 1; i >= 0; i--) {
        const s = shimmers[i];
        s.life -= s.decay;
        if (s.life <= 0) { shimmers.splice(i, 1); continue; }
        const sg = ctx.createLinearGradient(s.x - s.w/2, 0, s.x + s.w/2, 0);
        sg.addColorStop(0,   "rgba(255,215,0,0)");
        sg.addColorStop(0.35,`rgba(255,215,0,${s.alpha * s.life})`);
        sg.addColorStop(0.65,`rgba(255,215,0,${s.alpha * s.life})`);
        sg.addColorStop(1,   "rgba(255,215,0,0)");
        ctx.save();
        ctx.shadowColor = `rgba(255,215,0,${s.life * 0.6})`;
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = sg;
        ctx.fillRect(s.x - s.w/2, s.y, s.w, s.h);
        ctx.restore();
      }

      // ── burst particles ──────────────────────────────────────────────────
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.vy   += 0.38;
        b.vx   *= 0.985;
        b.x    += b.vx;
        b.y    += b.vy;
        b.rot  += b.rotV;
        b.life -= b.decay;
        if (b.life <= 0) { bursts.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha  = b.life * 0.95;
        ctx.shadowColor  = b.color;
        ctx.shadowBlur   = 8;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);

        if (b.symbol) {
          ctx.fillStyle  = b.color;
          ctx.font       = `bold ${b.size}px serif`;
          ctx.textAlign  = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(b.symbol, 0, 0);
        } else {
          ctx.fillStyle = b.color;
          ctx.fillRect(-b.size/2, -b.size/2, b.size, b.size);
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
  }, [sprayOriginY]);

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

// ─── Stage ambient glow (always on, pulses with spray) ────────────────────────

function StageGlow({ intensity }: { intensity: number }) {
  return (
    <>
      {/* Deep amber base at stage bottom */}
      <motion.div
        animate={{ opacity: [0.55, 0.75, 0.55] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "130%",
          height: "42%",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,180,0,0.18) 0%, rgba(255,100,0,0.06) 45%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Spray pulse glow — flares on spray */}
      <motion.div
        key={intensity}
        initial={{ opacity: intensity * 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: "14%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "200%",
          height: "70%",
          background:
            "radial-gradient(ellipse at 50% 90%, rgba(255,215,0,0.32) 0%, rgba(255,160,0,0.12) 35%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </>
  );
}

// ─── Floating background symbols ──────────────────────────────────────────────

function FloatingSymbols() {
  const symbols = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      duration: 7 + Math.random() * 11,
      delay: -Math.random() * 14,
      size: 9 + Math.random() * 20,
      opacity: 0.03 + Math.random() * 0.09,
      symbol: ["₦","✦","◆","★"][Math.floor(Math.random()*4)],
      drift: (Math.random() - 0.5) * 30,
    })), []
  );

  return (
    <div style={{
      position: "absolute", inset: 0,
      zIndex: 0, pointerEvents: "none", overflow: "hidden",
    }}>
      {symbols.map(s => (
        <motion.div
          key={s.id}
          initial={{ y: "105vh", rotate: -20, x: 0 }}
          animate={{ y: "-12vh", rotate: 20, x: s.drift }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            bottom: 0,
            fontSize: s.size,
            color: "#FFD700",
            opacity: s.opacity,
            fontWeight: 700,
            userSelect: "none",
          }}
        >
          {s.symbol}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Swipe hint ───────────────────────────────────────────────────────────────

function SwipeHint({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            bottom: "7%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,215,0,0.4)",
              background: "rgba(255,215,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <ArrowUp size={16} color="#FFD700" strokeWidth={2.5} />
          </motion.div>

          <motion.div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "rgba(255,215,0,0.6)",
              textTransform: "uppercase",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <motion.span
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >
              Swipe up to spray
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function useConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const launch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const COLORS = [
      "#FFD700","#FF6B35","#E040FB","#00E5FF",
      "#69F0AE","#FF4081","#FFEB3B","#40C4FF",
    ];

    const pieces = Array.from({ length: 110 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const spd = 7 + Math.random() * 15;
      return {
        x: W / 2 + (Math.random() - 0.5) * 80,
        y: H * 0.58,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 16,
        w: 8 + Math.random() * 10,
        h: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
      };
    });

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of pieces) {
        p.vy += 0.42; p.vx *= 0.992;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.rotV; p.rotV *= 0.98;
        p.alpha -= 0.007;
        if (p.alpha <= 0 || p.y > H + 20) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  return { canvasRef, launch };
}

// ─── Celebration ──────────────────────────────────────────────────────────────

const CelebrationScreen = memo(function CelebrationScreen({
  totalAmount,
  noteValue,
  onReset,
}: {
  totalAmount: number;
  noteValue: number;
  onReset: () => void;
}) {
  const { canvasRef, launch } = useConfettiCanvas();
  const noteCount = Math.ceil(totalAmount / noteValue);

  useEffect(() => {
    const t = setTimeout(launch, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      key="celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "absolute", inset: 0, zIndex: 900,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ scale: 0.72, y: 48 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14,
          padding: "36px 32px", borderRadius: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,215,0,0.22)",
          maxWidth: 280, width: "90%",
        }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.18, 0.96, 1.07, 1] }}
          transition={{ duration: 0.65, delay: 0.2 }}
          style={{ fontSize: 60, lineHeight: 1, userSelect: "none" }}
        >🤑</motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{
            margin: 0, fontSize: 30, fontWeight: 800,
            color: "#FFD700", letterSpacing: "-0.03em",
            textShadow: "0 0 24px rgba(255,215,0,0.5)",
          }}
        >E don spray!</motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.46, type: "spring", stiffness: 220 }}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 14,
            background: "rgba(255,215,0,0.08)",
            border: "1px solid rgba(255,215,0,0.25)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: "0.22em", color: "rgba(255,215,0,0.55)", textTransform: "uppercase" }}>
            Total sprayed
          </p>
          <p style={{ margin: 0, fontSize: 42, fontWeight: 700, color: "#FFD700", letterSpacing: "-0.02em" }}>
            ₦{totalAmount.toLocaleString()}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}
        >
          {noteCount} note{noteCount !== 1 ? "s" : ""} scattered
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={onReset}
          style={{
            marginTop: 4, padding: "13px 38px", borderRadius: 40,
            border: "1.5px solid rgba(255,215,0,0.45)",
            background: "rgba(255,215,0,0.1)",
            color: "#FFD700", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.1em", cursor: "pointer",
          }}
        >
          Spray again
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

// ─── Note ─────────────────────────────────────────────────────────────────────

interface NoteProps {
  stackIndex: number;
  totalRemaining: number;
  noteId: number;
  dismissing: boolean;
  onDismiss: (id: number, vy: number, vx: number) => void;
}

const Note = memo(function Note({
  stackIndex,
  totalRemaining,
  noteId,
  dismissing,
  onDismiss,
}: NoteProps) {
  const cfg   = getStackConfig(stackIndex, totalRemaining);
  const isTop = stackIndex === totalRemaining - 1;

  const dragY      = useMotionValue(0);
  const dragX      = useMotionValue(0);
  const opacity    = useTransform(dragY, [0, -120], [1, 0]);
  const scale      = useTransform(dragY, [0, -120], [1, 0.88]);
  const dragRotate = useTransform(dragX, [-120, 120], [-16, 16]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.y < -48 || info.velocity.y < -200) {
      onDismiss(noteId, info.velocity.y, info.velocity.x);
    }
  }

  return (
    <motion.div
      drag={isTop && !dismissing ? "y" : false}
      dragConstraints={{ top: -240, bottom: 20 }}
      dragElastic={0.16}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        y:          isTop ? dragY      : cfg.y,
        x:          isTop ? dragX      : cfg.x,
        rotate:     isTop ? dragRotate : cfg.rotate,
        opacity:    isTop && !dismissing ? opacity : 1,
        scale:      isTop && !dismissing ? scale   : 1,
        zIndex:     cfg.zIndex + 10,
        position:   "absolute",
        bottom:     "18%",
        left:       "50%",
        translateX: "-50%",
        cursor:     isTop && !dismissing ? "grab" : "default",
        touchAction: "none",
        userSelect:  "none",
        willChange:  "transform",
      }}
      whileTap={isTop ? { cursor: "grabbing" } : {}}
      whileHover={isTop && !dismissing ? { y: cfg.y - 8, transition: { duration: 0.12 } } : {}}
    >
      {/* Thickness illusion */}
      <div style={{
        position: "absolute", bottom: -2, left: 5, right: 5,
        height: 4, background: "rgba(255,255,255,.05)",
      }} />

      <div style={{
        overflow:    "hidden",
        width:       "clamp(120px, 22vw, 160px)",
        aspectRatio: "130 / 240",
        position:    "relative",
        borderRadius: 6,
        boxShadow: isTop
          ? "0 20px 50px rgba(0,0,0,.6), 0 6px 16px rgba(0,0,0,.3), 0 0 0 1px rgba(255,215,0,0.08)"
          : "0 6px 12px rgba(0,0,0,.3)",
      }}>
        <Image
          src={NOTE_SRC}
          alt="1000 Naira note"
          fill
          priority={isTop}
          quality={85}
          draggable={false}
          sizes="160px"
          style={{ objectFit: "contain", pointerEvents: "none" }}
        />
        {!isTop && (
          <div style={{
            position: "absolute", inset: 0,
            background: `rgba(0,0,0,${0.05 * (totalRemaining - 1 - stackIndex)})`,
          }} />
        )}
      </div>
    </motion.div>
  );
});

// ─── Flyout state ─────────────────────────────────────────────────────────────

interface FlyoutState {
  id:         number;
  cfg:        ReturnType<typeof getStackConfig>;
  trajectory: ReturnType<typeof computeExitTrajectory>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NairaHand({
  totalAmount,
  noteValue    = 1000,
  visibleStack = 5,
  onComplete,
}: NairaHandProps) {
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);
  const [dismissingId,    setDismissingId]    = useState<number | null>(null);
  const [flyOut,          setFlyOut]          = useState<FlyoutState | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHint,        setShowHint]        = useState(true);

  // world physics triggers
  const [sprayTrigger,    setSprayTrigger]    = useState(0);   // increments on each spray
  const [glowIntensity,   setGlowIntensity]   = useState(0);   // for StageGlow key trick

  const containerRef = useRef<HTMLDivElement>(null);
  const swipeLock    = useRef(false);

  // compute where the top note lives so WorldCanvas targets it
  const sprayOriginY = useMemo(() => {
    if (!containerRef.current) return 300;
    const H = containerRef.current.offsetHeight;
    const vn = Math.min(visibleStack, Math.ceil(remainingAmount / noteValue));
    const cfg = getStackConfig(vn - 1, vn);
    // bottom: 18% from bottom, then cfg.y offset upward, then half note height
    const noteH = 160 * (240 / 130); // max note height
    return H * 0.82 + cfg.y - noteH * 0.5;
  }, [remainingAmount, noteValue, visibleStack]);

  useEffect(() => {
    setRemainingAmount(totalAmount);
    setDismissingId(null);
    setFlyOut(null);
    setShowCelebration(false);
    setShowHint(true);
    setSprayTrigger(0);
    setGlowIntensity(0);
    swipeLock.current = false;
  }, [totalAmount]);

  const visibleNotes = Math.min(visibleStack, Math.ceil(remainingAmount / noteValue));
  const notes = useMemo(
    () => Array.from({ length: visibleNotes }, (_, i) => i),
    [visibleNotes]
  );

  const dismiss = useCallback((noteId: number, velocityY: number, velocityX: number) => {
    if (swipeLock.current || remainingAmount <= 0) return;
    swipeLock.current = true;
    setDismissingId(noteId);
    setShowHint(false);

    const topCfg     = getStackConfig(visibleNotes - 1, visibleNotes);
    const trajectory = computeExitTrajectory(velocityY, velocityX);
    setFlyOut({ id: noteId, cfg: topCfg, trajectory });

    // fire world physics
    setSprayTrigger(t => t + 1);
    setGlowIntensity(g => g + 1);

    requestAnimationFrame(() => {
      setRemainingAmount((prev) => {
        const next = Math.max(prev - noteValue, 0);
        if (next === 0) {
          setTimeout(() => { setShowCelebration(true); onComplete?.(); }, 420);
        }
        return next;
      });
      setDismissingId(null);
      swipeLock.current = false;
    });

    window.setTimeout(() => setFlyOut(null), 520);
  }, [remainingAmount, visibleNotes, noteValue, onComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%", height: "100%",
        overflow: "hidden", position: "relative",
        contain: "layout paint", isolation: "isolate",
      }}
    >

      {/* ── Layer 0: rich background ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 50% 85%, #1c1400 0%, #0d0900 55%, #000 100%)",
      }} />

      {/* Ambient slow gold pulse */}
      <motion.div
        animate={{ opacity: [0.04, 0.10, 0.04] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 95%, #FFD700 0%, transparent 60%)",
        }}
      />

      {/* Floating ₦ symbols */}
      <FloatingSymbols />

      {/* ── Layer 1: stage glow (reacts to spray) ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <StageGlow intensity={glowIntensity} />
      </div>

      {/* ── Layer 1b: glass stage panel ── */}
      <div style={{
        position: "absolute", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "min(360px, 92%)", height: "26%",
        zIndex: 2,
        background: "linear-gradient(to top, rgba(255,215,0,0.05) 0%, transparent 100%)",
        borderTop: "1px solid rgba(255,215,0,0.12)",
        borderLeft: "1px solid rgba(255,215,0,0.06)",
        borderRight: "1px solid rgba(255,215,0,0.06)",
        borderRadius: "28px 28px 0 0",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }} />

      {/* Thin gold accent line */}
      <div style={{
        position: "absolute", bottom: "26%",
        left: "50%", transform: "translateX(-50%)",
        width: "min(200px, 50%)", height: 1,
        zIndex: 2,
        background: "linear-gradient(to right, transparent, rgba(255,215,0,0.4), transparent)",
      }} />

      {/* ── Layer 2: physics world canvas (rings, burst, glow) ── */}
      <WorldCanvas trigger={sprayTrigger} sprayOriginY={sprayOriginY} />

      {/* ── Layer 3: notes + flyout + UI ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>

        {/* Notes */}
        <AnimatePresence mode="popLayout">
          {notes.map((noteId, stackIndex) => (
            <Note
              key={`${remainingAmount}-${noteId}`}
              noteId={noteId}
              stackIndex={stackIndex}
              totalRemaining={visibleNotes}
              dismissing={dismissingId === noteId}
              onDismiss={dismiss}
            />
          ))}
        </AnimatePresence>

        {/* Physics flyout */}
        <AnimatePresence>
          {flyOut && (
            <motion.div
              key={`fly-${flyOut.id}`}
              initial={{ opacity: 1, y: flyOut.cfg.y, x: 0, rotate: flyOut.cfg.rotate, scale: 1 }}
              animate={{
                opacity: 0,
                y:       flyOut.trajectory.exitY,
                x:       flyOut.trajectory.exitX,
                scale:   flyOut.trajectory.exitScale,
                rotate:  flyOut.cfg.rotate + flyOut.trajectory.exitRot,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: flyOut.trajectory.dur, ease: [0.18, 0.85, 0.38, 1] }}
              style={{
                position: "absolute", bottom: "18%",
                left: "50%", translateX: "-50%",
                zIndex: 999, pointerEvents: "none",
              }}
            >
              <div style={{
                width: "clamp(120px, 22vw, 160px)",
                aspectRatio: "130 / 240",
                overflow: "hidden", position: "relative",
                borderRadius: 6,
                boxShadow: "0 20px 40px rgba(0,0,0,.5)",
              }}>
                <Image
                  src={NOTE_SRC} alt="" fill quality={85}
                  draggable={false} sizes="160px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Amount counter */}
        <AnimatePresence mode="wait">
          {!showCelebration && (
            <motion.div
              key={remainingAmount}
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0,  scale: 1   }}
              exit={{    opacity: 0, y:  6, scale: 0.9 }}
              transition={{ duration: 0.16 }}
              style={{
                position: "absolute", top: 24, left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10, pointerEvents: "none", whiteSpace: "nowrap",
              }}
            >
              <div style={{
                padding: "6px 18px", borderRadius: 40,
                background: "rgba(255,215,0,0.07)",
                border: "1px solid rgba(255,215,0,0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}>
                <span style={{
                  color: "#FFD700", fontWeight: 700,
                  fontSize: 20, letterSpacing: "-0.02em",
                  textShadow: "0 0 20px rgba(255,215,0,0.4)",
                }}>
                  ₦{remainingAmount.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe hint */}
        <SwipeHint visible={showHint && !showCelebration} />

        {/* Celebration */}
        <AnimatePresence>
          {showCelebration && (
            <CelebrationScreen
              totalAmount={totalAmount}
              noteValue={noteValue}
              onReset={() => {
                setShowCelebration(false);
                setRemainingAmount(totalAmount);
                setShowHint(true);
                setSprayTrigger(0);
                setGlowIntensity(0);
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}