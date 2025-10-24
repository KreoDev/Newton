/**
 * Time Conversion Constants
 *
 * CRITICAL: NEVER use hardcoded time calculations like (1000 * 60 * 60 * 24).
 * Always import and use these constants for time conversions.
 *
 * @example
 * ```typescript
 * import { TIME } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * const days = Math.ceil((end - start) / TIME.MS_PER_DAY) + 1
 * const hours = minutes / TIME.MINUTES_PER_HOUR
 *
 * // ❌ WRONG
 * const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
 * const hours = minutes / 60
 * ```
 */

export const TIME = {
  // Base units
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,

  // Derived units (milliseconds)
  MS_PER_MINUTE: 1000 * 60,
  MS_PER_HOUR: 1000 * 60 * 60,
  MS_PER_DAY: 1000 * 60 * 60 * 24,
  MS_PER_WEEK: 1000 * 60 * 60 * 24 * 7,

  // Derived units (seconds)
  SECONDS_PER_HOUR: 60 * 60,
  SECONDS_PER_DAY: 60 * 60 * 24,

  // Derived units (minutes)
  MINUTES_PER_DAY: 60 * 24,
} as const
