import type { PermissionKey } from "./permissions"

export interface PermissionConfig {
  key: PermissionKey
  label: string
}

export interface PermissionCategory {
  [categoryName: string]: PermissionConfig[]
}

// Full permission configuration for Mine companies
const MINE_PERMISSIONS: PermissionCategory = {
  "Asset Management": [
    { key: "assets.view", label: "View Assets" },
    { key: "assets.add", label: "Add Assets" },
    { key: "assets.edit", label: "Edit Assets" },
    { key: "assets.delete", label: "Delete Assets" },
  ],
  "Order Management": [
    { key: "orders.view", label: "View Orders" },
    { key: "orders.create", label: "Create Orders" },
    { key: "orders.allocate", label: "Allocate Orders" },
    { key: "orders.cancel", label: "Cancel Orders" },
    { key: "orders.viewAll", label: "View All Orders" },
    { key: "orders.editCompleted", label: "Edit Completed Orders" },
  ],
  "Pre-Booking Management": [
    { key: "preBooking.view", label: "View Pre-Bookings" },
    { key: "preBooking.create", label: "Create Pre-Bookings" },
    { key: "preBooking.edit", label: "Edit Pre-Bookings" },
    { key: "preBooking.bypass", label: "Bypass Pre-Booking Requirements" },
  ],
  "Operational Flow": [
    { key: "security.in", label: "Security Checkpoint - Entry" },
    { key: "security.out", label: "Security Checkpoint - Exit" },
    { key: "weighbridge.tare", label: "Weighbridge Tare Weight" },
    { key: "weighbridge.gross", label: "Weighbridge Gross Weight" },
    { key: "weighbridge.calibrate", label: "Weighbridge Calibration" },
    { key: "weighbridge.override", label: "Manual Weight Override" },
  ],
  "Administrative": [
    { key: "admin.users", label: "User Management" },
    { key: "admin.users.manageGlobalAdmins", label: "Manage Global Admins" },
    { key: "admin.users.managePermissions", label: "Manage Permissions" },
    { key: "admin.companies", label: "Company Management" },
    { key: "admin.products", label: "Product Management" },
    { key: "admin.clients", label: "Client Management" },
    { key: "admin.sites", label: "Site Management" },
    { key: "admin.weighbridge", label: "Weighbridge Management" },
    { key: "admin.notifications", label: "Notification Templates" },
    { key: "admin.system", label: "System-Wide Settings" },
    { key: "admin.securityAlerts", label: "Security Alert Configuration" },
  ],
  "Special Permissions": [
    { key: "emergency.override", label: "Emergency Override Access" },
    { key: "records.delete", label: "Delete Records Permanently" },
  ],
}

// Transporter company permissions (filtered - no Products, Clients, Sites)
const TRANSPORTER_PERMISSIONS: PermissionCategory = {
  "Asset Management": [
    { key: "assets.view", label: "View Assets" },
    { key: "assets.add", label: "Add Assets" },
    { key: "assets.edit", label: "Edit Assets" },
    { key: "assets.delete", label: "Delete Assets" },
  ],
  "Order Management": [
    { key: "orders.view", label: "View Allocated Orders" },
    { key: "orders.viewAll", label: "View All Orders" },
  ],
  "Pre-Booking Management": [
    { key: "preBooking.view", label: "View Pre-Bookings" },
    { key: "preBooking.create", label: "Create Pre-Bookings" },
    { key: "preBooking.edit", label: "Edit Pre-Bookings" },
  ],
  "Operational Flow": [
    { key: "security.in", label: "Security Checkpoint - Entry" },
    { key: "security.out", label: "Security Checkpoint - Exit" },
  ],
  "Administrative": [
    { key: "admin.users", label: "User Management" },
    { key: "admin.users.manageGlobalAdmins", label: "Manage Global Admins" },
    { key: "admin.users.managePermissions", label: "Manage Permissions" },
    { key: "admin.companies", label: "Company Management" },
    { key: "admin.notifications", label: "Notification Templates" },
  ],
}

// Logistics Coordinator permissions (filtered - no Products, Clients, Sites, limited operations)
const LOGISTICS_COORDINATOR_PERMISSIONS: PermissionCategory = {
  "Asset Management": [
    { key: "assets.view", label: "View Assets (Read-Only)" },
  ],
  "Order Management": [
    { key: "orders.view", label: "View Orders" },
    { key: "orders.create", label: "Create Orders" },
    { key: "orders.allocate", label: "Allocate Orders" },
    { key: "orders.cancel", label: "Cancel Orders" },
    { key: "orders.viewAll", label: "View All Orders" },
  ],
  "Pre-Booking Management": [
    { key: "preBooking.view", label: "View Pre-Bookings" },
    { key: "preBooking.create", label: "Create Pre-Bookings" },
    { key: "preBooking.edit", label: "Edit Pre-Bookings" },
  ],
  "Administrative": [
    { key: "admin.users", label: "User Management" },
    { key: "admin.users.manageGlobalAdmins", label: "Manage Global Admins" },
    { key: "admin.users.managePermissions", label: "Manage Permissions" },
    { key: "admin.companies", label: "Company Management" },
    { key: "admin.notifications", label: "Notification Templates" },
  ],
}

export const PERMISSION_CATEGORIES_BY_COMPANY_TYPE: Record<string, PermissionCategory> = {
  mine: MINE_PERMISSIONS,
  transporter: TRANSPORTER_PERMISSIONS,
  logistics_coordinator: LOGISTICS_COORDINATOR_PERMISSIONS,
}

/**
 * Get permission categories for a specific company type
 */
export function getPermissionCategoriesForCompanyType(companyType: string): PermissionCategory {
  return PERMISSION_CATEGORIES_BY_COMPANY_TYPE[companyType] || MINE_PERMISSIONS
}

/**
 * Get all permission keys for a specific company type (flat array)
 */
export function getAvailablePermissionsForCompanyType(companyType: string): PermissionKey[] {
  const categories = getPermissionCategoriesForCompanyType(companyType)
  const permissions: PermissionKey[] = []

  Object.values(categories).forEach(categoryItems => {
    categoryItems.forEach(item => {
      permissions.push(item.key)
    })
  })

  return permissions
}

/**
 * Check if a permission key is valid for a company type
 */
export function isPermissionValidForCompanyType(permissionKey: PermissionKey, companyType: string): boolean {
  const categories = getPermissionCategoriesForCompanyType(companyType)
  return Object.values(categories).some(categoryItems => categoryItems.some(item => item.key === permissionKey))
}

/**
 * Filter a list of permissions to only include those valid for a company type
 */
export function filterPermissionsByCompanyType(permissions: PermissionKey[], companyType: string): PermissionKey[] {
  const availablePermissions = getAvailablePermissionsForCompanyType(companyType)
  return permissions.filter(p => availablePermissions.includes(p))
}
