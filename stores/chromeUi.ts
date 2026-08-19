import { create } from 'zustand';

type ChromeUi = {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

export const useChromeUi = create<ChromeUi>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}));
