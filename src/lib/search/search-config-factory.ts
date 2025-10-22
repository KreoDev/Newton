import type { SearchConfig, SearchField } from "@/services/search.service"

/**
 * Factory for creating standardized search configurations
 * Reduces duplication in search config definitions
 */
export class SearchConfigFactory {
  /**
   * Default values for search configs
   */
  private static readonly DEFAULTS = {
    debounceMs: 300,
    minSearchLength: 1,
    maxResults: 500,
  }

  /**
   * Create a basic search config with name field
   */
  static createBasic(primaryFields: string[], secondaryFields?: string[], options?: Partial<SearchConfig>): SearchConfig {
    const fields: SearchField[] = [
      ...primaryFields.map(field => ({ path: field, weight: 2 })),
      ...(secondaryFields || []).map(field => ({ path: field, weight: 1 })),
    ]

    return {
      fields,
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? this.DEFAULTS.minSearchLength,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }

  /**
   * Create a search config for contact-based entities (name, email, phone)
   */
  static createContactConfig(nameFields: string[], contactFields: string[], options?: Partial<SearchConfig>): SearchConfig {
    const fields: SearchField[] = [
      ...nameFields.map(field => ({ path: field, weight: 2 })),
      ...contactFields.map(field => ({ path: field, weight: 1 })),
    ]

    return {
      fields,
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? 2,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }

  /**
   * Create a search config for asset-based entities (registration, fleet number, etc.)
   */
  static createAssetConfig(identifierFields: string[], infoFields: string[], options?: Partial<SearchConfig>): SearchConfig {
    const fields: SearchField[] = [
      ...identifierFields.map(field => ({ path: field, weight: 2 })),
      ...infoFields.map(field => ({ path: field, weight: 1 })),
    ]

    return {
      fields,
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? 1,
      maxResults: options?.maxResults ?? 1000,
    }
  }

  /**
   * Create a search config with custom field weights
   */
  static createCustom(fields: SearchField[], options?: Partial<SearchConfig>): SearchConfig {
    return {
      fields,
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? this.DEFAULTS.minSearchLength,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }

  /**
   * Create a search config for simple name-based entities
   */
  static createSimpleNameConfig(nameField: string = "name", options?: Partial<SearchConfig>): SearchConfig {
    return {
      fields: [{ path: nameField, weight: 2 }],
      debounceMs: options?.debounceMs ?? 200,
      minSearchLength: options?.minSearchLength ?? 1,
      maxResults: options?.maxResults ?? 100,
    }
  }

  /**
   * Create a search config for entities with name and description
   */
  static createNameDescriptionConfig(
    nameField: string = "name",
    descriptionField: string = "description",
    options?: Partial<SearchConfig>
  ): SearchConfig {
    return {
      fields: [
        { path: nameField, weight: 2 },
        { path: descriptionField, weight: 1 },
      ],
      debounceMs: options?.debounceMs ?? 200,
      minSearchLength: options?.minSearchLength ?? 1,
      maxResults: options?.maxResults ?? 100,
    }
  }

  /**
   * Create a search config for company/organization entities
   */
  static createOrganizationConfig(additionalFields?: string[], options?: Partial<SearchConfig>): SearchConfig {
    const fields: SearchField[] = [
      { path: "name", weight: 2 },
      { path: "registrationNumber", weight: 2 },
      ...(additionalFields || []).map(field => ({ path: field, weight: 1 })),
    ]

    return {
      fields,
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? 2,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }

  /**
   * Create a search config for user entities
   */
  static createUserConfig(options?: Partial<SearchConfig>): SearchConfig {
    return {
      fields: [
        { path: "firstName", weight: 2 },
        { path: "lastName", weight: 2 },
        { path: "displayName", weight: 2 },
        { path: "email", weight: 1 },
        { path: "phoneNumber", weight: 1 },
      ],
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? 1,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }

  /**
   * Create a search config for product entities
   */
  static createProductConfig(options?: Partial<SearchConfig>): SearchConfig {
    return {
      fields: [
        { path: "name", weight: 3 },
        { path: "code", weight: 2 },
        { path: "specifications", weight: 1 },
      ],
      debounceMs: options?.debounceMs ?? this.DEFAULTS.debounceMs,
      minSearchLength: options?.minSearchLength ?? 1,
      maxResults: options?.maxResults ?? this.DEFAULTS.maxResults,
    }
  }
}

/**
 * Helper function to create a field with transformer
 */
export function createFieldWithTransformer(path: string, weight: number, transformer: (value: any) => string): SearchField {
  return { path, weight, transformer }
}
