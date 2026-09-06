import { create } from "zustand";

export const YEAR_MIN = 2024;
export const YEAR_MAX = 2045;

type AppState = {
  year: number;
  setYear: (year: number) => void;
  lucienOpen: boolean;
  setLucienOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  fieldYaw: number;
  fieldPitch: number;
  fieldProgress: number;
  fieldDragging: boolean;
  fieldTouched: boolean;
  nudgeField: (dx: number, dy: number) => void;
  setFieldDragging: (dragging: boolean) => void;
  setFieldProgress: (progress: number) => void;
  markFieldTouched: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  year: 2026,
  setYear: (year) => set({ year }),
  lucienOpen: false,
  setLucienOpen: (lucienOpen) => set({ lucienOpen }),
  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  fieldYaw: 0,
  fieldPitch: 0,
  fieldProgress: 0,
  fieldDragging: false,
  fieldTouched: false,
  nudgeField: (dx, dy) =>
    set((s) => ({
      fieldYaw: Math.max(-0.85, Math.min(0.85, s.fieldYaw + dx)),
      fieldPitch: Math.max(-0.92, Math.min(0.92, s.fieldPitch + dy)),
    })),
  setFieldDragging: (fieldDragging) => set({ fieldDragging }),
  setFieldProgress: (fieldProgress) => set({ fieldProgress }),
  markFieldTouched: () => set({ fieldTouched: true }),
}));
