"use client";

import {
  useEffect,
  useRef,
} from "react";

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

let _uid = 0;

const uid = () => ++_uid;

export default function WorldCanvas({
  trigger,
  sprayOriginY = 320,
}: {
  trigger: number;
  sprayOriginY?: number;
}) {

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const ringsRef =
    useRef<Ring[]>([]);

  const burstsRef =
    useRef<BurstParticle[]>([]);

  const shimmersRef =
    useRef<Shimmer[]>([]);

  const glowRef = useRef(0);

  const rafRef = useRef(0);

  const prevTrigger = useRef(0);

  // Spawn FX
  useEffect(() => {

    if (trigger === 0) return;

    if (
      trigger === prevTrigger.current
    ) return;

    prevTrigger.current = trigger;

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const W = canvas.offsetWidth;

    const ox = W / 2;

    const oy = sprayOriginY;

    glowRef.current = 1;

    ringsRef.current.push(
      {
        id: uid(),
        x: ox,
        y: oy,
        r: 12,
        maxR:
          Math.min(
            W,
            window.innerHeight
          ) * 0.58,
        alpha: 0.7,
        speed: 16,
        delay: 0,
      },
      {
        id: uid(),
        x: ox,
        y: oy,
        r: 6,
        maxR:
          Math.min(
            W,
            window.innerHeight
          ) * 0.35,
        alpha: 0.4,
        speed: 22,
        delay: 5,
      }
    );

    const COLORS = [
      "#FFD700",
      "#FFF3A0",
      "#FF8C00",
      "#FFE566",
      "#FFAA00",
    ];

    const SYMBOLS = [
      "₦",
      "✦",
      "★",
      "◆",
    ];

    const count =
      10 +
      Math.floor(
        Math.random() * 6
      );

    for (let i = 0; i < count; i++) {

      const angle =
        -Math.PI * 0.5 +
        (Math.random() - 0.5) *
        Math.PI *
        1.1;

      const spd =
        3.5 + Math.random() * 11;

      const isSymbol =
        Math.random() > 0.7;

      burstsRef.current.push({
        id: uid(),

        x:
          ox +
          (Math.random() - 0.5) *
          30,

        y: oy,

        vx:
          Math.cos(angle) *
          spd,

        vy:
          Math.sin(angle) *
          spd,

        life: 1,

        decay:
          0.01 +
          Math.random() * 0.013,

        size: isSymbol
          ? 10 +
          Math.random() * 8
          : 3 +
          Math.random() * 5,

        color:
          COLORS[
          Math.floor(
            Math.random() *
            COLORS.length
          )
          ],

        rot:
          Math.random() *
          Math.PI *
          2,

        rotV:
          (Math.random() - 0.5) *
          0.22,

        symbol: isSymbol
          ? SYMBOLS[
          Math.floor(
            Math.random() *
            SYMBOLS.length
          )
          ]
          : undefined,
      });
    }



  }, [trigger, sprayOriginY]);

  // Render loop
  useEffect(() => {

    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    function resize() {
      if (!canvas || !ctx) return;

      canvas.width =
        canvas.offsetWidth;

      canvas.height =
        canvas.offsetHeight;
    }

    resize();

    const ro =
      new ResizeObserver(resize);

    ro.observe(canvas);

    function frame() {
      if (!canvas || !ctx) return;

      const W = canvas.width;

      const H = canvas.height;

      ctx.clearRect(
        0,
        0,
        W,
        H
      );

      // Glow
      const glow =
        glowRef.current;

      if (glow > 0.002) {

        glowRef.current =
          Math.max(
            0,
            glow - 0.016
          );

        const g1 =
          ctx.createRadialGradient(
            W / 2,
            H / 2,
            0,
            W / 2,
            H / 2,
            Math.max(W, H) *
            0.85
          );

        g1.addColorStop(
          0,
          `rgba(255,200,0,${glow * 0.035
          })`
        );

        g1.addColorStop(
          1,
          "rgba(0,0,0,0)"
        );

        ctx.fillStyle = g1;

        ctx.fillRect(
          0,
          0,
          W,
          H
        );
      }

      // Rings
      const rings =
        ringsRef.current;

      for (
        let i =
          rings.length - 1;
        i >= 0;
        i--
      ) {

        const ring = rings[i];

        if (ring.delay > 0) {
          ring.delay--;
          continue;
        }

        ring.r += ring.speed;

        ring.alpha -= 0.013;

        if (
          ring.alpha <= 0 ||
          ring.r > ring.maxR
        ) {
          rings.splice(i, 1);
          continue;
        }

        ctx.save();

        ctx.strokeStyle =
          `rgba(255,215,0,${ring.alpha})`;

        ctx.lineWidth = 1.6;

        ctx.shadowColor =
          `rgba(255,215,0,${ring.alpha})`;

        ctx.shadowBlur = 8;

        ctx.beginPath();

        ctx.arc(
          ring.x,
          ring.y,
          ring.r,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
      }


      // Particles
      const bursts =
        burstsRef.current;

      for (
        let i =
          bursts.length - 1;
        i >= 0;
        i--
      ) {

        const b = bursts[i];

        b.vy += 0.14;

        b.vx *= 0.985;

        b.x += b.vx;

        b.y += b.vy;

        b.rot += b.rotV;

        b.life -= b.decay;

        if (b.life <= 0) {
          bursts.splice(i, 1);
          continue;
        }

        ctx.save();

        ctx.globalAlpha =
          b.life;

        ctx.translate(
          b.x,
          b.y
        );

        ctx.rotate(b.rot);

        ctx.shadowColor =
          b.color;

        ctx.shadowBlur = 8;

        if (b.symbol) {

          ctx.fillStyle = b.color;

          ctx.font =
            `bold ${b.size}px serif`;

          ctx.textAlign = "center";

          ctx.textBaseline = "middle";

          ctx.fillText(
            "₦",
            0,
            0
          );

        } else {

          ctx.fillStyle =
            b.color;

          ctx.fillRect(
            -b.size / 2,
            -b.size / 2,
            b.size,
            b.size
          );
        }

        ctx.restore();
      }

      rafRef.current =
        requestAnimationFrame(
          frame
        );
    }

    rafRef.current =
      requestAnimationFrame(
        frame
      );

    return () => {

      cancelAnimationFrame(
        rafRef.current
      );

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