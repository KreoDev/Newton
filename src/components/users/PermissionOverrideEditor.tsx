"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { updateDocument } from "@/lib/firebase-utils"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface PermissionOverrideEditorProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
  viewOnly?: boolean
}

// Simplified permission categories
const PERMISSION_CATEGORIES = {
  "Asset Management": [
    { key: "assets.view", label: "View Assets" },
    { key: "assets.add", label: "Add Assets" },
    { key: "assets.edit", label: "Edit Assets" },
    { key: "assets.delete", label: "Delete Assets" },
  ],
  "Order Management": [
    { key: "orders.view", label: "View Orders" },
    { key: "orders.create", label: "Create Orders" },
    { key: "orders.allocate", label: "Allocate Orders" },
    { key: "orders.edit", label: "Edit Orders" },
    { key: "orders.cancel", label: "Cancel Orders" },
  ],
  "Administrative": [
    { key: "admin.users", label: "User Management" },
    { key: "admin.users.manageGlobalAdmins", label: "Manage Global Admins" },
    { key: "admin.users.managePermissions", label: "Manage Permissions" },
    { key: "admin.users.viewAllCompanies", label: "View All Companies (Users)" },
    { key: "admin.companies", label: "Company Management" },
    { key: "admin.roles", label: "Role Management" },
    { key: "admin.products", label: "Product Management" },
    { key: "admin.clients", label: "Client Management" },
    { key: "admin.sites", label: "Site Management" },
  ],
}

const ACCESS_LEVELS = [
  { value: "default", label: "Use Role Default" },
  { value: "none", label: "No Access" },
  { value: "view", label: "View Only" },
  { value: "full", label: "Full Access" },
]

export function PermissionOverrideEditor({ open, onClose, onSuccess, user, viewOnly = false }: PermissionOverrideEditorProps) {
  const { showSuccess, showError } = useAlert()
  const { user: currentUser } = useAuth()
  const { hasPermission: canManagePermissions } = usePermission(PERMISSIONS.ADMIN_USERS_MANAGE_PERMISSIONS)
  const { hasPermission: canManageGlobalAdmins } = usePermission(PERMISSIONS.ADMIN_USERS_MANAGE_GLOBAL_ADMINS)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Filter permissions based on current user's capabilities
  const getFilteredPermissions = () => {
    const filteredCategories = { ...PERMISSION_CATEGORIES }

    // Only global admins with manageGlobalAdmins permission can see/assign that permission
    if (!currentUser?.isGlobal || !canManageGlobalAdmins) {
      filteredCategories.Administrative = filteredCategories.Administrative.filter(
        p => p.key !== "admin.users.manageGlobalAdmins"
      )
    }

    return filteredCategories
  }

  useEffect(() => {
    if (user && open) {
      // Initialize with user's current permission overrides
      // Convert permission overrides to string format for the UI
      const initialOverrides: Record<string, string> = {}
      if (user.permissionOverrides) {
        // For each permission in the categories, determine its state
        Object.values(PERMISSION_CATEGORIES).forEach(permissions => {
          permissions.forEach(permission => {
            const baseKey = permission.key
            const viewKey = `${baseKey}.view`

            const hasManagePermission = user.permissionOverrides?.[baseKey]
            const hasViewPermission = user.permissionOverrides?.[viewKey]

            // Determine the current state based on what's set
            if (hasManagePermission === true) {
              // Has full manage permission
              initialOverrides[baseKey] = "full"
            } else if (hasViewPermission === true) {
              // Has view-only permission
              initialOverrides[baseKey] = "view"
            } else if (hasManagePermission === false || hasViewPermission === false) {
              // Explicitly denied
              initialOverrides[baseKey] = "none"
            }
            // If neither is set, it will use role default (not added to overrides)
          })
        })
      }
      setOverrides(initialOverrides)
    }
  }, [user, open])

  const handleOverrideChange = (permissionKey: string, value: string) => {
    if (value === "default") {
      // Remove override (use default from role)
      const newOverrides = { ...overrides }
      delete newOverrides[permissionKey]
      setOverrides(newOverrides)
    } else {
      setOverrides({
        ...overrides,
        [permissionKey]: value,
      })
    }
  }

  const handleReset = () => {
    setOverrides({})
    showSuccess("Overrides Cleared", "Permission overrides have been cleared.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Convert string overrides to the correct permission keys
      const booleanOverrides: Record<string, boolean> = {}

      Object.entries(overrides).forEach(([key, value]) => {
        const viewKey = `${key}.view`

        if (value === "view") {
          // View Only: Set view permission to true, manage permission to false
          booleanOverrides[viewKey] = true
          booleanOverrides[key] = false
        } else if (value === "full") {
          // Full Access: Set manage permission to true
          booleanOverrides[key] = true
          // Optionally also grant view permission explicitly
          booleanOverrides[viewKey] = true
        } else if (value === "none") {
          // No Access: Set both to false
          booleanOverrides[viewKey] = false
          booleanOverrides[key] = false
        }
        // "default" is not in overrides, so nothing is added
      })

      const userData: any = {
        permissionOverrides: booleanOverrides,
      }

      await updateDocument("users", user.id, userData)
      showSuccess("Permissions Updated", `Permission overrides for ${user.firstName} ${user.lastName} have been updated successfully.`)

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating user permissions:", error)
      showError("Failed to Update Permissions", error instanceof Error ? error.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const hasOverrides = Object.keys(overrides).length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{viewOnly ? "View Permission Overrides" : "Edit Permission Overrides"}</DialogTitle>
          <DialogDescription>
            {viewOnly ? `View permissions for ${user.firstName} ${user.lastName}` : `Customize permissions for ${user.firstName} ${user.lastName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={viewOnly || !canManagePermissions} className="space-y-4">
          {!viewOnly && !canManagePermissions && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">
                <strong>Permission Denied:</strong> You don&apos;t have permission to manage permission overrides. Contact your administrator to grant you &quot;Manage Permissions&quot; access.
              </p>
            </div>
          )}

          <div className="border rounded-md p-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              These overrides will take precedence over permissions inherited from assigned roles.
              {hasOverrides && (
                <span className="block mt-1 text-primary">
                  Currently {Object.keys(overrides).length} override(s) active
                </span>
              )}
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(getFilteredPermissions()).map(([category, permissions]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">{category}</Label>
                </div>
                <div className="space-y-2 pl-4">
                  {permissions.map(permission => {
                    const currentValue = overrides[permission.key] || "default"
                    const hasOverride = overrides[permission.key] !== undefined

                    return (
                      <div key={permission.key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{permission.label}</span>
                          {hasOverride && <Badge variant="secondary" className="text-xs">Overridden</Badge>}
                        </div>
                        <select
                          value={currentValue}
                          onChange={e => handleOverrideChange(permission.key, e.target.value)}
                          className="border rounded-md px-2 py-1 text-sm bg-background w-[180px]"
                        >
                          {ACCESS_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          </fieldset>

          {viewOnly ? (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleReset} disabled={!hasOverrides || loading}>
                Reset to Defaults
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
