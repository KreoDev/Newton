"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { Role } from "@/types"
import type { PermissionKey } from "@/lib/permissions"
import { data as globalData } from "@/services/data.service"

export function usePermission(permission: PermissionKey): { hasPermission: boolean; loading: boolean } {
  const { user } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function checkPermission() {
      if (!user) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      try {
        // Evaluation order: permissionOverrides → isGlobal → role.permissionKeys
        // Overrides are checked FIRST to allow revoking permissions from global users

        // 1. Check permission overrides (per-user permission adjustments)
        if (user.permissionOverrides && permission in user.permissionOverrides) {
          const override = user.permissionOverrides[permission]
          setHasPermission(override)
          setLoading(false)
          return
        }

        // 2. Global users have all permissions (unless overridden above)
        if (user.isGlobal) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // 3. Get role from centralized data service (in-memory, real-time)
        const role = globalData.roles.value.find((r: Role) => r.id === user.roleId)

        if (!role) {
          setHasPermission(false)
          setLoading(false)
          return
        }

        // Check if role has wildcard permission
        if (role.permissionKeys.includes("*")) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // Check if role has specific permission
        const hasIt = role.permissionKeys.includes(permission)
        setHasPermission(hasIt)
        setLoading(false)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasPermission(false)
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, permission])

  return { hasPermission, loading }
}
