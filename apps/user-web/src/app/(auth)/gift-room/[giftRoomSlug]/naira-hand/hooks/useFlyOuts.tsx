import { useCallback, useEffect, useRef, useState } from "react";
import type { FlyOutState } from "../types";

interface UseFlyOutsReturn {
  flyOuts: FlyOutState[];
  /** Add a pre-computed batch. Schedules a single cleanup timer for the whole batch. */
  addFlyOuts: (batch: FlyOutState[], duration: number) => void;
  /** Cancel all pending timers and clear state — call on unmount or reset. */
  clearFlyOuts: () => void;
}

export function useFlyOuts(): UseFlyOutsReturn {
  const [flyOuts, setFlyOuts] = useState<FlyOutState[]>([]);

  // Track every cleanup timer so we can cancel them all on unmount / reset.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addFlyOuts = useCallback((batch: FlyOutState[], duration: number) => {
    // ONE state update to add the whole batch.
    setFlyOuts((prev) => [...prev, ...batch]);

    const ids = new Set(batch.map((f) => f.id));

    // ONE cleanup timer for the whole batch.
    const t = setTimeout(() => {
      setFlyOuts((prev) => prev.filter((f) => !ids.has(f.id)));
      timersRef.current = timersRef.current.filter((x) => x !== t);
    }, duration);

    timersRef.current.push(t);
  }, []);

  const clearFlyOuts = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFlyOuts([]);
  }, []);

  // Cancel dangling timers when the component unmounts.
  useEffect(() => clearFlyOuts, [clearFlyOuts]);

  return { flyOuts, addFlyOuts, clearFlyOuts };
}