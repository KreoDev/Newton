import type { Role } from "@/types"

/**
 * Check if a role is visible for a specific company
 * A role is visible if:
 * 1. It's globally active (isActive === true)
 * 2. AND it's not hidden for the specified company
 *
 * @param role - The role to check
 * @param companyId - The company ID to check visibility for
 * @returns true if the role is visible for the company, false otherwise
 */
export function isRoleVisibleForCompany(role: Role, companyId: string): boolean {
  // Role must be globally active
  if (!role.isActive) {
    return false
  }

  // Role must not be hidden for this specific company
  if (role.hiddenForCompanies?.includes(companyId)) {
    return false
  }

  return true
}

/**
 * Filter roles to only include those visible for a specific company
 *
 * @param roles - Array of roles to filter
 * @param companyId - The company ID to filter for
 * @returns Filtered array of roles visible for the company
 */
export function filterVisibleRoles(roles: Role[], companyId: string): Role[] {
  return roles.filter(role => isRoleVisibleForCompany(role, companyId))
}
