"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type LayoutType = "sidebar" | "top"

interface LayoutContextType {
  layout: LayoutType
  setLayout: (layout: LayoutType) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutType>("sidebar")

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedLayout = localStorage.getItem("newton-layout-preference") as LayoutType | null
    if (savedLayout === "sidebar" || savedLayout === "top") {
      setLayoutState(savedLayout)
    }
  }, [])

  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout)
    if (typeof window !== "undefined") {
      localStorage.setItem("newton-layout-preference", newLayout)
    }
  }

  return <LayoutContext.Provider value={{ layout, setLayout }}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
