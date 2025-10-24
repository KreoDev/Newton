/**
 * Constants Index
 *
 * Central export point for all application constants.
 * Import constants from this file to ensure consistency and type safety.
 *
 * @example
 * ```typescript
 * import { COLLECTIONS, TIME, DEFAULTS, API_ROUTES, ROLE_IDS, NOTIFICATION_TEMPLATES, UPLOAD } from "@/lib/constants"
 *
 * // Use constants throughout your application
 * collection(db, COLLECTIONS.ORDERS)
 * const days = Math.ceil(duration / TIME.MS_PER_DAY)
 * const maxDays = DEFAULTS.ORDER_HISTORY_DAYS.max
 * await fetch(API_ROUTES.USERS.CREATE, { ... })
 * if (roleId === ROLE_IDS.NEWTON_ADMIN) { ... }
 * const templateId = NOTIFICATION_TEMPLATES.ORDER.CREATED
 * if (file.size > UPLOAD.MAX_PROFILE_IMAGE_SIZE) { ... }
 * ```
 */

export * from "./collections"
export * from "./time"
export * from "./defaults"
export * from "./api-routes"
export * from "./roles"
export * from "./templates"
export * from "./upload"
