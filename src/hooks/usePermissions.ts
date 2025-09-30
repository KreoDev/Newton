import { useState, useEffect, useMemo } from "react"
import { Role } from "@/types"
import { data } from "@/services/data.service"

export function usePermissions(initialPermissions?: Role["permissions"]) {
  const stableInitialPermissions = useMemo(() => initialPermissions || {}, [initialPermissions])

  const [permissions, setPermissions] = useState<Role["permissions"]>(stableInitialPermissions)
  const appPermissions = data.appPermissions.value

  useEffect(() => {
    setPermissions(stableInitialPermissions)
  }, [stableInitialPermissions])

  const handlePermissionChange = (module: string, action: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value,
      },
    }))
  }

  const selectAll = (module: string) => {
    if (!appPermissions || !appPermissions[module]) return
    const allModuleActions = Object.keys(appPermissions[module]).reduce((acc, action) => {
      acc[action] = true
      return acc
    }, {} as Record<string, boolean>)

    setPermissions(prev => ({
      ...prev,
      [module]: allModuleActions,
    }))
  }

  const deselectAll = (module: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {},
    }))
  }

  return {
    permissions,
    setPermissions,
    handlePermissionChange,
    selectAll,
    deselectAll,
  }
}
