import { useCallback, useEffect, useRef, useState } from "react";
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
  const [state, setState] = useState({
    remainingAmount: totalAmount,
    sprayTrigger: 0,
  });

  const remainingRef = useRef(totalAmount);
  const noteValueRef = useRef(noteValue);
  const onCompleteRef = useRef(onComplete);
  const optionsRef = useRef(options);
  const rafPendingRef = useRef(false);
  const pendingRemainingRef = useRef(totalAmount);

  noteValueRef.current = noteValue;
  onCompleteRef.current = onComplete;
  optionsRef.current = options;
const mountedWithZero = useRef(totalAmount === 0);

useEffect(() => {
  if (mountedWithZero.current && totalAmount > 0) {
    remainingRef.current = totalAmount;
    pendingRemainingRef.current = totalAmount;
    setState({ remainingAmount: totalAmount, sprayTrigger: 0 });
    mountedWithZero.current = false;
  }
}, [totalAmount]);
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
    pendingRemainingRef.current = next;

    optionsRef.current?.onGift?.(noteValueRef.current, actualCount, next);

    if (next === 0) {
      // Final — one synchronous setState, React batches it
      setState({ remainingAmount: next, sprayTrigger: -1 }); // -1 = sentinel for complete
      onCompleteRef.current?.();
      return;
    }

    // Single rAF — both values flush in one React render
    if (!rafPendingRef.current) {
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        setState((prev) => ({
          remainingAmount: pendingRemainingRef.current,
          sprayTrigger: prev.sprayTrigger + 1,
        }));
        rafPendingRef.current = false;
      });
    }
  }, []);

  return {
    remainingAmount: state.remainingAmount,
    remainingRef,
    sprayTrigger: state.sprayTrigger,
    spray,
  };
}
