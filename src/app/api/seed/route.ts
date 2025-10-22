import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { getDefaultNotificationPreferences } from "@/lib/notification-config"
import fs from "fs"
import path from "path"

interface ProgressData {
  stage: string
  message: string
  collection?: string
  count?: number
  progress?: { current: number; total: number }
  completed?: boolean
  results?: {
    cleared: {
      companies: number
      users: number
      transporters: number
      assets: number
      templates: number
      roles: number
      products: number
      clients: number
      sites: number
      groups: number
    }
    seeded: {
      permissions: number
      companies: number
      users: number
      transporters: number
      assets: number
      templates: number
      roles: number
      products: number
      clients: number
      sites: number
      groups: number
    }
  }
}

const DEFAULT_COMPANY_ID = "c_dev"
const DEFAULT_COMPANY = {
  id: DEFAULT_COMPANY_ID,
  name: "Dev Company",
  companyType: "mine",
  registrationNumber: "2025/DEV/001", // Optional field
  vatNumber: "0000000000",
  physicalAddress: "1 Dev Street, Sandbox City",
  mainContactId: "", // Will be set after user is created
  secondaryContactIds: [] as string[],
  mineConfig: {
    sites: ["site_dev"],
    defaultOperatingHours: {
      monday: { open: "06:00", close: "18:00" },
      tuesday: { open: "06:00", close: "18:00" },
      wednesday: { open: "06:00", close: "18:00" },
      thursday: { open: "06:00", close: "18:00" },
      friday: { open: "06:00", close: "18:00" },
      saturday: { open: "06:00", close: "14:00" },
      sunday: { open: "closed", close: "closed" },
    },
  },
  transporterConfig: {},
  logisticsCoordinatorConfig: {},
  // Order Configuration (required for Order Management - Phase 3)
  orderConfig: {
    orderNumberMode: "autoOnly",
    orderNumberPrefix: "DEV-",
    defaultDailyTruckLimit: 10,
    defaultDailyWeightLimit: 100,
    defaultMonthlyLimit: 2000,
    defaultTripLimit: 2,
    defaultWeightPerTruck: 30,
    preBookingMode: "compulsory",
    advanceBookingHours: 24,
    defaultSealRequired: true,
    defaultSealQuantity: 2,
  },
  // System Settings (UI customization)
  systemSettings: {
    fleetNumberEnabled: true,
    fleetNumberLabel: "Fleet No.",
    transporterGroupEnabled: true,
    transporterGroupLabel: "Group",
    groupOptions: ["North", "South", "East", "West"],
  },
  // Security Alerts Configuration
  securityAlerts: {
    primaryContactId: "", // Will be set after user is created
    secondaryContactIds: [] as string[],
    escalationMinutes: 15,
    qrMismatchContacts: [] as string[],
    documentFailureContacts: [] as string[],
    sealDiscrepancyContacts: [] as string[],
    requiredResponseMinutes: 5,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const VR_CARGO_COMPANY_ID = "c_vr_cargo"
const VR_CARGO_COMPANY = {
  id: VR_CARGO_COMPANY_ID,
  name: "VR Cargo (PTY) LTD",
  companyType: "transporter",
  registrationNumber: "2020/VRC/001",
  vatNumber: "4123456789",
  physicalAddress: "45 Transport Road, Johannesburg, 2000",
  mainContactId: "", // Will be set after user is created
  secondaryContactIds: [] as string[],
  mineConfig: {},
  transporterConfig: {
    fleetSize: 50,
    operatingRegions: ["Gauteng", "Limpopo", "North West"],
  },
  logisticsCoordinatorConfig: {},
  orderConfig: {
    orderNumberMode: "manualAllowed",
    orderNumberPrefix: "VRC-",
    defaultDailyTruckLimit: 20,
    defaultDailyWeightLimit: 200,
    defaultMonthlyLimit: 4000,
    defaultTripLimit: 3,
    defaultWeightPerTruck: 35,
    preBookingMode: "optional",
    advanceBookingHours: 12,
    defaultSealRequired: true,
    defaultSealQuantity: 2,
  },
  systemSettings: {
    fleetNumberEnabled: true,
    fleetNumberLabel: "Fleet No.",
    transporterGroupEnabled: true,
    transporterGroupLabel: "Division",
    groupOptions: ["Johannesburg", "Pretoria", "Rustenburg"],
  },
  securityAlerts: {
    primaryContactId: "", // Will be set after user is created
    secondaryContactIds: [] as string[],
    escalationMinutes: 20,
    qrMismatchContacts: [] as string[],
    documentFailureContacts: [] as string[],
    sealDiscrepancyContacts: [] as string[],
    requiredResponseMinutes: 10,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const DEFAULT_USER_EMAIL = "dev@newton.co.za"
const DEFAULT_USER_PASSWORD = process.env.SEED_DEFAULT_USER_PASSWORD || "NewtonDev123!"

const SECOND_USER_EMAIL = "admin@newton.co.za"
const SECOND_USER_PASSWORD = "NewtonDev123!"

const DEFAULT_USER_PROFILE = {
  email: DEFAULT_USER_EMAIL,
  firstName: "Dev",
  lastName: "User",
  displayName: "Dev User", // Required per updated User type
  phoneNumber: "+27821234567", // Required per updated User type
  roleId: "r_newton_admin",
  companyId: DEFAULT_COMPANY_ID,
  isGlobal: true,
  permissionOverrides: {
    // Grant explicit permissions for managing the system
    "admin.users.manageGlobalAdmins": true,
    "admin.users.managePermissions": true,
    "admin.users.viewAllCompanies": true,
  },
  notificationPreferences: getDefaultNotificationPreferences("mine"),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const SECOND_USER_PROFILE = {
  email: SECOND_USER_EMAIL,
  firstName: "Admin",
  lastName: "User",
  displayName: "Admin User",
  phoneNumber: "+27821234568",
  roleId: "r_allocation_officer", // Allocation Officer role
  companyId: DEFAULT_COMPANY_ID,
  isGlobal: false, // Regular user, not global admin
  notificationPreferences: getDefaultNotificationPreferences("mine"),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const VR_CARGO_USER_EMAIL = "fleet@vrcargo.co.za"
const VR_CARGO_USER_PASSWORD = "VRCargo123!"

const VR_CARGO_USER_PROFILE = {
  email: VR_CARGO_USER_EMAIL,
  firstName: "Fleet",
  lastName: "Manager",
  displayName: "Fleet Manager",
  phoneNumber: "+27823456789",
  roleId: "r_site_admin", // Site admin role for transporter company
  companyId: VR_CARGO_COMPANY_ID,
  isGlobal: false,
  notificationPreferences: getDefaultNotificationPreferences("transporter"),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const TRANSPORTERS = [
  { id: "t_dev_1", name: "Noble Freight", companyId: DEFAULT_COMPANY_ID },
  { id: "t_dev_2", name: "VR Cargo (PTY) LTD", companyId: DEFAULT_COMPANY_ID },
]

const DEFAULT_PRODUCTS = [
  { id: "p_gold", name: "Gold Ore", productCode: "AU-001", specifications: "Grade A Gold Ore" },
  { id: "p_platinum", name: "Platinum Ore", productCode: "PT-001", specifications: "Grade A Platinum Ore" },
  { id: "p_diamond", name: "Diamond Ore", productCode: "DI-001", specifications: "Raw Diamond Ore" },
  { id: "p_iron", name: "Iron Ore", productCode: "FE-001", specifications: "High-grade Iron Ore" },
  { id: "p_chrome", name: "Chrome Ore", productCode: "CR-001", specifications: "Chrome Concentrate" },
  { id: "p_coal", name: "Coal", productCode: "CO-001", specifications: "Bituminous Coal" },
]

const DEFAULT_CLIENTS = [
  {
    id: "cl_dev_1",
    name: "ABC Mining Solutions",
    registrationNumber: "2020/123456/07",
    vatNumber: "4123456789",
    physicalAddress: "123 Industrial Rd, Johannesburg, 2000",
    contactName: "James Peterson",
    contactEmail: "james.peterson@abcmining.co.za",
    contactPhone: "+27821112222",
    allowedSites: ["site_dev_collection_1", "site_dev_destination_1"],
  },
  {
    id: "cl_dev_2",
    name: "XYZ Minerals Corp",
    registrationNumber: "2019/654321/07",
    vatNumber: "4987654321",
    physicalAddress: "456 Mining Ave, Pretoria, 0001",
    contactName: "Sarah Mitchell",
    contactEmail: "sarah.mitchell@xyzminerals.co.za",
    contactPhone: "+27823334444",
    allowedSites: ["site_dev_collection_2", "site_dev_destination_2"],
  },
]

const DEFAULT_SITES = [
  {
    id: "site_dev_collection_1",
    name: "North Collection Point",
    siteType: "collection",
    physicalAddress: "789 Collection St, Rustenburg, 0299",
    groupId: "group_north_sector", // Assigned to North Sector group
    operatingHours: {
      monday: { open: "06:00", close: "18:00" },
      tuesday: { open: "06:00", close: "18:00" },
      wednesday: { open: "06:00", close: "18:00" },
      thursday: { open: "06:00", close: "18:00" },
      friday: { open: "06:00", close: "18:00" },
      saturday: { open: "06:00", close: "14:00" },
      sunday: { open: "closed", close: "closed" },
    },
  },
  {
    id: "site_dev_collection_2",
    name: "South Collection Point",
    siteType: "collection",
    physicalAddress: "321 Mining Rd, Polokwane, 0699",
    groupId: "group_south_sector", // Assigned to South Sector group
    operatingHours: {
      monday: { open: "07:00", close: "17:00" },
      tuesday: { open: "07:00", close: "17:00" },
      wednesday: { open: "07:00", close: "17:00" },
      thursday: { open: "07:00", close: "17:00" },
      friday: { open: "07:00", close: "17:00" },
      saturday: { open: "closed", close: "closed" },
      sunday: { open: "closed", close: "closed" },
    },
  },
  {
    id: "site_dev_destination_1",
    name: "Main Processing Plant",
    siteType: "destination",
    physicalAddress: "999 Processing Ave, Johannesburg, 2001",
    groupId: "group_primary_processing", // Assigned to Primary Processing group
    operatingHours: {
      monday: { open: "00:00", close: "23:59" }, // 24 hours
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
  },
  {
    id: "site_dev_destination_2",
    name: "Secondary Processing Facility",
    siteType: "destination",
    physicalAddress: "555 Industry Blvd, Pretoria, 0002",
    groupId: "group_secondary_processing", // Assigned to Secondary Processing group
    operatingHours: {
      monday: { open: "06:00", close: "22:00" },
      tuesday: { open: "06:00", close: "22:00" },
      wednesday: { open: "06:00", close: "22:00" },
      thursday: { open: "06:00", close: "22:00" },
      friday: { open: "06:00", close: "22:00" },
      saturday: { open: "08:00", close: "16:00" },
      sunday: { open: "closed", close: "closed" },
    },
  },
]

const DEFAULT_GROUPS = [
  {
    id: "group_mining_ops",
    name: "Mining Operations",
    description: "Main mining operations division",
    level: 0,
    path: [],
  },
  {
    id: "group_north_sector",
    name: "North Sector",
    description: "Northern mining region",
    parentGroupId: "group_mining_ops",
    level: 1,
    path: ["group_mining_ops"],
  },
  {
    id: "group_south_sector",
    name: "South Sector",
    description: "Southern mining region",
    parentGroupId: "group_mining_ops",
    level: 1,
    path: ["group_mining_ops"],
  },
  {
    id: "group_processing",
    name: "Processing Division",
    description: "Ore processing and refinement",
    level: 0,
    path: [],
  },
  {
    id: "group_primary_processing",
    name: "Primary Processing",
    description: "Initial ore processing",
    parentGroupId: "group_processing",
    level: 1,
    path: ["group_processing"],
  },
  {
    id: "group_secondary_processing",
    name: "Secondary Processing",
    description: "Final ore refinement",
    parentGroupId: "group_processing",
    level: 1,
    path: ["group_processing"],
  },
]

const DEFAULT_TEMPLATES = [
  // Asset Notifications (4)
  {
    id: "tpl_asset_added",
    name: "Asset Added",
    subject: "New Asset Added - {{assetType}} {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA new {{assetType}} has been added to {{companyName}}.\n\nDetails:\n- Registration: {{registrationNumber}}\n- Fleet Number: {{fleetNumber}}\n- Date Added: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Asset",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_asset_inactive",
    name: "Asset Made Inactive",
    subject: "Asset Deactivated - {{assetType}} {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn asset has been deactivated in {{companyName}}.\n\nDetails:\n- Asset: {{assetType}} {{registrationNumber}}\n- Fleet Number: {{fleetNumber}}\n- Reason: {{reason}}\n- Date: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Asset",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_asset_edited",
    name: "Asset Edited",
    subject: "Asset Updated - {{assetType}} {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn asset has been updated in {{companyName}}.\n\nDetails:\n- Asset: {{assetType}} {{registrationNumber}}\n- Fleet Number: {{fleetNumber}}\n- Updated: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Asset",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_asset_deleted",
    name: "Asset Deleted",
    subject: "Asset Removed - {{assetType}} {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn asset has been permanently removed from {{companyName}}.\n\nDetails:\n- Asset: {{assetType}} {{registrationNumber}}\n- Fleet Number: {{fleetNumber}}\n- Reason: {{reason}}\n- Date: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Asset",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  // Order Notifications (5)
  {
    id: "tpl_order_created",
    name: "Order Created",
    subject: "New Order Created - {{orderNumber}}",
    body: "Hello {{userName}},\n\nA new order has been created.\n\nOrder Details:\n- Order Number: {{orderNumber}}\n- Product: {{productName}}\n- Weight: {{weight}} tons\n- Created: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Order",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_order_allocated",
    name: "Order Allocated",
    subject: "Order Allocated to You - {{orderNumber}}",
    body: "Hello {{userName}},\n\nAn order has been allocated to you.\n\nOrder Details:\n- Order Number: {{orderNumber}}\n- Product: {{productName}}\n- Weight: {{weight}} tons\n- Allocated: {{date}} at {{time}}\n\nPlease ensure timely completion.\n\nThank you,\nNewton Weighbridge System",
    category: "Order",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_order_cancelled",
    name: "Order Cancelled",
    subject: "Order Cancelled - {{orderNumber}}",
    body: "Hello {{userName}},\n\nAn order has been cancelled.\n\nOrder Details:\n- Order Number: {{orderNumber}}\n- Product: {{productName}}\n- Reason: {{reason}}\n- Cancelled: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Order",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_order_completed",
    name: "Order Completed",
    subject: "Order Completed - {{orderNumber}}",
    body: "Hello {{userName}},\n\nAn order has been completed successfully.\n\nOrder Details:\n- Order Number: {{orderNumber}}\n- Product: {{productName}}\n- Weight: {{weight}} tons\n- Completed: {{date}} at {{time}}\n\nThank you,\nNewton Weighbridge System",
    category: "Order",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_order_expiring",
    name: "Order Expiring Soon",
    subject: "Order Expiring Soon - {{orderNumber}}",
    body: "Hello {{userName}},\n\nAn order is expiring soon and requires attention.\n\nOrder Details:\n- Order Number: {{orderNumber}}\n- Product: {{productName}}\n- Days Until Expiry: {{daysUntilExpiry}}\n- Expiry Date: {{expiryDate}}\n\nPlease take necessary action.\n\nThank you,\nNewton Weighbridge System",
    category: "Order",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  // Weighbridge Notifications (4)
  {
    id: "tpl_weighbridge_overload",
    name: "Overload Detected",
    subject: "Overload Alert - {{registrationNumber}} at {{weighbridgeName}}",
    body: "Hello {{userName}},\n\nAn overload has been detected.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Weighbridge: {{weighbridgeName}}\n- Weight: {{weight}} tons\n- Date: {{date}} at {{time}}\n\nImmediate action required.\n\nThank you,\nNewton Weighbridge System",
    category: "Weighbridge",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_weighbridge_underweight",
    name: "Underweight Detected",
    subject: "Underweight Alert - {{registrationNumber}} at {{weighbridgeName}}",
    body: "Hello {{userName}},\n\nAn underweight condition has been detected.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Weighbridge: {{weighbridgeName}}\n- Weight: {{weight}} tons\n- Date: {{date}} at {{time}}\n\nPlease investigate.\n\nThank you,\nNewton Weighbridge System",
    category: "Weighbridge",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_weighbridge_violations",
    name: "Weight Limit Violations",
    subject: "Weight Violation - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA weight limit violation has occurred.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Weighbridge: {{weighbridgeName}}\n- Weight: {{weight}} tons\n- Date: {{date}} at {{time}}\n\nPlease review and take action.\n\nThank you,\nNewton Weighbridge System",
    category: "Weighbridge",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_weighbridge_manual_override",
    name: "Manual Weight Override Used",
    subject: "Manual Override - {{registrationNumber}} at {{weighbridgeName}}",
    body: "Hello {{userName}},\n\nA manual weight override was used.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Weighbridge: {{weighbridgeName}}\n- Override Reason: {{reason}}\n- Date: {{date}} at {{time}}\n\nThis action has been logged for audit purposes.\n\nThank you,\nNewton Weighbridge System",
    category: "Weighbridge",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  // Security Notifications (9)
  {
    id: "tpl_security_invalid_license",
    name: "Invalid/Expired License",
    subject: "Invalid License Alert - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn invalid or expired license was detected.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Driver: {{driverName}}\n- Expiry Date: {{expiryDate}}\n- Date: {{date}} at {{time}}\n\nEntry denied. Please update license.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_unbooked_arrival",
    name: "Unbooked Truck Arrival",
    subject: "Unbooked Arrival - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA truck without pre-booking has arrived.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Date: {{date}} at {{time}}\n\nPlease verify and take action.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_no_active_order",
    name: "Truck Arrival No Active Order",
    subject: "No Active Order - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA truck arrived without an active order.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Date: {{date}} at {{time}}\n\nPlease assign an order before allowing entry.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_seal_mismatch",
    name: "Incorrect Seals",
    subject: "Seal Mismatch - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA seal discrepancy was detected.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Expected Seals: {{expectedSeals}}\n- Actual Seals: {{actualSeals}}\n- Date: {{date}} at {{time}}\n\nImmediate investigation required.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_incorrect_seals_no",
    name: "Seal Number Mismatch",
    subject: "Incorrect Seal Count - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nIncorrect number of seals detected.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Expected: {{expectedCount}} seals\n- Found: {{actualCount}} seals\n- Date: {{date}} at {{time}}\n\nPlease verify and investigate.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_unregistered_asset",
    name: "Unregistered Asset Attempting Entry",
    subject: "Unregistered Asset - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn unregistered asset attempted entry.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Date: {{date}} at {{time}}\n\nEntry denied. Please register asset before allowing access.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_inactive_entity",
    name: "Inactive Entity Attempted Entry",
    subject: "Inactive Entity Alert - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nAn inactive entity attempted entry.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Status: Inactive\n- Date: {{date}} at {{time}}\n\nEntry denied. Please reactivate before allowing access.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_security_incomplete_truck",
    name: "Truck Left Without Completing Process",
    subject: "Incomplete Process - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA truck left before completing the required process.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Last Checkpoint: {{lastCheckpoint}}\n- Date: {{date}} at {{time}}\n\nPlease follow up immediately.\n\nThank you,\nNewton Weighbridge System",
    category: "Security",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  // PreBooking Notifications (2)
  {
    id: "tpl_prebooking_created",
    name: "Pre-Booking Created",
    subject: "Pre-Booking Confirmed - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA pre-booking has been created.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Order: {{orderNumber}}\n- Scheduled: {{scheduledDate}} at {{scheduledTime}}\n- Created: {{date}} at {{time}}\n\nPlease arrive on time.\n\nThank you,\nNewton Weighbridge System",
    category: "PreBooking",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_prebooking_late_arrival",
    name: "Pre-Booking Late Arrival",
    subject: "Late Arrival Alert - {{registrationNumber}}",
    body: "Hello {{userName}},\n\nA pre-booked truck has not arrived on time.\n\nDetails:\n- Vehicle: {{registrationNumber}}\n- Order: {{orderNumber}}\n- Scheduled: {{scheduledDate}} at {{scheduledTime}}\n- Current Time: {{date}} at {{time}}\n- Delay: 24+ hours\n\nPlease contact the transporter.\n\nThank you,\nNewton Weighbridge System",
    category: "PreBooking",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  // Driver Notifications (2)
  {
    id: "tpl_driver_license_expiring_7",
    name: "Driver License Expiring (7 days)",
    subject: "Urgent: License Expiring in 7 Days - {{driverName}}",
    body: "Hello {{userName}},\n\nA driver's license is expiring soon.\n\nDetails:\n- Driver: {{driverName}}\n- License Number: {{licenseNumber}}\n- Expiry Date: {{expiryDate}}\n- Days Remaining: 7\n\nPlease renew immediately to avoid service disruption.\n\nThank you,\nNewton Weighbridge System",
    category: "Driver",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
  {
    id: "tpl_driver_license_expiring_30",
    name: "Driver License Expiring (30 days)",
    subject: "License Renewal Reminder - {{driverName}}",
    body: "Hello {{userName}},\n\nA driver's license will expire in 30 days.\n\nDetails:\n- Driver: {{driverName}}\n- License Number: {{licenseNumber}}\n- Expiry Date: {{expiryDate}}\n- Days Remaining: 30\n\nPlease schedule renewal at your earliest convenience.\n\nThank you,\nNewton Weighbridge System",
    category: "Driver",
    companyId: DEFAULT_COMPANY_ID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
    isActive: true,
  },
]

const DEFAULT_ROLES = [
  {
    id: "r_newton_admin",
    name: "Newton Administrator",
    permissionKeys: ["*"], // Wildcard includes admin.users.manageGlobalAdmins
    description: "Full system access and configuration",
  },
  {
    id: "r_site_admin",
    name: "Site Administrator",
    permissionKeys: [
      "assets.view",
      "assets.add",
      "assets.edit",
      "orders.view",
      "orders.viewAll",
      "preBooking.view",
      "weighbridge.tare",
      "weighbridge.gross",
      "security.in",
      "security.out",
      "admin.sites.view",
      "admin.sites",
      "admin.weighbridge",
    ],
    description: "Site-level management and operations",
  },
  {
    id: "r_logistics_coordinator",
    name: "Logistics Coordinator",
    permissionKeys: [
      "assets.view",
      "orders.view",
      "orders.create",
      "orders.allocate",
      "orders.viewAll",
      "preBooking.view",
      "preBooking.create",
      "preBooking.edit",
    ],
    description: "Order and pre-booking management",
  },
  {
    id: "r_allocation_officer",
    name: "Allocation Officer",
    permissionKeys: ["orders.view", "orders.allocate", "orders.viewAll", "preBooking.view"],
    description: "Order allocation and distribution",
  },
  {
    id: "r_transporter",
    name: "Transporter",
    permissionKeys: ["assets.view", "orders.view", "preBooking.view"],
    description: "View assigned orders and assets only",
  },
  {
    id: "r_induction_officer",
    name: "Induction Officer",
    permissionKeys: ["assets.view", "assets.add", "assets.edit", "assets.delete"],
    description: "Asset induction and management",
  },
  {
    id: "r_weighbridge_supervisor",
    name: "Weighbridge Supervisor",
    permissionKeys: [
      "weighbridge.tare",
      "weighbridge.gross",
      "weighbridge.calibrate",
      "weighbridge.override",
      "admin.weighbridge",
    ],
    description: "Weighbridge operations and calibration",
  },
  {
    id: "r_weighbridge_operator",
    name: "Weighbridge Operator",
    permissionKeys: ["weighbridge.tare", "weighbridge.gross"],
    description: "Weight capture operations only",
  },
  {
    id: "r_security",
    name: "Security Personnel",
    permissionKeys: ["security.in", "security.out"],
    description: "Security checkpoint operations",
  },
  {
    id: "r_contact",
    name: "Contact",
    permissionKeys: [],
    description: "Contact person (cannot log in to the system)",
  },
]

async function clearCollection(collectionName: string, sendProgress: (data: ProgressData) => void) {
  sendProgress({
    stage: "clearing",
    message: `Fetching ${collectionName} collection...`,
    collection: collectionName,
  })

  const snapshot = await adminDb.collection(collectionName).get()
  const totalDocs = snapshot.size

  sendProgress({
    stage: "clearing",
    message: `Found ${totalDocs} documents in ${collectionName}`,
    collection: collectionName,
    count: totalDocs,
  })

  if (totalDocs === 0) {
    return 0
  }

  if (collectionName === "users") {
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const authUid = (data.authUid as string | undefined) ?? docSnap.id
      try {
        await adminAuth.deleteUser(authUid)
      } catch (error) {
        console.warn(`Failed to delete auth user ${authUid}:`, error)
      }
    }
  }

  const batch = adminDb.batch()
  snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref))
  await batch.commit()

  sendProgress({
    stage: "clearing",
    message: `Deleted ${totalDocs} documents from ${collectionName}`,
    collection: collectionName,
    count: totalDocs,
    completed: true,
  })

  return totalDocs
}

async function seedCompany(sendProgress: (data: ProgressData) => void) {
  // Seed Dev Company (mine)
  await adminDb.collection("companies").doc(DEFAULT_COMPANY_ID).set(DEFAULT_COMPANY)
  sendProgress({
    stage: "seeding_companies",
    message: `Seeded company ${DEFAULT_COMPANY.name} (ID: ${DEFAULT_COMPANY_ID})`,
    collection: "companies",
    count: 1,
  })

  // Seed VR Cargo (transporter)
  await adminDb.collection("companies").doc(VR_CARGO_COMPANY_ID).set(VR_CARGO_COMPANY)
  sendProgress({
    stage: "seeding_companies",
    message: `Seeded company ${VR_CARGO_COMPANY.name} (ID: ${VR_CARGO_COMPANY_ID})`,
    collection: "companies",
    count: 2,
    completed: true,
  })

  return 2
}

async function seedDefaultUser(sendProgress: (data: ProgressData) => void): Promise<string> {
  const createdUser = await adminAuth.createUser({
    email: DEFAULT_USER_EMAIL,
    password: DEFAULT_USER_PASSWORD,
    displayName: "Dev User",
    emailVerified: true,
  })

  await adminDb
    .collection("users")
    .doc(createdUser.uid)
    .set({
      ...DEFAULT_USER_PROFILE,
      id: createdUser.uid,
      authUid: createdUser.uid,
      isGlobal: DEFAULT_USER_PROFILE.isGlobal,
    })

  sendProgress({
    stage: "seeding_users",
    message: `Seeded default user (${DEFAULT_USER_EMAIL}) with uid ${createdUser.uid}`,
    collection: "users",
    count: 1,
  })
  return createdUser.uid
}

async function seedSecondUser(sendProgress: (data: ProgressData) => void): Promise<string> {
  const createdUser = await adminAuth.createUser({
    email: SECOND_USER_EMAIL,
    password: SECOND_USER_PASSWORD,
    displayName: "Admin User",
    emailVerified: true,
  })

  await adminDb
    .collection("users")
    .doc(createdUser.uid)
    .set({
      ...SECOND_USER_PROFILE,
      id: createdUser.uid,
      authUid: createdUser.uid,
      isGlobal: SECOND_USER_PROFILE.isGlobal,
    })

  sendProgress({
    stage: "seeding_users",
    message: `Seeded second user (${SECOND_USER_EMAIL}) with uid ${createdUser.uid}`,
    collection: "users",
    count: 2,
  })
  return createdUser.uid
}

async function seedVRCargoUser(sendProgress: (data: ProgressData) => void): Promise<string> {
  const createdUser = await adminAuth.createUser({
    email: VR_CARGO_USER_EMAIL,
    password: VR_CARGO_USER_PASSWORD,
    displayName: "Fleet Manager",
    emailVerified: true,
  })

  await adminDb
    .collection("users")
    .doc(createdUser.uid)
    .set({
      ...VR_CARGO_USER_PROFILE,
      id: createdUser.uid,
      authUid: createdUser.uid,
      isGlobal: VR_CARGO_USER_PROFILE.isGlobal,
    })

  sendProgress({
    stage: "seeding_users",
    message: `Seeded VR Cargo user (${VR_CARGO_USER_EMAIL}) with uid ${createdUser.uid}`,
    collection: "users",
    count: 3,
    completed: true,
  })
  return createdUser.uid
}

const CONTACT_USERS = [
  { firstName: "John", lastName: "Smith", email: "john.smith@company.co.za", phone: "+27821234001" },
  { firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@company.co.za", phone: "+27821234002" },
  { firstName: "Michael", lastName: "Williams", email: "michael.williams@company.co.za", phone: "+27821234003" },
  { firstName: "Emma", lastName: "Brown", email: "emma.brown@company.co.za", phone: "+27821234004" },
  { firstName: "David", lastName: "Jones", email: "david.jones@company.co.za", phone: "+27821234005" },
  { firstName: "Lisa", lastName: "Miller", email: "lisa.miller@company.co.za", phone: "+27821234006" },
  { firstName: "James", lastName: "Davis", email: "james.davis@company.co.za", phone: "+27821234007" },
  { firstName: "Jennifer", lastName: "Garcia", email: "jennifer.garcia@company.co.za", phone: "+27821234008" },
  { firstName: "Robert", lastName: "Martinez", email: "robert.martinez@company.co.za", phone: "+27821234009" },
  { firstName: "Patricia", lastName: "Rodriguez", email: "patricia.rodriguez@company.co.za", phone: "+27821234010" },
]

async function seedContactUsers(sendProgress: (data: ProgressData) => void): Promise<number> {
  let count = 0
  for (const contact of CONTACT_USERS) {
    // Create auth user with disabled login (no password set properly)
    const createdUser = await adminAuth.createUser({
      email: contact.email,
      displayName: `${contact.firstName} ${contact.lastName}`,
      emailVerified: false,
      disabled: true, // Prevent login
    })

    await adminDb
      .collection("users")
      .doc(createdUser.uid)
      .set({
        id: createdUser.uid,
        authUid: createdUser.uid,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        displayName: `${contact.firstName} ${contact.lastName}`,
        phoneNumber: contact.phone,
        roleId: "r_contact",
        companyId: DEFAULT_COMPANY_ID,
        isGlobal: false,
        canLogin: false, // Contact-only user, cannot log in
        notificationPreferences: Object.fromEntries(
          Object.keys(getDefaultNotificationPreferences("mine")).map(key => [key, false])
        ),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })

    count += 1
    sendProgress({
      stage: "seeding_contacts",
      message: `Seeded contact user ${contact.firstName} ${contact.lastName}`,
      collection: "users",
      progress: { current: count, total: CONTACT_USERS.length },
    })
  }

  sendProgress({
    stage: "seeding_contacts",
    message: `Completed seeding ${count} contact users`,
    collection: "users",
    count,
    completed: true,
  })

  return count
}

async function seedTransporters(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const transporter of TRANSPORTERS) {
    await adminDb
      .collection("transporters")
      .doc(transporter.id)
      .set({
        ...transporter,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_transporters",
      message: `Seeded transporter ${transporter.name} (ID: ${transporter.id})`,
      collection: "transporters",
      progress: { current: count, total: TRANSPORTERS.length },
    })
  }

  sendProgress({
    stage: "seeding_transporters",
    message: `Completed seeding ${count} transporters`,
    collection: "transporters",
    count,
    completed: true,
  })

  return count
}

async function seedAssets(sendProgress: (data: ProgressData) => void) {
  const dataPath = path.join(process.cwd(), "data", "assets-data.json")
  if (!fs.existsSync(dataPath)) {
    sendProgress({
      stage: "seeding_assets",
      message: "No assets data file found. Skipping asset seed.",
      collection: "assets",
      completed: true,
    })
    return 0
  }

  const assets: Array<{ id: string; [key: string]: any }> = JSON.parse(fs.readFileSync(dataPath, "utf8"))

  sendProgress({
    stage: "seeding_assets",
    message: `Found ${assets.length} assets to seed`,
    progress: { current: 0, total: assets.length },
  })

  let count = 0
  const batchSize = 500
  let batch = adminDb.batch()
  let batchCount = 0

  for (const asset of assets) {
    const { id, registration, licenceNumber, ntCode, idNumber, ...data } = asset

    // Transform Android app field names to web app schema
    const transformedData: any = {
      ...data,
      companyId: data.companyId ?? VR_CARGO_COMPANY_ID, // All assets belong to VR Cargo (transporter company)
      // Note: 'type' field is kept as-is from Android app
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      dbCreatedAt: FieldValue.serverTimestamp(),
      dbUpdatedAt: FieldValue.serverTimestamp(),
      isActive: data.isActive ?? true,
    }

    // Map Android app field names (registration, idNumber, licenceNumber, ntCode)
    if (registration) {
      transformedData.registration = registration // Android app field name
    }

    if (idNumber) {
      transformedData.idNumber = idNumber // Android app field name
    }

    if (licenceNumber) {
      transformedData.licenceNumber = licenceNumber // Android app field name (British spelling)
    }

    // Map ntCode (Newton QR identifier - NaTIS transaction code)
    // The ntCode is scanned twice during induction (firstQRCode, secondQRCode) for verification
    if (ntCode) {
      transformedData.ntCode = ntCode.trim() // Android app field name
    }

    batch.set(adminDb.collection("assets").doc(id), transformedData)

    batchCount += 1
    count += 1

    if (batchCount >= batchSize) {
      await batch.commit()
      batch = adminDb.batch()
      batchCount = 0
      sendProgress({
        stage: "seeding_assets",
        message: `Seeded ${count} / ${assets.length} assets...`,
        collection: "assets",
        progress: { current: count, total: assets.length },
      })
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  sendProgress({
    stage: "seeding_assets",
    message: `Completed seeding ${count} assets`,
    collection: "assets",
    count,
    completed: true,
  })

  return count
}

async function seedNotificationTemplates(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const tpl of DEFAULT_TEMPLATES) {
    await adminDb.collection("notification_templates").doc(tpl.id).set(tpl)
    count += 1
    sendProgress({
      stage: "seeding_templates",
      message: `Seeded notification template ${tpl.name}`,
      collection: "notification_templates",
      progress: { current: count, total: DEFAULT_TEMPLATES.length },
    })
  }

  sendProgress({
    stage: "seeding_templates",
    message: `Completed seeding ${count} notification templates`,
    collection: "notification_templates",
    count,
    completed: true,
  })

  return count
}

async function seedPermissions(sendProgress: (data: ProgressData) => void) {
  const permissionsData = {
    permissions: {
      // Asset Management
      "assets.view": { description: "View assets" },
      "assets.add": { description: "Add new assets" },
      "assets.edit": { description: "Edit existing assets" },
      "assets.delete": { description: "Delete assets" },

      // Order Management
      "orders.view": { description: "View orders" },
      "orders.create": { description: "Create new orders" },
      "orders.allocate": { description: "Allocate orders" },
      "orders.cancel": { description: "Cancel orders" },
      "orders.viewAll": { description: "View all orders (not just assigned)" },

      // Pre-Booking
      "preBooking.view": { description: "View pre-bookings" },
      "preBooking.create": { description: "Create pre-bookings" },
      "preBooking.edit": { description: "Edit pre-bookings" },

      // Operational Flows
      "security.in": { description: "Perform security in checks" },
      "security.out": { description: "Perform security out checks" },
      "weighbridge.tare": { description: "Capture tare weight" },
      "weighbridge.gross": { description: "Capture gross weight" },
      "weighbridge.calibrate": { description: "Perform weighbridge calibration" },
      "weighbridge.override": { description: "Manual weight override" },

      // Administrative
      "admin.companies": { description: "Manage companies" },
      "admin.users": { description: "Manage users" },
      "admin.products": { description: "Manage products" },
      "admin.orderSettings": { description: "Configure order settings" },
      "admin.clients": { description: "Manage clients" },
      "admin.sites": { description: "Manage sites" },
      "admin.weighbridge": { description: "Configure weighbridge" },
      "admin.notifications": { description: "Configure notifications" },
      "admin.system": { description: "System-wide settings" },
      "admin.securityAlerts": { description: "Configure security alerts" },

      // Special
      "emergency.override": { description: "Emergency override access" },
      "orders.editCompleted": { description: "Edit completed orders" },
      "records.delete": { description: "Delete records permanently" },
      "preBooking.bypass": { description: "Bypass pre-booking requirements" },
    },
  }

  await adminDb.doc("settings/permissions").set(permissionsData)

  sendProgress({
    stage: "seeding_permissions",
    message: "Seeded permissions document",
    completed: true,
  })

  return 1
}

async function seedRoles(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const role of DEFAULT_ROLES) {
    await adminDb
      .collection("roles")
      .doc(role.id)
      .set({
        ...role,
        // NOTE: Roles are GLOBAL - no companyId field
        hiddenForCompanies: [], // Initialize as empty - companies can hide roles individually
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_roles",
      message: `Seeded global role ${role.name}`,
      collection: "roles",
      progress: { current: count, total: DEFAULT_ROLES.length },
    })
  }

  sendProgress({
    stage: "seeding_roles",
    message: `Completed seeding ${count} global roles (shared across all companies)`,
    collection: "roles",
    count,
    completed: true,
  })

  return count
}

async function seedProducts(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const product of DEFAULT_PRODUCTS) {
    await adminDb
      .collection("products")
      .doc(product.id)
      .set({
        ...product,
        companyId: DEFAULT_COMPANY_ID,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_products",
      message: `Seeded product ${product.name}`,
      collection: "products",
      progress: { current: count, total: DEFAULT_PRODUCTS.length },
    })
  }

  sendProgress({
    stage: "seeding_products",
    message: `Completed seeding ${count} products`,
    collection: "products",
    count,
    completed: true,
  })

  return count
}

async function seedClients(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const client of DEFAULT_CLIENTS) {
    await adminDb
      .collection("clients")
      .doc(client.id)
      .set({
        ...client,
        companyId: DEFAULT_COMPANY_ID,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_clients",
      message: `Seeded client ${client.name}`,
      collection: "clients",
      progress: { current: count, total: DEFAULT_CLIENTS.length },
    })
  }

  sendProgress({
    stage: "seeding_clients",
    message: `Completed seeding ${count} clients`,
    collection: "clients",
    count,
    completed: true,
  })

  return count
}

async function seedSites(sendProgress: (data: ProgressData) => void, contactUserIds: string[]) {
  let count = 0
  for (let i = 0; i < DEFAULT_SITES.length; i++) {
    const site = DEFAULT_SITES[i]
    // Assign contact users to sites (rotate through available contacts)
    const mainContactId = contactUserIds[i % contactUserIds.length]
    // Assign 1-2 secondary contacts
    const secondaryContactIds: string[] = []
    if (contactUserIds.length > 1) {
      secondaryContactIds.push(contactUserIds[(i + 1) % contactUserIds.length])
    }
    if (contactUserIds.length > 2) {
      secondaryContactIds.push(contactUserIds[(i + 2) % contactUserIds.length])
    }

    await adminDb
      .collection("sites")
      .doc(site.id)
      .set({
        ...site,
        mainContactId,
        secondaryContactIds,
        companyId: DEFAULT_COMPANY_ID,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_sites",
      message: `Seeded site ${site.name}`,
      collection: "sites",
      progress: { current: count, total: DEFAULT_SITES.length },
    })
  }

  sendProgress({
    stage: "seeding_sites",
    message: `Completed seeding ${count} sites`,
    collection: "sites",
    count,
    completed: true,
  })

  return count
}

async function seedGroups(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const group of DEFAULT_GROUPS) {
    await adminDb
      .collection("groups")
      .doc(group.id)
      .set({
        name: group.name,
        level: group.level,
        path: group.path,
        companyId: DEFAULT_COMPANY_ID,
        ...(group.description && { description: group.description }),
        ...(group.parentGroupId && { parentGroupId: group.parentGroupId }),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_groups",
      message: `Seeded group ${group.name}`,
      collection: "groups",
      progress: { current: count, total: DEFAULT_GROUPS.length },
    })
  }

  sendProgress({
    stage: "seeding_groups",
    message: `Completed seeding ${count} groups`,
    collection: "groups",
    count,
    completed: true,
  })

  return count
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: ProgressData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const results = {
        cleared: { companies: 0, users: 0, transporters: 0, assets: 0, templates: 0, roles: 0, products: 0, clients: 0, sites: 0, groups: 0 },
        seeded: { permissions: 0, companies: 0, users: 0, transporters: 0, assets: 0, templates: 0, roles: 0, products: 0, clients: 0, sites: 0, groups: 0 },
      }

      try {
        sendProgress({ stage: "start", message: "Starting database seed process..." })

        // Clear all collections
        results.cleared.companies = await clearCollection("companies", sendProgress)
        results.cleared.users = await clearCollection("users", sendProgress)
        results.cleared.transporters = await clearCollection("transporters", sendProgress)
        results.cleared.assets = await clearCollection("assets", sendProgress)
        results.cleared.templates = await clearCollection("notification_templates", sendProgress)
        results.cleared.roles = await clearCollection("roles", sendProgress)
        results.cleared.products = await clearCollection("products", sendProgress)
        results.cleared.clients = await clearCollection("clients", sendProgress)
        results.cleared.sites = await clearCollection("sites", sendProgress)
        results.cleared.groups = await clearCollection("groups", sendProgress)

        // Seed base data
        results.seeded.permissions = await seedPermissions(sendProgress)
        results.seeded.companies = await seedCompany(sendProgress)
        const userId = await seedDefaultUser(sendProgress)
        const secondUserId = await seedSecondUser(sendProgress)
        const vrCargoUserId = await seedVRCargoUser(sendProgress)
        results.seeded.users = 3 // Now we have 3 login users (2 for Dev Company, 1 for VR Cargo)

        // Seed contact users and collect their IDs for site assignment
        const contactUserIds: string[] = []
        const contactUsersSnapshot = await adminDb.collection("users").where("roleId", "==", "r_contact").get()
        const existingContactIds = contactUsersSnapshot.docs.map(doc => doc.id)

        const contactCount = await seedContactUsers(sendProgress)
        results.seeded.users += contactCount

        // Collect contact user IDs (both existing and newly created)
        const allContactUsersSnapshot = await adminDb.collection("users").where("roleId", "==", "r_contact").get()
        contactUserIds.push(...allContactUsersSnapshot.docs.map(doc => doc.id))

        // Update company with the created user's ID as mainContactId and primaryContactId
        await adminDb.collection("companies").doc(DEFAULT_COMPANY_ID).update({
          mainContactId: userId,
          "securityAlerts.primaryContactId": userId,
          updatedAt: Date.now(),
          dbUpdatedAt: FieldValue.serverTimestamp(),
        })
        sendProgress({
          stage: "seeding_companies",
          message: `Updated company with mainContactId and primaryContactId: ${userId}`,
        })

        // Seed Phase 2 master data
        results.seeded.products = await seedProducts(sendProgress)
        results.seeded.clients = await seedClients(sendProgress)
        results.seeded.groups = await seedGroups(sendProgress)
        results.seeded.sites = await seedSites(sendProgress, contactUserIds)

        // Seed operational data
        results.seeded.transporters = await seedTransporters(sendProgress)
        results.seeded.assets = await seedAssets(sendProgress)
        results.seeded.templates = await seedNotificationTemplates(sendProgress)
        results.seeded.roles = await seedRoles(sendProgress)

        sendProgress({
          stage: "complete",
          message: "Database seeded successfully!",
          results,
          completed: true,
        })
        sendProgress({
          stage: "summary",
          message: `Seed summary -> Companies: ${results.seeded.companies}, Users: ${results.seeded.users}, Products: ${results.seeded.products}, Clients: ${results.seeded.clients}, Groups: ${results.seeded.groups}, Sites: ${results.seeded.sites}, Roles: ${results.seeded.roles}, Templates: ${results.seeded.templates}`,
        })
      } catch (error) {
        console.error("Error seeding database:", error)
        sendProgress({
          stage: "error",
          message: error instanceof Error ? error.message : "Failed to seed database",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
