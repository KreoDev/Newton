import { SearchConfig } from "@/services/search.service"

export const SEARCH_CONFIGS = {
  users: {
    fields: [
      { path: "firstName", weight: 2 },
      { path: "lastName", weight: 2 },
      { path: "email", weight: 1 },
    ],
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  } as SearchConfig,

  roles: {
    fields: [
      { path: "name", weight: 2 },
      { path: "definedBy", weight: 1 },
    ],
    debounceMs: 200,
    minSearchLength: 1,
    maxResults: 100,
  } as SearchConfig,

  assets: {
    fields: [
      {
        path: "properties",
        weight: 1,
        transformer: (props: Record<string, any>) => {
          if (!props || typeof props !== "object") return ""
          return Object.values(props)
            .map(value => {
              if (value && typeof value === "object" && value.seconds) {
                // Handle Firestore timestamps
                return new Date(value.seconds * 1000).toLocaleDateString()
              }
              return String(value || "")
            })
            .join(" ")
        },
      },
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
