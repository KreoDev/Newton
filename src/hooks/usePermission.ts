"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import type { Role } from "@/types"
import type { PermissionKey } from "@/lib/permissions"

// Cache for roles to avoid repeated Firestore queries
const roleCache = new Map<string, Role>()

export function usePermission(permission: PermissionKey): boolean {
  const { user } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setHasPermission(false)
        setLoading(false)
        return
      }

      try {
        // Evaluation order: isGlobal → permissionOverrides → role.permissionKeys

        // 1. Global users have all permissions
        if (user.isGlobal) {
          setHasPermission(true)
          setLoading(false)
          return
        }

        // 2. Check permission overrides (per-user permission adjustments)
        if (user.permissionOverrides && permission in user.permissionOverrides) {
          const override = user.permissionOverrides[permission]
          setHasPermission(override)
          setLoading(false)
          return
        }

        // 3. Fetch role and check permission keys
        let role: Role | null = null

        // Check cache first
        if (roleCache.has(user.roleId)) {
          role = roleCache.get(user.roleId)!
        } else {
          // Fetch from Firestore
          const roleDoc = await getDoc(doc(db, "roles", user.roleId))
          if (roleDoc.exists()) {
            role = { id: roleDoc.id, ...roleDoc.data() } as Role
            // Cache the role
            roleCache.set(user.roleId, role)
          }
        }

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

  return hasPermission
}

// Clear role cache when needed (e.g., after role updates)
export function clearRoleCache() {
  roleCache.clear()
}
