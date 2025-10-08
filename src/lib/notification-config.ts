import type { NotificationKey } from "@/types"

export interface NotificationConfig {
  key: NotificationKey
  label: string
  description: string
}

export interface NotificationCategory {
  [categoryName: string]: NotificationConfig[]
}

// Full notification configuration for Mine companies
const MINE_NOTIFICATIONS: NotificationCategory = {
  "Asset Management": [
    { key: "asset.added", label: "Asset Added", description: "When new assets are inducted" },
    { key: "asset.inactive", label: "Asset Deactivated", description: "When assets are marked inactive" },
    { key: "asset.edited", label: "Asset Edited", description: "When asset details are modified" },
    { key: "asset.deleted", label: "Asset Deleted", description: "When assets are permanently removed" },
  ],
  "Order Management": [
    { key: "order.created", label: "Order Created", description: "When new orders are created" },
    { key: "order.allocated", label: "Order Allocated", description: "When orders are allocated to transporters" },
    { key: "order.cancelled", label: "Order Cancelled", description: "When orders are cancelled" },
    { key: "order.completed", label: "Order Completed", description: "When orders are fully completed" },
    { key: "order.expiring", label: "Order Expiring Soon", description: "When orders approach expiry date" },
  ],
  "Weighbridge Operations": [
    { key: "weighbridge.overload", label: "Overload Detected", description: "When vehicle exceeds weight limits" },
    { key: "weighbridge.underweight", label: "Underweight Detected", description: "When load is below minimum weight" },
    { key: "weighbridge.violations", label: "Weight Violations", description: "When weight limit violations occur" },
    { key: "weighbridge.manualOverride", label: "Manual Override Used", description: "When manual weight overrides are applied" },
  ],
  "Pre-Booking": [
    { key: "preBooking.created", label: "Pre-Booking Created", description: "When new pre-bookings are made" },
    { key: "preBooking.lateArrival", label: "Late Arrival Alert", description: "When pre-booked vehicles arrive late" },
  ],
  "Security & Compliance": [
    { key: "security.invalidLicense", label: "Invalid/Expired License", description: "When driver license is invalid or expired" },
    { key: "security.unbookedArrival", label: "Unbooked Arrival", description: "When vehicle arrives without pre-booking" },
    { key: "security.noActiveOrder", label: "No Active Order", description: "When vehicle has no active order" },
    { key: "security.sealMismatch", label: "Seal Mismatch", description: "When seal numbers don't match records" },
    { key: "security.incorrectSealsNo", label: "Incorrect Seal Count", description: "When seal quantity is incorrect" },
    { key: "security.unregisteredAsset", label: "Unregistered Asset", description: "When unregistered vehicle attempts entry" },
    { key: "security.inactiveEntity", label: "Inactive Entity", description: "When inactive asset/driver attempts entry" },
    { key: "security.incompleteTruck", label: "Incomplete Process", description: "When vehicle leaves before completing process" },
  ],
  "Driver Alerts": [
    { key: "driver.licenseExpiring7", label: "License Expiring (7 Days)", description: "When driver license expires in 7 days" },
    { key: "driver.licenseExpiring30", label: "License Expiring (30 Days)", description: "When driver license expires in 30 days" },
  ],
  "System & Maintenance": [
    { key: "system.calibrationDue", label: "Calibration Due", description: "When weighbridge calibration is due" },
  ],
}

