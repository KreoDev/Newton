"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { userOperations } from "@/lib/firebase-utils"
import { useAlert } from "@/hooks/useAlert"
import { getNotificationCategoriesForCompanyType, type NotificationConfig } from "@/lib/notification-config"
import type { NotificationKey } from "@/types"

export function NotificationPreferencesTab() {
  const { user, refreshUser } = useAuth()
  const { company } = useCompany()
  const { showSuccess, showError } = useAlert()
  const [preferences, setPreferences] = useState<Record<NotificationKey, boolean>>({} as Record<NotificationKey, boolean>)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load user's current preferences
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences(user.notificationPreferences)
    }
  }, [user])

  // Get notification categories for current company type
  const notificationCategories = company ? getNotificationCategoriesForCompanyType(company.companyType) : {}

  const togglePreference = (key: NotificationKey) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  const toggleCategory = (categoryItems: NotificationConfig[], enable: boolean) => {
    setPreferences(prev => {
      const updated = { ...prev }
      categoryItems.forEach(item => {
        updated[item.key] = enable
      })
      return updated
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      await userOperations.update(user.id, {
        notificationPreferences: preferences,
      })
      await refreshUser()
      showSuccess("Saved", "Notification preferences updated successfully")
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      showError("Error", "Failed to save notification preferences")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || !company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive. Notifications are filtered based on your company type ({company.companyType}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(notificationCategories).map(([categoryName, categoryItems]) => {
            const allEnabled = categoryItems.every(item => preferences[item.key])
            const someEnabled = categoryItems.some(item => preferences[item.key])
            const noneEnabled = !someEnabled

            return (
              <div key={categoryName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{categoryName}</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(categoryItems, true)}
                      disabled={allEnabled}
                    >
                      Enable All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(categoryItems, false)}
                      disabled={noneEnabled}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  {categoryItems.map(item => (
                    <div key={item.key} className="flex items-start space-x-3">
                      <Checkbox
                        id={item.key}
                        checked={preferences[item.key] || false}
                        onCheckedChange={() => togglePreference(item.key)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={item.key} className="cursor-pointer font-medium">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      )}
    </div>
  )
}
