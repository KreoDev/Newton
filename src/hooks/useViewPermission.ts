import { usePermission } from "@/hooks/usePermission"
import type { PermissionKey } from "@/lib/permissions"

/**
 * Hook to check if user has view-only or full manage permission for a module
 * @param viewPermission - The view-only permission key (e.g., "admin.users.view")
 * @param managePermission - The full manage permission key (e.g., "admin.users")
 * @returns Object with canView, canManage, and loading states
 */
export function useViewPermission(viewPermission: PermissionKey, managePermission: PermissionKey) {
  const { hasPermission: hasViewPermission, loading: viewLoading } = usePermission(viewPermission)
  const { hasPermission: hasManagePermission, loading: manageLoading } = usePermission(managePermission)

  return {
    canView: hasViewPermission || hasManagePermission, // Can view if has either permission
    canManage: hasManagePermission, // Can manage only if has full permission
    isViewOnly: hasViewPermission && !hasManagePermission, // View-only mode
    loading: viewLoading || manageLoading,
  }
}
