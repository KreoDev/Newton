"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useCompany } from "@/contexts/CompanyContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { getPermissionCategoriesForCompanyType } from "@/lib/permission-config"

interface PermissionSelectorProps {
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
  const { user: currentUser } = useAuth()
  const { company } = useCompany()
  const { hasPermission: canManageGlobalAdmins } = usePermission(PERMISSIONS.ADMIN_USERS_MANAGE_GLOBAL_ADMINS)

  // Get permissions for current company type and filter based on user capabilities
  const getFilteredPermissions = () => {
    if (!company) return {}

    // Get company-type-specific permissions
    const baseCategories = getPermissionCategoriesForCompanyType(company.companyType)
    const filteredCategories = { ...baseCategories }

    // Only global admins with manageGlobalAdmins permission can see/assign that permission
    if (filteredCategories.Administrative && (!currentUser?.isGlobal || !canManageGlobalAdmins)) {
      filteredCategories.Administrative = filteredCategories.Administrative.filter(
        p => p.key !== "admin.users.manageGlobalAdmins"
      )
    }

    return filteredCategories
  }

  const PERMISSION_CATEGORIES = getFilteredPermissions()
  const togglePermission = (permissionKey: string) => {
    if (selectedPermissions.includes(permissionKey)) {
      onChange(selectedPermissions.filter(key => key !== permissionKey))
    } else {
      onChange([...selectedPermissions, permissionKey])
    }
  }

  const toggleCategory = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    const categoryPermissionStrings = categoryPermissions as string[]
    const allSelected = categoryPermissionStrings.every(key => selectedPermissions.includes(key))

    if (allSelected) {
      // Deselect all in category
      onChange(selectedPermissions.filter(key => !categoryPermissionStrings.includes(key)))
    } else {
      // Select all in category
      const newPermissions = [...selectedPermissions]
      categoryPermissionStrings.forEach(key => {
        if (!newPermissions.includes(key)) {
          newPermissions.push(key)
        }
      })
      onChange(newPermissions)
    }
  }

  const isCategorySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    const categoryPermissionStrings = categoryPermissions as string[]
    return categoryPermissionStrings.every(key => selectedPermissions.includes(key))
  }

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES].map(p => p.key)
    const categoryPermissionStrings = categoryPermissions as string[]
    const selectedCount = categoryPermissionStrings.filter(key => selectedPermissions.includes(key)).length
    return selectedCount > 0 && selectedCount < categoryPermissionStrings.length
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 pb-2">
        <Label>Permissions</Label>
      </div>
      <div className="flex-1 border rounded-md p-4 overflow-y-auto space-y-6">
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
      <div className="flex-shrink-0 pt-2">
        <p className="text-xs text-muted-foreground">{selectedPermissions.length} permission(s) selected</p>
      </div>
    </div>
  )
}
