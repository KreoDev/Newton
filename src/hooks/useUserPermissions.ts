import { useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { PermissionService } from "@/services/permission.service"
import type { PermissionKey } from "@/lib/permissions"

/**
 * Hook for checking multiple user permissions at once
 * Returns computed permission states with loading indicator
 */
export function useUserPermissions(permissions: PermissionKey[]) {
  useSignals() // Required for reactivity
  const { user } = useAuth()

  const roles = globalData.roles.value
  const loading = globalData.loading.value

  const result = useMemo(() => {
    if (!user) {
      return {
        hasAny: false,
        hasAll: false,
        effective: [] as PermissionKey[],
        individual: {} as Record<PermissionKey, boolean>,
      }
    }

    const role = roles.find(r => r.id === user.roleId)

    // Check each permission
    const individual = permissions.reduce((acc, permission) => {
      acc[permission] = PermissionService.evaluatePermission(user, role || null, permission)
      return acc
    }, {} as Record<PermissionKey, boolean>)

    // Get effective permissions (permissions user actually has)
    const effective = permissions.filter(permission => individual[permission])

    // Check if user has any or all permissions
    const hasAny = effective.length > 0
    const hasAll = effective.length === permissions.length

    return {
      hasAny,
      hasAll,
      effective,
      individual,
    }
  }, [user, roles, permissions])

  return {
    ...result,
    loading,
    isReady: !loading && Boolean(user),
  }
}

/**
 * Hook for checking if user has any of the given permissions
 * Simplified version of useUserPermissions for common use case
 */
export function useHasAnyPermission(permissions: PermissionKey[]): {
  hasPermission: boolean
  loading: boolean
} {
  useSignals()
  const { user } = useAuth()
  const roles = globalData.roles.value
  const loading = globalData.loading.value

  const hasPermission = useMemo(() => {
    if (!user) return false
    const role = roles.find(r => r.id === user.roleId)
    return PermissionService.hasAnyPermission(user, role || null, permissions)
  }, [user, roles, permissions])

  return { hasPermission, loading }
}

/**
 * Hook for checking if user has all of the given permissions
 */
export function useHasAllPermissions(permissions: PermissionKey[]): {
  hasPermission: boolean
  loading: boolean
} {
  useSignals()
  const { user } = useAuth()
  const roles = globalData.roles.value
  const loading = globalData.loading.value

  const hasPermission = useMemo(() => {
    if (!user) return false
    const role = roles.find(r => r.id === user.roleId)
    return PermissionService.hasAllPermissions(user, role || null, permissions)
  }, [user, roles, permissions])

  return { hasPermission, loading }
}
