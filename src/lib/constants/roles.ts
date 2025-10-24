/**
 * Role ID Constants
 *
 * CRITICAL: NEVER use hardcoded role IDs in the codebase.
 * Always import and use these constants to ensure consistency and type safety.
 *
 * @example
 * ```typescript
 * import { ROLE_IDS } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * if (user.roleId === ROLE_IDS.NEWTON_ADMIN) { ... }
 *
 * // ❌ WRONG
 * if (user.roleId === "r_newton_admin") { ... }
 * ```
 */

export const ROLE_IDS = {
  // Global Admin
  NEWTON_ADMIN: "r_newton_admin",

  // Mine Company Roles
  ALLOCATION_OFFICER: "r_allocation_officer",
  SITE_ADMIN: "r_site_admin",

  // Logistics Company Roles
  LOGISTICS_COORDINATOR: "r_logistics_coordinator",

  // Transporter Company Roles
  TRANSPORTER: "r_transporter",

  // Operational Roles
  INDUCTION_OFFICER: "r_induction_officer",
  WEIGHBRIDGE_SUPERVISOR: "r_weighbridge_supervisor",
  WEIGHBRIDGE_OPERATOR: "r_weighbridge_operator",
  SECURITY: "r_security",

  // Contact Role
  CONTACT: "r_contact",
} as const

export type RoleId = typeof ROLE_IDS[keyof typeof ROLE_IDS]
