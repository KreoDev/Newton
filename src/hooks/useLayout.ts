"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

type LayoutType = "sidebar" | "top"

interface LayoutStore {
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
}

export const useLayout = create<LayoutStore>()(
  persist(
    (set) => ({
      layout: "sidebar",
      setLayout: (layout) => set({ layout }),
    }),
    {
      name: "newton-layout-preference",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
