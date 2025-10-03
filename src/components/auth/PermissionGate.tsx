"use client"

import { usePermission } from "@/hooks/usePermission"
import type { PermissionKey } from "@/lib/permissions"
import type { ReactNode } from "react"

interface PermissionGateProps {
  permission: PermissionKey
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
