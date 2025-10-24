/**
 * Firestore Collection Names
 *
 * CRITICAL: NEVER use hardcoded collection names in the codebase.
 * Always import and use these constants to ensure consistency and type safety.
 *
 * @example
 * ```typescript
 * import { COLLECTIONS } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * collection(db, COLLECTIONS.ORDERS)
 *
 * // ❌ WRONG
 * collection(db, "orders")
 * ```
 */

export const COLLECTIONS = {
  USERS: "users",
  ORDERS: "orders",
  ASSETS: "assets",
  ROLES: "roles",
  PRODUCTS: "products",
  CLIENTS: "clients",
  SITES: "sites",
  GROUPS: "groups",
  COMPANIES: "companies",
  WEIGHING_RECORDS: "weighing_records",
  PRE_BOOKINGS: "pre_bookings",
  NOTIFICATION_TEMPLATES: "notification_templates",
  TRANSPORTERS: "transporters",
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
