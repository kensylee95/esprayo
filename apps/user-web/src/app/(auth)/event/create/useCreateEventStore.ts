// stores/create-event-stores/useWizardStore.ts
import { create } from "zustand";
import type { EventType } from "./review/types";

export type CreateEventState = {
  step: number;

  // form fields
  type: EventType | null;
  title: string;
  venue: string;
  welcomeMessage: string;

  // actions
  setStep: (step: number) => void;
  setType: (type: EventType) => void;
  setField: (
    field: "title" | "venue" | "welcomeMessage",
    value: string,
  ) => void;

  resetForm: () => void;
};

export const useCreateEventStore = create<CreateEventState>((set) => ({
  step: 1,

  type: null,
  title: "",
  venue: "",
  welcomeMessage: "",

  setStep: (step) => set({ step }),

  setType: (type) => set({ type }),

  setField: (field, value) =>
    set((state) => ({
      ...state,
      [field]: value,
    })),

  resetForm: () =>
    set({
      step: 1,
      type: null,
      title: "",
      venue: "",
      welcomeMessage: "",
    }),
}));
