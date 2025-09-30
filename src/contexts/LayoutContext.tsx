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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load layout preference from localStorage
    const savedLayout = localStorage.getItem("newton-layout-preference") as LayoutType
    if (savedLayout && (savedLayout === "sidebar" || savedLayout === "top")) {
      setLayoutState(savedLayout)
    }
  }, [])

  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout)
    if (mounted) {
      localStorage.setItem("newton-layout-preference", newLayout)
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
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
