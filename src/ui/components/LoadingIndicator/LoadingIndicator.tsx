"use client";

import styles from "./LoadingIndicator.module.scss";

type LoadingIndicatorProps = {
  size?: number;
  matchColor?: boolean;
  fill?: string;
};

const rects = [
  { x: 44, y: 8 },
  { x: 59.6118, y: 9.51416, rotate: 22.5 },
  { x: 73.4558, y: 16.8873, rotate: 45 },
  { x: 83.1127, y: 29.4558, rotate: 67.5 },
  { x: 88, y: 44, rotate: 90 },
  { x: 86.4858, y: 59.6118, rotate: 112.5 },
  { x: 79.1127, y: 73.4558, rotate: 135 },
  { x: 66.5442, y: 83.1127, rotate: 157.5 },
  { x: 52, y: 88, rotate: 180 },
  { x: 36.3882, y: 86.4858, rotate: 202.5 },
  { x: 22.5442, y: 79.1127, rotate: 225 },
  { x: 12.8873, y: 66.5442, rotate: 247.5 },
  { x: 8, y: 52, rotate: 270 },
  { x: 9.51416, y: 36.3882, rotate: 292.5 },
  { x: 16.8873, y: 22.5442, rotate: 315 },
  { x: 29.4558, y: 12.8873, rotate: 337.5 },
];

export default function LoadingIndicator({
  size = 24,
  matchColor,
  fill = "#F0D080",
}: LoadingIndicatorProps) {
  return (
    <div className={styles.spinner}>
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
      >
        {rects.map((rect, index) => (
          <rect
            key={index}
            x={rect.x}
            y={rect.y}
            width="10"
            height="10"
            rx="5"
            transform={
              rect.rotate
                ? `rotate(${rect.rotate} ${rect.x} ${rect.y})`
                : undefined
            }
            className={`${styles.rect} ${styles[`rect${index}`]}`}
            fill={matchColor ? "currentColor" : fill}
          />
        ))}
      </svg>
    </div>
  );
}
