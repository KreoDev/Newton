import type { User, Role } from "@/types"
import type { PermissionKey } from "@/lib/permissions"

export class PermissionService {
  /**
   * Evaluate if a user has a specific permission
   * Evaluation order: user.isGlobal → user.permissionOverrides → role.permissionKeys
   */
  static evaluatePermission(user: User | null, role: Role | null, permission: PermissionKey): boolean {
    if (!user) {
      return false
    }

    // 1. Global users have all permissions
    if (user.isGlobal) {
      return true
    }

    // 2. Check permission overrides (per-user permission adjustments)
    if (user.permissionOverrides && permission in user.permissionOverrides) {
      return user.permissionOverrides[permission]
    }

    // 3. Check role permissions
    if (!role) {
      return false
    }

    // Wildcard permission grants all access
    if (role.permissionKeys.includes("*")) {
      return true
    }

    // Check specific permission
    return role.permissionKeys.includes(permission)
  }

  /**
   * Evaluate multiple permissions (returns object with results)
   */
  static evaluateMultiple(user: User | null, role: Role | null, permissions: PermissionKey[]): Record<string, boolean> {
    const results: Record<string, boolean> = {}

    for (const permission of permissions) {
      results[permission] = this.evaluatePermission(user, role, permission)
    }

    return results
  }

  /**
   * Check if user has ANY of the given permissions
   */
  static hasAnyPermission(user: User | null, role: Role | null, permissions: PermissionKey[]): boolean {
    return permissions.some(permission => this.evaluatePermission(user, role, permission))
  }

  /**
   * Check if user has ALL of the given permissions
   */
  static hasAllPermissions(user: User | null, role: Role | null, permissions: PermissionKey[]): boolean {
    return permissions.every(permission => this.evaluatePermission(user, role, permission))
  }
}
