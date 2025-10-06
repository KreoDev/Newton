import { SearchConfig } from "@/services/search.service"

export const SEARCH_CONFIGS = {
  // User Management
  users: {
    fields: [
      { path: "firstName", weight: 2 },
      { path: "lastName", weight: 2 },
      { path: "displayName", weight: 2 },
      { path: "email", weight: 1 },
      { path: "phoneNumber", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  roles: {
    fields: [
      { path: "name", weight: 2 },
      { path: "description", weight: 1 },
    ],
    debounceMs: 200,
    minSearchLength: 1,
    maxResults: 100,
  } as SearchConfig,

  // Company Management
  companies: {
    fields: [
      { path: "name", weight: 2 },
      { path: "registrationNumber", weight: 2 },
      { path: "companyType", weight: 1 },
      { path: "physicalAddress", weight: 1 },
      { path: "vatNumber", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 2,
    maxResults: 500,
  } as SearchConfig,

  clients: {
    fields: [
      { path: "name", weight: 2 },
      { path: "registrationNumber", weight: 2 },
      { path: "contactName", weight: 1 },
      { path: "contactEmail", weight: 1 },
      { path: "physicalAddress", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 2,
    maxResults: 500,
  } as SearchConfig,

  // Asset Management
  assets: {
    fields: [
      { path: "assetType", weight: 2 },
      { path: "registrationNumber", weight: 2 },
      { path: "licenseNumber", weight: 2 },
      { path: "qrCode", weight: 1 },
      { path: "fleetNumber", weight: 1 },
      { path: "groupId", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 1000,
  } as SearchConfig,

  assetTypes: {
    fields: [
      { path: "name", weight: 2 },
      { path: "status", weight: 1 },
      {
        path: "fields",
        weight: 1,
        transformer: (fields: Array<{ label: string; fieldType: string; scanType?: string }>) => {
          if (!Array.isArray(fields)) return ""
          return fields.map(f => `${f.label} ${f.fieldType} ${f.scanType || ""}`).join(" ")
        },
      },
    ],
    debounceMs: 200,
    minSearchLength: 1,
    maxResults: 100,
  } as SearchConfig,

  // Order Management
  orders: {
    fields: [
      { path: "orderNumber", weight: 3 },
      { path: "orderType", weight: 1 },
      { path: "status", weight: 1 },
      {
        path: "totalWeight",
        weight: 1,
        transformer: (weight: number) => weight ? `${weight} tons` : "",
      },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  preBookings: {
    fields: [
      { path: "orderId", weight: 2 },
      { path: "scheduledDate", weight: 1 },
      { path: "scheduledTime", weight: 1 },
      { path: "status", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  // Product & Site Management
  products: {
    fields: [
      { path: "name", weight: 2 },
      { path: "code", weight: 2 },
      { path: "specifications", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  sites: {
    fields: [
      { path: "name", weight: 2 },
      { path: "siteType", weight: 1 },
      { path: "physicalAddress", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 2,
    maxResults: 200,
  } as SearchConfig,

  // Weighbridge Operations
  weighingRecords: {
    fields: [
      { path: "ticketNumber", weight: 3 },
      { path: "orderId", weight: 2 },
      { path: "assetId", weight: 1 },
      { path: "status", weight: 1 },
      {
        path: "netWeight",
        weight: 1,
        transformer: (weight: number) => weight ? `${weight} tons` : "",
      },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 1000,
  } as SearchConfig,

  weighbridges: {
    fields: [
      { path: "name", weight: 2 },
      { path: "location", weight: 2 },
      { path: "axleSetup", weight: 1 },
    ],
    debounceMs: 200,
    minSearchLength: 1,
    maxResults: 100,
  } as SearchConfig,

  // Security & Tracking
  securityChecks: {
    fields: [
      { path: "checkType", weight: 2 },
      { path: "assetId", weight: 2 },
      { path: "driverId", weight: 1 },
      { path: "verificationStatus", weight: 1 },
      { path: "denialReason", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  // Legacy/Other (keeping for backward compatibility)
  transporters: {
    fields: [
      { path: "name", weight: 2 },
      { path: "code", weight: 2 },
      { path: "email", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  documentTypes: {
    fields: [
      { path: "name", weight: 2 },
      { path: "attachableTo", weight: 1 },
      { path: "status", weight: 1 },
      {
        path: "fields",
        weight: 1,
        transformer: (fields: Array<{ label: string; fieldType: string; scanType?: string }>) => {
          if (!Array.isArray(fields)) return ""
          return fields.map(f => `${f.label} ${f.fieldType} ${f.scanType || ""}`).join(" ")
        },
      },
    ],
    debounceMs: 200,
    minSearchLength: 1,
    maxResults: 100,
  } as SearchConfig,
} as const
