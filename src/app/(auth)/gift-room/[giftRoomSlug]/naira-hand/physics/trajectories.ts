export type ExitTrajectory = ReturnType<typeof computeExitTrajectory>;
export function computeExitTrajectory(velocityY: number, velocityX: number) {
  const speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);

  const t = Math.min(speed / 1200, 1);

  return {
    exitY: -180 - t * 90,
    exitX: velocityX * 0.14 + (Math.random() - 0.5) * 50,
    exitRot: (velocityX >= 0 ? 1 : -1) * (8 + t * 40),
    exitScale: 0.82,
    dur: 0.36 + t * 0.2,
  };
}
