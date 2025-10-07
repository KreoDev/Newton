"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { User } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { updateDocument } from "@/lib/firebase-utils"

interface NotificationPreferencesEditorProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
}

const DEFAULT_PREFERENCES = {
  // Asset Notifications
  "asset.added": true,
  "asset.inactive": false,
  "asset.edited": true,
  "asset.deleted": true,

  // Order Notifications
  "order.created": true,
  "order.allocated": true,
  "order.cancelled": false,
  "order.completed": true,
  "order.expiring": true,

  // Weighbridge Notifications
  "weighbridge.overload": true,
  "weighbridge.underweight": true,
  "weighbridge.violations": true,
  "weighbridge.manualOverride": true,

  // Security Notifications
  "security.invalidLicense": true,
  "security.unbookedArrival": true,
  "security.noActiveOrder": true,
  "security.sealMismatch": true,
  "security.incorrectSealsNo": true,
  "security.unregisteredAsset": true,
  "security.inactiveEntity": true,
  "security.incompleteTruck": true,

  // Pre-Booking Notifications
  "preBooking.created": true,
  "preBooking.lateArrival": true,

  // Driver Notifications
  "driver.licenseExpiring7": true,
  "driver.licenseExpiring30": true,
}

const NOTIFICATION_CATEGORIES = {
  "Asset Notifications": [
    { key: "asset.added", label: "Asset Added" },
    { key: "asset.inactive", label: "Asset Made Inactive" },
    { key: "asset.edited", label: "Asset Edited" },
    { key: "asset.deleted", label: "Asset Deleted" },
  ],
  "Order Notifications": [
    { key: "order.created", label: "Order Created" },
    { key: "order.allocated", label: "Order Allocated" },
    { key: "order.cancelled", label: "Order Cancelled" },
    { key: "order.completed", label: "Order Completed" },
    { key: "order.expiring", label: "Order Expiring Soon" },
  ],
  "Weighbridge Notifications": [
    { key: "weighbridge.overload", label: "Overload Detected" },
    { key: "weighbridge.underweight", label: "Underweight Detected" },
    { key: "weighbridge.violations", label: "Weight Limit Violations" },
    { key: "weighbridge.manualOverride", label: "Manual Weight Override Used" },
  ],
  "Security Notifications": [
    { key: "security.invalidLicense", label: "Invalid License Detected" },
    { key: "security.unbookedArrival", label: "Unbooked Vehicle Arrival" },
    { key: "security.noActiveOrder", label: "No Active Order" },
    { key: "security.sealMismatch", label: "Seal Mismatch" },
    { key: "security.incorrectSealsNo", label: "Incorrect Seal Quantity" },
    { key: "security.unregisteredAsset", label: "Unregistered Asset" },
    { key: "security.inactiveEntity", label: "Inactive Entity Detected" },
    { key: "security.incompleteTruck", label: "Incomplete Truck Configuration" },
  ],
  "Pre-Booking Notifications": [
    { key: "preBooking.created", label: "Pre-Booking Created" },
    { key: "preBooking.lateArrival", label: "Late Arrival Alert" },
  ],
  "Driver Notifications": [
    { key: "driver.licenseExpiring7", label: "License Expiring in 7 Days" },
    { key: "driver.licenseExpiring30", label: "License Expiring in 30 Days" },
  ],
}

export function NotificationPreferencesEditor({ open, onClose, onSuccess, user }: NotificationPreferencesEditorProps) {
  const { showSuccess, showError } = useAlert()
  const [preferences, setPreferences] = useState<Record<string, boolean>>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && open) {
      // Merge user's preferences with defaults
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(user.notificationPreferences || {}),
      })
    }
  }, [user, open])

  const togglePreference = (key: string) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
  }

  const toggleCategory = (category: string) => {
    const categoryPrefs = NOTIFICATION_CATEGORIES[category as keyof typeof NOTIFICATION_CATEGORIES]
    const allEnabled = categoryPrefs.every(pref => preferences[pref.key])

    const newPreferences = { ...preferences }
    categoryPrefs.forEach(pref => {
      newPreferences[pref.key] = !allEnabled
    })
    setPreferences(newPreferences)
  }

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
    showSuccess("Preferences Reset", "Notification preferences have been reset to defaults.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      await updateDocument("users", user.id, { notificationPreferences: preferences })
      showSuccess("Preferences Updated", `Notification preferences for ${user.firstName} ${user.lastName} have been updated successfully.`)

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      showError("Failed to Update Preferences", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Manage email notification settings for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Select which notification types this user should receive via email
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(NOTIFICATION_CATEGORIES).map(([category, notifs]) => {
              const allEnabled = notifs.every(n => preferences[n.key])
              const someEnabled = notifs.some(n => preferences[n.key])

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{category}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      className="h-7 text-xs"
                    >
                      {allEnabled ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-4">
                    {notifs.map(notif => (
                      <div key={notif.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={notif.key}
                          checked={preferences[notif.key]}
                          onCheckedChange={() => togglePreference(notif.key)}
                        />
                        <Label htmlFor={notif.key} className="cursor-pointer text-sm font-normal">
                          {notif.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={resetToDefaults} disabled={loading}>
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
