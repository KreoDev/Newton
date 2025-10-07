import { Timestamp } from "firebase/firestore"

export interface Timestamped {
  createdAt: number
  updatedAt: number
  dbCreatedAt?: Timestamp
  dbUpdatedAt?: Timestamp
}

export interface CompanyScoped {
  companyId: string
}

// Summary types for data service
export interface CompanySummary {
  id: string
  name: string
}

export interface RoleSummary {
  id: string
  name: string
}

// Strongly-typed notification preferences per data-model.md
export interface NotificationPreferences {
  // Asset Notifications
  "asset.added": boolean
  "asset.inactive": boolean
  "asset.edited": boolean
  "asset.deleted": boolean
  // Order Notifications
  "order.created": boolean
  "order.allocated": boolean
  "order.cancelled": boolean
  "order.completed": boolean
  "order.expiring": boolean
  // Weighbridge Notifications
  "weighbridge.overload": boolean
  "weighbridge.underweight": boolean
  "weighbridge.violations": boolean
  "weighbridge.manualOverride": boolean
  // Pre-Booking & Scheduling Notifications
  "preBooking.created": boolean
  "preBooking.lateArrival": boolean
  // Security & Compliance Notifications
  "security.invalidLicense": boolean
  "security.unbookedArrival": boolean
  "security.noActiveOrder": boolean
  "security.sealMismatch": boolean
  "security.incorrectSealsNo": boolean
  "security.unregisteredAsset": boolean
  "security.inactiveEntity": boolean
  "security.incompleteTruck": boolean
  // Asset & Driver Alerts
  "driver.licenseExpiring7": boolean
  "driver.licenseExpiring30": boolean
  // System Notifications
  "system.calibrationDue": boolean
}

export interface User extends Timestamped, CompanyScoped {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string // Required per data-model.md:24
  phoneNumber: string // Required per data-model.md:27
  roleId: string
  permissionOverrides?: Record<string, boolean> // Per-user permission adjustments (data-model.md:29)
  profilePicture?: string // Optional profile image URL (data-model.md:30)
  preferredEmail?: string // Alternative email for notifications (data-model.md:32)
  notificationPreferences: NotificationPreferences
  isActive: boolean
  isGlobal: boolean
  canLogin?: boolean // If false, user is contact-only (no Firebase Auth account). Defaults to true.
}

// NOTE: Roles are GLOBAL - not company-scoped (do not extend CompanyScoped)
export interface Role extends Timestamped {
  id: string
  name: string
  permissionKeys: string[]
  description?: string
  isActive: boolean // Global active/inactive flag
  hiddenForCompanies?: string[] // Array of companyIds that have hidden this role
}

// Company configuration interfaces per data-model.md
export interface MineConfig {
  sites?: string[]
  defaultOperatingHours?: Record<string, { open: string; close: string }>
}

export interface TransporterConfig {
  fleetSize?: number
  assetCategories?: string[]
  complianceDocuments?: string[]
  logisticsPartnerIds?: string[]
}

export interface LogisticsCoordinatorConfig {
  managedMineIds?: string[]
  preferredProductIds?: string[]
  dispatchRegions?: string[]
  escalationContacts?: string[]
}

export interface OrderConfig {
  orderNumberMode: "autoOnly" | "manualAllowed"
  orderNumberPrefix?: string
  defaultDailyTruckLimit: number
  defaultDailyWeightLimit: number
  defaultMonthlyLimit?: number
  defaultTripLimit: number
  defaultWeightPerTruck: number
  preBookingMode: "compulsory" | "optional"
  advanceBookingHours: number
  defaultSealRequired: boolean
  defaultSealQuantity: number
}

export interface SystemSettings {
  fleetNumberEnabled: boolean
  fleetNumberLabel: string
  transporterGroupEnabled: boolean
  transporterGroupLabel: string
  groupOptions: string[]
}

export interface SecurityAlerts {
  primaryContactId: string
  secondaryContactIds: string[]
  escalationMinutes: number
  qrMismatchContacts: string[]
  documentFailureContacts: string[]
  sealDiscrepancyContacts: string[]
  requiredResponseMinutes: number
}

export interface Company extends Timestamped {
  id: string
  name: string
  companyType: "mine" | "transporter" | "logistics_coordinator"
  registrationNumber?: string // Optional per user-flow-web.md:208
  vatNumber?: string
  physicalAddress: string
  mainContactId?: string // Optional per user-flow-web.md:208
  secondaryContactIds: string[]
  // Dual-role flags per user-flow-web.md:223-224, 252-253, 265-267
  isAlsoLogisticsCoordinator?: boolean // For transporters who also coordinate logistics
  isAlsoTransporter?: boolean // For logistics coordinators who also transport
  // Type-specific configurations (data-model.md:105-110)
  mineConfig?: MineConfig
  transporterConfig?: TransporterConfig
  logisticsCoordinatorConfig?: LogisticsCoordinatorConfig
  // Company-wide configurations (data-model.md:108-110)
  orderConfig?: OrderConfig
  systemSettings?: SystemSettings
  securityAlerts?: SecurityAlerts
  isActive: boolean
}

