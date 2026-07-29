"use client";

import type { PerfStats } from "./hooks/usePerformanceOverlay";

const BAD_FPS = 30;
const WARN_FPS = 50;

function color(fps: number) {
  if (fps >= WARN_FPS) return "#4ade80"; // green
  if (fps >= BAD_FPS) return "#facc15"; // yellow
  return "#f87171"; // red
}

export default function PerfOverlay({ stats }: { stats: PerfStats }) {
  const fpsColor = color(stats.fps);

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        right: 12,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: 11,
        lineHeight: 1.7,
        color: "#e2e8f0",
        pointerEvents: "none",
        minWidth: 140,
      }}
    >
      <Row label="FPS" value={stats.fps} color={fpsColor} />
      <Row label="Frame" value={`${stats.frameTime}ms`} />
      <Row
        label="Dropped"
        value={stats.dropped}
        color={stats.dropped > 0 ? "#facc15" : "#4ade80"}
      />
      <Row label="Notes" value={stats.activeNotes} />
      {stats.memory >= 0 && (
        <Row
          label="JS Heap"
          value={`${stats.memory}MB`}
          color={stats.memory > 100 ? "#facc15" : undefined}
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ color: color ?? "#e2e8f0", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}
