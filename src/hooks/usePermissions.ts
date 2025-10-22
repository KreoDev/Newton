import { useState, useEffect, useMemo } from "react"
import type { PermissionKey } from "@/lib/permissions"

export function usePermissions(initialPermissions?: string[]) {
  const stableInitialPermissions = useMemo(() => initialPermissions || [], [initialPermissions])

  const [permissionKeys, setPermissionKeys] = useState<string[]>(stableInitialPermissions)

  useEffect(() => {
    setPermissionKeys(stableInitialPermissions)
  }, [stableInitialPermissions])

  const addPermission = (permission: PermissionKey) => {
    setPermissionKeys(prev => (prev.includes(permission) ? prev : [...prev, permission]))
  }

  const removePermission = (permission: PermissionKey) => {
    setPermissionKeys(prev => prev.filter(p => p !== permission))
  }

  const togglePermission = (permission: PermissionKey) => {
    setPermissionKeys(prev => (prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]))
  }

  const hasPermission = (permission: PermissionKey) => {
    return permissionKeys.includes("*") || permissionKeys.includes(permission)
  }

  return {
    permissionKeys,
    setPermissionKeys,
    addPermission,
    removePermission,
    togglePermission,
    hasPermission,
  }
}