export interface Client extends Timestamped, CompanyScoped {
  id: string
  name: string
  registrationNumber: string
  vatNumber?: string
  physicalAddress: string
  contactName: string
  contactEmail: string
  contactPhone: string
  allowedSiteIds: string[]
  isActive: boolean
}

export interface Asset extends Timestamped, CompanyScoped {
  id: string
  assetType: "truck" | "trailer" | "driver"
  qrCode: string
  vehicleDiskData?: string
  driverLicenseData?: string
  registrationNumber?: string
  licenseNumber?: string
  licenseExpiryDate?: string
  fleetNumber?: string
  groupId?: string
  isActive: boolean
  inactiveReason?: string
  inactiveDate?: string
  deletedReason?: string
}

export interface Order extends Timestamped, CompanyScoped {
  id: string
  orderNumber: string
  orderType: "receiving" | "dispatching"
  clientCompanyId: string
  dispatchStartDate: string
  dispatchEndDate: string
  totalWeight: number
  collectionSiteId: string
  destinationSiteId: string
  productId: string
  sealRequired: boolean
  sealQuantity?: number
  dailyTruckLimit: number
  dailyWeightLimit: number
  monthlyLimit?: number
  tripLimit: number
  tripDuration?: number
  status: "pending" | "allocated" | "completed" | "cancelled"
  createdById: string
  completedWeight?: number
  completedTrips?: number
}

export interface PreBooking extends Timestamped, CompanyScoped {
  id: string
  orderId: string
  assetId: string
  transporterCompanyId: string
  scheduledDate: string
  scheduledTime: string
  tripsPerDay: number
  specialInstructions?: string
  status: "pending" | "arrived" | "late" | "completed"
  arrivalTime?: string
  createdById: string
}

export interface Product extends Timestamped, CompanyScoped {
  id: string
  name: string
  code: string
  categoryId?: string
  specifications?: string
  isActive: boolean
}

export interface Site extends Timestamped, CompanyScoped {
  id: string
  name: string
  siteType: "collection" | "destination"
  physicalAddress: string
  contactUserId: string
  operatingHours: Record<string, { open: string; close: string }>
  isActive: boolean
}

export interface WeighingRecord extends Timestamped, CompanyScoped {
  id: string
  orderId: string
  assetId: string
  weighbridgeId: string
  status: "tare_only" | "completed"
  tareWeight: number
  grossWeight?: number
  netWeight?: number
  tareTimestamp: string
  grossTimestamp?: string
  overloadFlag?: boolean
  underweightFlag?: boolean
  sealNumbers?: string[]
  ticketNumber: string
  operatorId: string
}

export interface Weighbridge extends Timestamped, CompanyScoped {
  id: string
  name: string
  location: string
  axleSetup: "single" | "multiple"
  serialPortConfig?: Record<string, unknown>
  tolerancePercent: number
  overloadThreshold: number
  underweightThreshold: number
  lastCalibration?: string
  nextCalibration?: string
  isActive: boolean
}

export interface Calibration extends Timestamped, CompanyScoped {
  id: string
  weighbridgeId: string
  knownWeight: number
  measuredWeight: number
  variance: number
  adjustmentFactor: number
  certificateNumber?: string
  performedById: string
}

export interface Seal extends Timestamped, CompanyScoped {
  id: string
  sealNumber: string
  orderId: string
  weighingRecordId: string
  status: "intact" | "broken" | "missing"
  appliedAt: string
  verifiedAt?: string
}

export interface SecurityCheck extends Timestamped, CompanyScoped {
  id: string
  checkType: "entry" | "exit"
  assetId: string
  driverId: string
  trailer1Id?: string
  trailer2Id?: string
  orderId?: string
  preBookingId?: string
  scanResults: Record<string, unknown>
  verificationStatus: "passed" | "failed" | "denied"
  denialReason?: string
  securityOfficerId: string
  timestamp: string
}

export interface NotificationTemplate extends Timestamped, CompanyScoped {
  id: string
  name: string
  subject: string
  body: string
  category: "asset" | "order" | "weighbridge" | "security" | "system"
}

export interface AuditLog extends Timestamped, CompanyScoped {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}
