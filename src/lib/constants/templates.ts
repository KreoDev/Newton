/**
 * Notification Template IDs
 *
 * CRITICAL: NEVER use hardcoded template IDs in the codebase.
 * Always import and use these constants to ensure consistency.
 *
 * @example
 * ```typescript
 * import { NOTIFICATION_TEMPLATES } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * const templateId = NOTIFICATION_TEMPLATES.ORDER.CREATED
 *
 * // ❌ WRONG
 * const templateId = "tpl_order_created"
 * ```
 */

export const NOTIFICATION_TEMPLATES = {
  // Order Templates
  ORDER: {
    CREATED: "tpl_order_created",
    ALLOCATED: "tpl_order_allocated",
    CANCELLED: "tpl_order_cancelled",
    COMPLETED: "tpl_order_completed",
    EXPIRING: "tpl_order_expiring",
  },

  // Asset Templates
  ASSET: {
    ADDED: "tpl_asset_added",
    INACTIVE: "tpl_asset_inactive",
    EDITED: "tpl_asset_edited",
    DELETED: "tpl_asset_deleted",
  },

  // Driver License Templates
  DRIVER: {
    LICENSE_EXPIRING_7: "tpl_driver_license_expiring_7",
    LICENSE_EXPIRING_30: "tpl_driver_license_expiring_30",
    LICENSE_EXPIRED: "tpl_driver_license_expired",
  },

  // Truck License Templates
  TRUCK: {
    LICENSE_EXPIRING_7: "tpl_truck_license_expiring_7",
    LICENSE_EXPIRING_30: "tpl_truck_license_expiring_30",
    LICENSE_EXPIRED: "tpl_truck_license_expired",
  },

  // Trailer License Templates
  TRAILER: {
    LICENSE_EXPIRING_7: "tpl_trailer_license_expiring_7",
    LICENSE_EXPIRING_30: "tpl_trailer_license_expiring_30",
    LICENSE_EXPIRED: "tpl_trailer_license_expired",
  },

  // Security Templates
  SECURITY: {
    INVALID_LICENSE: "tpl_security_invalid_license",
    UNBOOKED_ARRIVAL: "tpl_security_unbooked_arrival",
    SEAL_MISMATCH: "tpl_security_seal_mismatch",
    REJECTED_ENTRY: "tpl_security_rejected_entry",
    DELAYED_DEPARTURE: "tpl_security_delayed_departure",
  },

  // Pre-Booking Templates
  PRE_BOOKING: {
    CREATED: "tpl_prebooking_created",
    APPROVED: "tpl_prebooking_approved",
    REJECTED: "tpl_prebooking_rejected",
    CANCELLED: "tpl_prebooking_cancelled",
    MODIFIED: "tpl_prebooking_modified",
  },

  // Weighbridge Templates
  WEIGHBRIDGE: {
    FIRST_WEIGH_COMPLETE: "tpl_weighbridge_first_weigh",
    FINAL_WEIGH_COMPLETE: "tpl_weighbridge_final_weigh",
    WEIGHT_DISCREPANCY: "tpl_weighbridge_discrepancy",
  },

  // System Templates
  SYSTEM: {
    COMPANY_ADDED: "tpl_system_company_added",
    COMPANY_DEACTIVATED: "tpl_system_company_deactivated",
    USER_ADDED: "tpl_system_user_added",
    USER_DEACTIVATED: "tpl_system_user_deactivated",
    ROLE_CHANGED: "tpl_system_role_changed",
  },
} as const

export type NotificationTemplateId = typeof NOTIFICATION_TEMPLATES[keyof typeof NOTIFICATION_TEMPLATES][keyof typeof NOTIFICATION_TEMPLATES[keyof typeof NOTIFICATION_TEMPLATES]]
