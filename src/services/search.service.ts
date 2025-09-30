import React from "react"

export interface SearchField {
  path: string
  weight?: number
  exact?: boolean
  transformer?: (value: any) => string
}

export interface SearchConfig {
  fields: SearchField[]
  debounceMs?: number
  minSearchLength?: number
  maxResults?: number
  caseSensitive?: boolean
}

export class SearchService {
  static search<T>(items: T[], searchTerm: string, config: SearchConfig): T[] {
    if (!searchTerm || searchTerm.length < (config.minSearchLength || 1)) {
      return items
    }

    const normalizedTerm = config.caseSensitive ? searchTerm : searchTerm.toLowerCase()

    const results = items.filter(item => {
      return config.fields.some(field => {
        const value = this.getNestedValue(item, field.path)
        const transformedValue = field.transformer ? field.transformer(value) : value
        const searchableValue = String(transformedValue || "")
        const normalizedValue = config.caseSensitive ? searchableValue : searchableValue.toLowerCase()

        if (field.exact) {
          return normalizedValue === normalizedTerm
        }

        return normalizedValue.includes(normalizedTerm)
      })
    })

    return results.slice(0, config.maxResults || 1000)
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      // Handle array indices and object properties
      if (current && typeof current === "object") {
        return current[key]
      }
      return undefined
    }, obj)
  }
}

// Utility function for search highlighting
export function highlightSearchTerm(text: string, searchTerm: string): React.JSX.Element {
  if (!searchTerm) return React.createElement(React.Fragment, null, text)

  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escapedSearchTerm})`, "gi")
  const parts = text.split(regex)

  const elements = parts.map((part, index) =>
    regex.test(part)
      ? React.createElement(
          "mark",
          {
            key: index,
            className: "bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded",
          },
          part
        )
      : part
  )

  return React.createElement(React.Fragment, null, ...elements)
}