// Transporter company notifications (filtered)
const TRANSPORTER_NOTIFICATIONS: NotificationCategory = {
  "Asset Management": [
    { key: "asset.added", label: "Asset Added", description: "When your assets are inducted" },
    { key: "asset.inactive", label: "Asset Deactivated", description: "When your assets are marked inactive" },
    { key: "asset.edited", label: "Asset Edited", description: "When your asset details are modified" },
    { key: "asset.deleted", label: "Asset Deleted", description: "When your assets are removed" },
  ],
  "Order Management": [
    { key: "order.allocated", label: "Order Allocated to Me", description: "When orders are allocated to your company" },
    { key: "order.completed", label: "Order Completed", description: "When your orders are completed" },
    { key: "order.cancelled", label: "Order Cancelled", description: "When your allocated orders are cancelled" },
  ],
  "Pre-Booking": [
    { key: "preBooking.created", label: "Pre-Booking Created", description: "When your pre-bookings are confirmed" },
    { key: "preBooking.lateArrival", label: "Late Arrival Alert", description: "When your vehicles arrive late" },
  ],
  "Security & Compliance": [
    { key: "security.invalidLicense", label: "Invalid/Expired License", description: "When your driver license is invalid" },
    { key: "security.noActiveOrder", label: "No Active Order", description: "When your vehicle has no active order" },
    { key: "security.sealMismatch", label: "Seal Mismatch", description: "When your vehicle seal numbers don't match" },
    { key: "security.incorrectSealsNo", label: "Incorrect Seal Count", description: "When your seal quantity is incorrect" },
    { key: "security.inactiveEntity", label: "Inactive Entity", description: "When your inactive asset attempts entry" },
    { key: "security.incompleteTruck", label: "Incomplete Process", description: "When your vehicle leaves before completing" },
  ],
  "Driver Alerts": [
    { key: "driver.licenseExpiring7", label: "License Expiring (7 Days)", description: "When your driver license expires in 7 days" },
    { key: "driver.licenseExpiring30", label: "License Expiring (30 Days)", description: "When your driver license expires in 30 days" },
  ],
}

// Logistics Coordinator notifications (filtered)
const LOGISTICS_COORDINATOR_NOTIFICATIONS: NotificationCategory = {
  "Order Management": [
    { key: "order.created", label: "Order Created", description: "When orders are assigned to you" },
    { key: "order.allocated", label: "Order Allocated", description: "When you allocate orders to transporters" },
    { key: "order.cancelled", label: "Order Cancelled", description: "When managed orders are cancelled" },
    { key: "order.completed", label: "Order Completed", description: "When managed orders are completed" },
    { key: "order.expiring", label: "Order Expiring Soon", description: "When managed orders approach expiry" },
  ],
  "Pre-Booking": [
    { key: "preBooking.created", label: "Pre-Booking Created", description: "When pre-bookings are made for your orders" },
    { key: "preBooking.lateArrival", label: "Late Arrival Alert", description: "When pre-booked vehicles are late" },
  ],
  "Security & Compliance": [
    { key: "security.unbookedArrival", label: "Unbooked Arrival", description: "When vehicles arrive without booking" },
    { key: "security.noActiveOrder", label: "No Active Order", description: "When vehicles have no active order" },
    { key: "security.incompleteTruck", label: "Incomplete Process", description: "When vehicles leave before completing" },
  ],
}

export const NOTIFICATION_CATEGORIES_BY_COMPANY_TYPE: Record<string, NotificationCategory> = {
  mine: MINE_NOTIFICATIONS,
  transporter: TRANSPORTER_NOTIFICATIONS,
  logistics_coordinator: LOGISTICS_COORDINATOR_NOTIFICATIONS,
}

/**
 * Get notification categories for a specific company type
 */
export function getNotificationCategoriesForCompanyType(companyType: string): NotificationCategory {
  return NOTIFICATION_CATEGORIES_BY_COMPANY_TYPE[companyType] || MINE_NOTIFICATIONS
}

/**
 * Get all notification keys for a specific company type (used for default preferences)
 */
export function getDefaultNotificationPreferences(companyType: string): Record<NotificationKey, boolean> {
  const categories = getNotificationCategoriesForCompanyType(companyType)
  const preferences: Record<string, boolean> = {}

  Object.values(categories).forEach(categoryItems => {
    categoryItems.forEach(item => {
      preferences[item.key] = true // Default all to enabled
    })
  })

  return preferences as Record<NotificationKey, boolean>
}

/**
 * Check if a notification key is valid for a company type
 */
export function isNotificationValidForCompanyType(notificationKey: NotificationKey, companyType: string): boolean {
  const categories = getNotificationCategoriesForCompanyType(companyType)
  return Object.values(categories).some(categoryItems => categoryItems.some(item => item.key === notificationKey))
}
