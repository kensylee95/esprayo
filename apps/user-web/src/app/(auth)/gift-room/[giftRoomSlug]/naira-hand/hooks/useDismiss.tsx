import { useCallback } from "react";
import { buildFlyOutBatch, batchDuration } from "../physics/flyout";
import type { useFlyOuts } from "./useFlyOuts";

interface UseDismissOptions {
  visibleNotesRef: React.RefObject<number>;
  noteValueRef: React.RefObject<number>;
  remainingRef: React.RefObject<number>;
  addFlyOuts: ReturnType<typeof useFlyOuts>["addFlyOuts"];
  spray: (count?: number) => void;
}

export function useDismiss({
  visibleNotesRef,
  noteValueRef,
  remainingRef,
  addFlyOuts,
  spray,
}: UseDismissOptions) {
  return useCallback(
    (_noteId: number, velocityY: number, velocityX: number, count: number) => {
      if (remainingRef.current <= 0) return;

      const noteValue = noteValueRef.current ?? 1;
      const visibleNotes = visibleNotesRef.current ?? 1;
      const safeCount = Math.min(count, Math.ceil(remainingRef.current / noteValue));

      const batch = buildFlyOutBatch(visibleNotes, safeCount, velocityX, velocityY);

      // ONE state update, ONE cleanup timer, ONE spray call — no forEach, no timers
      addFlyOuts(batch, batchDuration(safeCount));
      spray(safeCount);
    },
    [visibleNotesRef, noteValueRef, remainingRef, addFlyOuts, spray],
  );
}