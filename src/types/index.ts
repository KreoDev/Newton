export interface Timestamped {
  createdAt: number
  updatedAt: number
  dbCreatedAt?: unknown
  dbUpdatedAt?: unknown
}

export interface CompanyScoped {
  companyId: string
}

export interface User extends Timestamped, CompanyScoped {
  id: string
  email: string
  firstName: string
  lastName: string
  roleId: string
  phoneNumber?: string
  displayName?: string
  avatar?: string
  isActive: boolean
  isGlobal: boolean
  notificationPreferences: Record<string, boolean>
}

export interface Role extends Timestamped, CompanyScoped {
  id: string
  name: string
  permissionKeys: string[]
  description?: string
  isActive: boolean
}

export interface Company extends Timestamped {
  id: string
  name: string
  companyType: "mine" | "transporter" | "logistics_coordinator"
  registrationNumber: string
  vatNumber?: string
  physicalAddress: string
  mainContactId: string
  secondaryContactIds: string[]
  mineConfig?: Record<string, unknown>
  transporterConfig?: Record<string, unknown>
  logisticsCoordinatorConfig?: Record<string, unknown>
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
