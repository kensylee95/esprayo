import { useCallback, useRef, useState } from "react";
import type { NoteValue } from "../types";

interface SprayOptions {
  onGift?: (
    noteValue: NoteValue,
    numberSent: number,
    remainingAmount: number,
  ) => void;
}
export function useSprayState(
  totalAmount: number,
  noteValue: NoteValue,
  onComplete?: () => void,
  options?: SprayOptions,
) {
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);
  const [sprayTrigger, setSprayTrigger] = useState(0);

  const remainingRef = useRef(totalAmount);
  const noteValueRef = useRef(noteValue);
  const onCompleteRef = useRef(onComplete);
  const optionsRef = useRef(options);

  // Always sync mutable refs
  noteValueRef.current = noteValue;
  onCompleteRef.current = onComplete;
  optionsRef.current = options;
  // ← prevTotalRef block is gone entirely

  const spray = useCallback((count = 1) => {
    if (remainingRef.current <= 0) return;

    const actualCount = Math.min(
      count,
      Math.ceil(remainingRef.current / noteValueRef.current),
    );
    const next = Math.max(
      remainingRef.current - noteValueRef.current * actualCount,
      0,
    );

    remainingRef.current = next;
    setSprayTrigger((v) => v + actualCount);
    setRemainingAmount(next);

    optionsRef.current?.onGift?.(noteValueRef.current, actualCount, next);

    if (next === 0) {
      onCompleteRef.current?.();
    }
  }, []);

  return { remainingAmount, remainingRef, sprayTrigger, spray };
}
