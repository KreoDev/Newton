// Meta fields shared by every document stored in Firestore
export interface BaseEntity {
  id: string
  /** Millisecond timestamp when doc was first created (new) */
  createdDate?: number
  /** Millisecond timestamp when doc was last modified (new) */
  modifiedDate?: number
  /** Company database key that this record belongs to */
  companyDB?: string
}

// Company root collection
export interface Company {
  id: string
  dbName: string
  name: string
}

// User and Authentication
export interface User extends BaseEntity {
  companyDB: string
  email: string
  firstName: string
  lastName: string
  roleId: string
  avatar?: string
  permissions?: Role["permissions"]
  preferences?: {
    [key: string]: unknown
  }
}

// Role and Permissions
export interface Role extends BaseEntity {
  name: string
  definedBy: "user" | "system"
  permissions: {
    [module: string]: {
      [action: string]: boolean
    }
  }
}

// Asset Types and Fields
export interface AssetType extends BaseEntity {
  companyDB: string
  name: string
  /** true if this asset type represents vehicles */
  isVehicle: boolean
  status: "active" | "inactive"
  fields: Field[]
}

export interface Field {
  id: string
  label: string
  fieldType: FieldType
  options?: string[]
  required: boolean
  scanType?: string
}

// Assets
export interface Asset extends BaseEntity {
  companyDB: string
  isVehicle: boolean
  assetTypeId: string
  registrationNumber: string
  fleetNumber?: string
  status: "active" | "sold" | "written_off" | "standby" | "sales_prep" | "inactive"
  registerNumber: string
  description?: string
  make?: string
  series?: string
  vinNumber: string
  engineNumber: string
  licenseExpiryDate?: Date
  max?: number
  transporterCode: string
  year: number
  optimalPayload: string
  axelCount: number
  assetTareWeight: number
  inductionDate: Date
  inductionUser: string
  documentsCount: number
  agreedValue?: number
  creatorId?: string
  newtonBarcodeId?: string
  properties: {
    [key: string]: any
  }
}

// Documents
export interface DocumentType extends BaseEntity {
  companyDB: string
  name: string
  attachableTo: "Asset" | "Employee" | "Leader" | "Follower"
  status: "active" | "standby" | "on_file"
  fields: Field[]
}

export interface Document extends BaseEntity {
  companyDB: string
  documentableType: string
  documentableId: string
  documentTypeId: string
  status: "active" | "archived" | "standby" | "on_file" | "standby_on_file"
  fileName: string
  fileUrl: string
  fileSize: number
  contentType: string
}

// Transporters
export interface Transporter extends BaseEntity {
  companyDB: string
  name: string
  email: string
  code: string
}

// Command system for Node.js communication
export interface Command extends BaseEntity {
  companyDB: string
  action: string
  payload: Record<string, unknown>
  processed: boolean
  processedAt?: Date
  result?: Record<string, unknown>
  error?: string
}

export interface ScanType {
  id: string
  name: string
}

// Form and UI types
export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "date" | "select" | "checkbox" | "textarea"
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: Record<string, unknown>
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  exportable?: boolean
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Constants
export const APP_MODULES = ["transporters", "employees", "assets"] as const

export const ACTIONS = ["list", "view", "create", "edit", "delete", "export", "print"] as const

export const FIELD_TYPES = ["date", "radio_buttons", "select", "text", "scan", "custom_scan", "number", "textarea", "user_select", "asset_select", "transporter_select", "checkbox"] as const

export type AppModule = (typeof APP_MODULES)[number]
export type Action = (typeof ACTIONS)[number]
export type FieldType = (typeof FIELD_TYPES)[number]
