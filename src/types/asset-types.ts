/**
 * Asset Type Definitions and Field Mappings
 * Based on South African driver's license and vehicle disk standards
 */

// Raw barcode data structures (from expo-sadl and vehicle disk scanner)
export interface VehicleInformation {
  registration: string
  make?: string
  model?: string
  colour?: string
  vehicleDiskNo?: string // License disk number
  expiryDate?: string
  engineNo?: string
  vin?: string // Vehicle Identification Number
  description?: string // Vehicle type description (e.g., "Sedan (Closed Top)", "Hatchback")
}

export interface PersonInformation {
  idNumber: string
  name: string
  surname: string
  initials?: string
  gender?: string
  birthDate?: string
  nationality?: string // Nationality code (e.g., "ZAF", "ZWE")
  countryOfBirth?: string // Country of birth
  securityCode?: string // Smart ID security code
  citizenshipStatus?: string // "CITIZEN" or "PERMANENT RESIDENT"
}

export interface LicenceInformation {
  licenceNumber: string
  issueDate?: string
  expiryDate: string
  driverRestrictions?: string
  licenceType?: string
  ntCode?: string // NaTIS transaction code
}

// Combined parsed data from barcode scans
export interface ParsedAssetData {
  type: "truck" | "trailer" | "driver" // Matches Android app field name
  qrCode: string
  vehicleInfo?: VehicleInformation
  personInfo?: PersonInformation
  licenceInfo?: LicenceInformation
}

// Asset induction wizard state
export interface AssetInductionState {
  companyId: string
  firstQRCode: string
  secondQRCode: string
  firstBarcodeData: string
  secondBarcodeData: string
  type: "truck" | "trailer" | "driver" // Matches Android app field name
  parsedData: ParsedAssetData
  fleetNumber?: string
  groupId?: string
  currentStep: number
}

// Field validation result
export interface FieldValidation {
  isValid: boolean
  error?: string
  warning?: string
  daysUntilExpiry?: number
}

// Expiry status for UI badges
export type ExpiryStatus = "valid" | "expiring-soon" | "expiring-critical" | "expired"

export interface ExpiryInfo {
  status: ExpiryStatus
  daysUntilExpiry: number
  expiryDate: string
  message: string
  color: "green" | "yellow" | "orange" | "red"
}
