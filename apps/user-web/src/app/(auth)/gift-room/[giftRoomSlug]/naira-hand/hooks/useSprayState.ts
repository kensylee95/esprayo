import {
  useState,
  useRef,
  useCallback,
} from "react";

interface SprayOptions {
  onGift?: (
    noteValue: number,
    remainingAmount: number
  ) => void;
}

export function useSprayState(
  totalAmount: number,
  noteValue: number,
  onComplete?: () => void,
  options?: SprayOptions
) {

  const [remainingAmount, setRemainingAmount] =
    useState(totalAmount);

  const [sprayTrigger, setSprayTrigger] =
    useState(0);

  const swipeLock = useRef(false);

const spray = useCallback(() => {

  if (swipeLock.current) return;

  swipeLock.current = true;

  setSprayTrigger((v) => v + 1);

  requestAnimationFrame(() => {

    const currentRemaining =
      remainingAmount;

    const next = Math.max(
      currentRemaining - noteValue,
      0
    );

    // update local state first
    setRemainingAmount(next);

    // THEN notify parent safely
    options?.onGift?.(
      noteValue,
      next,
    );

    if (next === 0) {
      onComplete?.();
    }

    swipeLock.current = false;

  });

}, [
  remainingAmount,
  noteValue,
  totalAmount,
  onComplete,
  options,
]);

  return {
    remainingAmount,
    sprayTrigger,
    spray,
  };
}