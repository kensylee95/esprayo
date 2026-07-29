"use client";

import { useEffect, useRef, useState } from "react";

export interface PerfStats {
  fps: number;
  frameTime: number; // ms per frame
  memory: number; // MB JS heap used (Chrome only)
  dropped: number; // frames that took >32ms (2x budget)
  activeNotes: number; // injected externally
}

export function usePerformanceOverlay() {
  const [stats, setStats] = useState<PerfStats>({
    fps: 0,
    frameTime: 0,
    memory: 0,
    dropped: 0,
    activeNotes: 0,
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastRef = useRef(performance.now());
  const droppedRef = useRef(0);
  const rafRef = useRef(0);
  const activeNotesRef = useRef(0);

  // Call this from WorldCanvas or wherever you track live note count
  const setActiveNotes = (n: number) => {
    activeNotesRef.current = n;
  };

  useEffect(() => {
    function frame() {
      const now = performance.now();
      const delta = now - lastRef.current;
      lastRef.current = now;

      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) frameTimesRef.current.shift();

      if (delta > 32) droppedRef.current++;

      // Update display every 30 frames (~0.5s)
      if (frameTimesRef.current.length % 30 === 0) {
        const avg =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;

        // @ts-expect-error — performance.memory is Chrome-only
        const mem = performance.memory
          ? // @ts-ignore
            Math.round(performance.memory.usedJSHeapSize / 1_048_576)
          : -1;

        setStats({
          fps: Math.round(1000 / avg),
          frameTime: Math.round(avg * 10) / 10,
          memory: mem,
          dropped: droppedRef.current,
          activeNotes: activeNotesRef.current,
        });
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { stats, setActiveNotes };
}
