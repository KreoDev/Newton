/**
 * Default Configuration Values
 *
 * CRITICAL: NEVER use hardcoded default values in the codebase.
 * Always import and use these constants to ensure consistency.
 *
 * @example
 * ```typescript
 * import { DEFAULTS } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * const days = company.orderHistoryDays || DEFAULTS.ORDER_HISTORY_DAYS.default
 * const size = DEFAULTS.BATCH_SIZE
 *
 * // ❌ WRONG
 * const days = company.orderHistoryDays || 60
 * const size = 500
 * ```
 */

export const DEFAULTS = {
  // Order Configuration
  ORDER_HISTORY_DAYS: {
    default: 60,
    min: 1,
    max: 120,
  },

  // Booking Configuration
  ADVANCE_BOOKING_HOURS: 24,

  // Security Configuration
  SEAL_QUANTITY: 2,

  // Notification Configuration
  ESCALATION_MINUTES: 15,
  RESPONSE_MINUTES: 5,

  // Database Configuration
  BATCH_SIZE: 500, // Firestore recommended batch size

  // Data Service Configuration
  EXPECTED_COLLECTIONS: 9, // companies, roles, users, products, groups, sites, clients, assets, orders

  // Calculation Configuration
  FLOATING_POINT_TOLERANCE: 0.01, // Allow small floating point differences

  // Formatting Configuration
  ORDER_NUMBER_PAD_WIDTH: 4,
  ORDER_NUMBER_PAD_CHAR: "0",

  // Allocation Configuration
  DAILY_LIMIT_WARNING_THRESHOLD: 80, // Show warning at 80% usage
} as const
