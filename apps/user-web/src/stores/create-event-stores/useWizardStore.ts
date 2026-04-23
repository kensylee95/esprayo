import { create } from "zustand";

type WizardStore = {
  step: number;
  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
};

export const useWizardStore = create<WizardStore>((set, get) => ({
  step: 1,
  setStep: (step) => set({ step }),
  next: () => set({ step: Math.min(get().step + 1, 4) }),
  back: () => set({ step: Math.max(get().step - 1, 1) }),
}));
