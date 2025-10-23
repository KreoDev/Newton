"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { updateDocument } from "@/lib/firebase-utils"
import { toast } from "sonner"

export type ListView = "card" | "table"

/**
 * Universal list view preference hook
 * Used for all entity list pages (Products, Clients, Sites, Roles, Companies, etc.)
 *
 * Includes backward compatibility for old preferredAssetView field
 */
export function useListViewPreference() {
  const { user, refreshUser } = useAuth()
  const [view, setView] = useState<ListView>("card") // Default to card view
  const [loading, setLoading] = useState(false)

  // Initialize from user preference with backward compatibility
  useEffect(() => {
    if (user) {
      // Prefer new field, fallback to old field, default to card
      const preferredView = user.preferredListView || user.preferredAssetView || "card"
      setView(preferredView)
    } else {
      setView("card") // Default when no user
    }
  }, [user])

  const updateView = async (newView: ListView) => {
    if (!user) {
      toast.error("You must be logged in to save preferences")
      return
    }

    setLoading(true)
    try {
      // Update Firestore with new field name
      await updateDocument("users", user.id, {
        preferredListView: newView,
      })

      // Update local state immediately
      setView(newView)

      // Refresh user context to get updated preference
      await refreshUser()

      toast.success(`List view changed to ${newView} view`)
    } catch (error) {
      toast.error("Failed to save view preference")
    } finally {
      setLoading(false)
    }
  }

  return { view, updateView, loading }
}
