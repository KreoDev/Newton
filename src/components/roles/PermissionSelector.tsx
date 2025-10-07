"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface PermissionSelectorProps {
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
}

// Permission structure with categories
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
  "Pre-Booking Management": [
    { key: "prebookings.view", label: "View Pre-Bookings" },
    { key: "prebookings.create", label: "Create Pre-Bookings" },
    { key: "prebookings.edit", label: "Edit Pre-Bookings" },
    { key: "prebookings.cancel", label: "Cancel Pre-Bookings" },
  ],
  "Operational Flow": [
    { key: "operations.securityIn", label: "Security Checkpoint - Entry" },
    { key: "operations.securityOut", label: "Security Checkpoint - Exit" },
    { key: "operations.weighbridgeTare", label: "Weighbridge Tare Weight" },
    { key: "operations.weighbridgeGross", label: "Weighbridge Gross Weight" },
  ],
  "Administrative": [
    { key: "admin.users", label: "User Management" },
    { key: "admin.companies", label: "Company Management" },
    { key: "admin.roles", label: "Role Management" },
    { key: "admin.products", label: "Product Management" },
    { key: "admin.clients", label: "Client Management" },
    { key: "admin.sites", label: "Site Management" },
    { key: "admin.weighbridges", label: "Weighbridge Management" },
    { key: "admin.notifications", label: "Notification Templates" },
    { key: "admin.systemSettings", label: "System-Wide Settings" },
    { key: "admin.securityAlerts", label: "Security Alert Configuration" },
  ],
  "Reporting": [
    { key: "reports.view", label: "View Reports" },
    { key: "reports.export", label: "Export Reports" },
  ],
  "Transporter-Specific": [
    { key: "transporter.viewOnlyAssigned", label: "View Only Assigned Orders" },
    { key: "transporter.viewOtherTransporters", label: "View Other Transporters' Data" },
  ],
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const togglePermission = (permissionKey: string) => {
    if (selectedPermissions.includes(permissionKey)) {
      onChange(selectedPermissions.filter(key => key !== permissionKey))
    } else {
      onChange([...selectedPermissions, permissionKey])
    }
  }

  const toggleCategory = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    const allSelected = categoryPermissions.every(key => selectedPermissions.includes(key))

    if (allSelected) {
      // Deselect all in category
      onChange(selectedPermissions.filter(key => !categoryPermissions.includes(key)))
    } else {
      // Select all in category
      const newPermissions = [...selectedPermissions]
      categoryPermissions.forEach(key => {
        if (!newPermissions.includes(key)) {
          newPermissions.push(key)
        }
      })
      onChange(newPermissions)
    }
  }

  const isCategorySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    return categoryPermissions.every(key => selectedPermissions.includes(key))
  }

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    const selectedCount = categoryPermissions.filter(key => selectedPermissions.includes(key)).length
    return selectedCount > 0 && selectedCount < categoryPermissions.length
  }

  return (
    <div className="space-y-6">
      <Label>Permissions</Label>
      <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto space-y-6">
        {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
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
                {isCategorySelected(category) ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="space-y-2 pl-4">
              {permissions.map(permission => (
                <div key={permission.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission.key}
                    checked={selectedPermissions.includes(permission.key)}
                    onCheckedChange={() => togglePermission(permission.key)}
                  />
                  <Label htmlFor={permission.key} className="cursor-pointer text-sm font-normal">
                    {permission.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{selectedPermissions.length} permission(s) selected</p>
    </div>
  )
}
