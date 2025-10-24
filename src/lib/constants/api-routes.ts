/**
 * API Routes
 *
 * CRITICAL: NEVER use hardcoded API endpoint paths in the codebase.
 * Always import and use these constants to ensure consistency and prevent typos.
 *
 * @example
 * ```typescript
 * import { API_ROUTES } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * await fetch(API_ROUTES.USERS.CREATE, { method: "POST", body: ... })
 *
 * // ❌ WRONG
 * await fetch("/api/users/create", { method: "POST", body: ... })
 * ```
 */

export const API_ROUTES = {
  USERS: {
    CREATE: "/api/users/create",
    DELETE: "/api/users/delete",
    BULK_DELETE: "/api/users/bulk-delete",
    UPDATE_EMAIL: "/api/users/update-email",
    CHANGE_PASSWORD: "/api/users/change-password",
    CONVERT_TO_LOGIN: "/api/users/convert-to-login",
    CONVERT_TO_CONTACT: "/api/users/convert-to-contact",
  },
  SEED: "/api/seed",
} as const
