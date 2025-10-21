"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateDocument } from "@/lib/firebase-utils"
import { toast } from "sonner"

type AssetView = "card" | "table"

export function useAssetViewPreference() {
  const { user, refreshUser } = useAuth()
  const [view, setView] = useState<AssetView>("card") // Default to card view
  const [loading, setLoading] = useState(false)

  // Initialize from user preference
  useEffect(() => {
    if (user?.preferredAssetView) {
      setView(user.preferredAssetView)
    } else {
      setView("card") // Default
    }
  }, [user])

  const updateView = async (newView: AssetView) => {
    if (!user) {
      toast.error("You must be logged in to save preferences")
      return
    }

    setLoading(true)
    try {
      // Update Firestore
      await updateDocument("users", user.id, {
        preferredAssetView: newView,
      })

      // Update local state immediately
      setView(newView)

      // Refresh user context to get updated preference
      await refreshUser()

      toast.success(`Assets view changed to ${newView} view`)
    } catch (error) {
      console.error("Error updating asset view preference:", error)
      toast.error("Failed to save view preference")
    } finally {
      setLoading(false)
    }
  }

  return { view, updateView, loading }
}
