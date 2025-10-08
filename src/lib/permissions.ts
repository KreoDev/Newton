// Permission keys aligned with docs/data-model.md

export type PermissionKey =
  // Asset Management
  | "assets.view"
  | "assets.add"
  | "assets.edit"
  | "assets.delete"
  // Order Management
  | "orders.view"
  | "orders.create"
  | "orders.allocate"
  | "orders.cancel"
  | "orders.viewAll"
  // Pre-Booking
  | "preBooking.view"
  | "preBooking.create"
  | "preBooking.edit"
  // Operational Flows
  | "security.in"
  | "security.out"
  | "weighbridge.tare"
  | "weighbridge.gross"
  | "weighbridge.calibrate"
  | "weighbridge.override"
  // Administrative - View Only
  | "admin.companies.view"
  | "admin.users.view"
  | "admin.roles.view"
  | "admin.products.view"
  | "admin.clients.view"
  | "admin.sites.view"
  | "admin.notifications.view"
  // Administrative - Full Manage
  | "admin.companies"
  | "admin.users"
  | "admin.users.viewAllCompanies"
  | "admin.users.manageGlobalAdmins"
  | "admin.users.managePermissions"
  | "admin.roles"
  | "admin.products"
  | "admin.orderSettings"
  | "admin.clients"
  | "admin.sites"
  | "admin.weighbridge"
  | "admin.notifications"
  | "admin.system"
  | "admin.securityAlerts"
  // Special
  | "emergency.override"
  | "orders.editCompleted"
  | "records.delete"
  | "preBooking.bypass"

export const PERMISSIONS: Record<string, PermissionKey> = {
  // Asset Management
  ASSETS_VIEW: "assets.view",
  ASSETS_ADD: "assets.add",
  ASSETS_EDIT: "assets.edit",
  ASSETS_DELETE: "assets.delete",

  // Order Management
  ORDERS_VIEW: "orders.view",
  ORDERS_CREATE: "orders.create",
  ORDERS_ALLOCATE: "orders.allocate",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_VIEW_ALL: "orders.viewAll",

  // Pre-Booking
  PRE_BOOKING_VIEW: "preBooking.view",
  PRE_BOOKING_CREATE: "preBooking.create",
  PRE_BOOKING_EDIT: "preBooking.edit",

  // Operational Flows
  SECURITY_IN: "security.in",
  SECURITY_OUT: "security.out",
  WEIGHBRIDGE_TARE: "weighbridge.tare",
  WEIGHBRIDGE_GROSS: "weighbridge.gross",
  WEIGHBRIDGE_CALIBRATE: "weighbridge.calibrate",
  WEIGHBRIDGE_OVERRIDE: "weighbridge.override",

  // Administrative - View Only
  ADMIN_COMPANIES_VIEW: "admin.companies.view",
  ADMIN_USERS_VIEW: "admin.users.view",
  ADMIN_ROLES_VIEW: "admin.roles.view",
  ADMIN_PRODUCTS_VIEW: "admin.products.view",
  ADMIN_CLIENTS_VIEW: "admin.clients.view",
  ADMIN_SITES_VIEW: "admin.sites.view",
  ADMIN_NOTIFICATIONS_VIEW: "admin.notifications.view",

  // Administrative - Full Manage
  ADMIN_COMPANIES: "admin.companies",
  ADMIN_USERS: "admin.users",
  ADMIN_USERS_VIEW_ALL_COMPANIES: "admin.users.viewAllCompanies",
  ADMIN_USERS_MANAGE_GLOBAL_ADMINS: "admin.users.manageGlobalAdmins",
  ADMIN_USERS_MANAGE_PERMISSIONS: "admin.users.managePermissions",
  ADMIN_ROLES: "admin.roles",
  ADMIN_PRODUCTS: "admin.products",
  ADMIN_ORDER_SETTINGS: "admin.orderSettings",
  ADMIN_CLIENTS: "admin.clients",
  ADMIN_SITES: "admin.sites",
  ADMIN_WEIGHBRIDGE: "admin.weighbridge",
  ADMIN_NOTIFICATIONS: "admin.notifications",
  ADMIN_SYSTEM: "admin.system",
  ADMIN_SECURITY_ALERTS: "admin.securityAlerts",

  // Special
  EMERGENCY_OVERRIDE: "emergency.override",
  ORDERS_EDIT_COMPLETED: "orders.editCompleted",
  RECORDS_DELETE: "records.delete",
  PRE_BOOKING_BYPASS: "preBooking.bypass",
}

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  // Asset Management
  "assets.view": "View assets",
  "assets.add": "Add new assets",
  "assets.edit": "Edit existing assets",
  "assets.delete": "Delete assets",

  // Order Management
  "orders.view": "View orders",
  "orders.create": "Create new orders",
  "orders.allocate": "Allocate orders",
  "orders.cancel": "Cancel orders",
  "orders.viewAll": "View all orders (not just assigned)",

  // Pre-Booking
  "preBooking.view": "View pre-bookings",
  "preBooking.create": "Create pre-bookings",
  "preBooking.edit": "Edit pre-bookings",

  // Operational Flows
  "security.in": "Perform security in checks",
  "security.out": "Perform security out checks",
  "weighbridge.tare": "Capture tare weight",
  "weighbridge.gross": "Capture gross weight",
  "weighbridge.calibrate": "Perform weighbridge calibration",
  "weighbridge.override": "Manual weight override",

  // Administrative - View Only
  "admin.companies.view": "View companies (read-only)",
  "admin.users.view": "View users (read-only)",
  "admin.roles.view": "View roles (read-only)",
  "admin.products.view": "View products (read-only)",
  "admin.clients.view": "View clients (read-only)",
  "admin.sites.view": "View sites (read-only)",
  "admin.notifications.view": "View notifications (read-only)",

  // Administrative - Full Manage
  "admin.companies": "Manage companies",
  "admin.users": "Manage users",
  "admin.users.viewAllCompanies": "View users from all companies",
  "admin.users.manageGlobalAdmins": "Promote users to global administrators",
  "admin.users.managePermissions": "Manage permission overrides for users",
  "admin.roles": "Manage roles",
  "admin.products": "Manage products",
  "admin.orderSettings": "Configure order settings",
  "admin.clients": "Manage clients",
  "admin.sites": "Manage sites",
  "admin.weighbridge": "Configure weighbridge",
  "admin.notifications": "Configure notifications",
  "admin.system": "System-wide settings",
  "admin.securityAlerts": "Configure security alerts",

  // Special
  "emergency.override": "Emergency override access",
  "orders.editCompleted": "Edit completed orders",
  "records.delete": "Delete records permanently",
  "preBooking.bypass": "Bypass pre-booking requirements",
}
