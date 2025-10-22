/**
 * Form Validators
 * Reusable validation functions for forms across the application
 * Returns null if valid, error message string if invalid
 */

export class FormValidators {
  /**
   * Validate required field
   */
  static required(value: string | null | undefined, fieldName: string): string | null {
    if (!value || !value.trim()) {
      return `${fieldName} is required`
    }
    return null
  }

  /**
   * Validate email address
   */
  static email(value: string): string | null {
    if (!value || !value.trim()) {
      return "Email address is required"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address"
    }

    return null
  }

  /**
   * Validate phone number
   */
  static phone(value: string, required: boolean = true): string | null {
    if (!value || !value.trim()) {
      return required ? "Phone number is required" : null
    }

    // Basic phone validation - at least 10 digits
    const digitsOnly = value.replace(/\D/g, "")
    if (digitsOnly.length < 10) {
      return "Please enter a valid phone number (at least 10 digits)"
    }

    return null
  }

  /**
   * Validate minimum length
   */
  static minLength(value: string, min: number, fieldName: string): string | null {
    if (!value) {
      return `${fieldName} is required`
    }

    if (value.trim().length < min) {
      return `${fieldName} must be at least ${min} characters`
    }

    return null
  }

  /**
   * Validate maximum length
   */
  static maxLength(value: string, max: number, fieldName: string): string | null {
    if (value && value.trim().length > max) {
      return `${fieldName} must not exceed ${max} characters`
    }

    return null
  }

  /**
   * Validate uniqueness in collection
   */
  static uniqueInCollection<T>(
    value: string,
    collection: T[],
    field: keyof T,
    excludeId?: string,
    fieldName: string = "Value"
  ): string | null {
    if (!value || !value.trim()) {
      return null
    }

    const exists = collection.some(item => {
      const itemValue = String(item[field]).toLowerCase()
      const inputValue = value.trim().toLowerCase()
      const isSameValue = itemValue === inputValue
      const isDifferentItem = excludeId ? (item as any).id !== excludeId : true
      return isSameValue && isDifferentItem
    })

    if (exists) {
      return `${fieldName} "${value}" already exists`
    }

    return null
  }

  /**
   * Validate password strength
   */
  static password(value: string): string | null {
    if (!value) {
      return "Password is required"
    }

    if (value.length < 8) {
      return "Password must be at least 8 characters"
    }

    // Check for at least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(value)
    const hasLowerCase = /[a-z]/.test(value)
    const hasNumber = /[0-9]/.test(value)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }

    return null
  }

  /**
   * Validate password confirmation
   */
  static passwordConfirmation(password: string, confirmation: string): string | null {
    if (!confirmation) {
      return "Password confirmation is required"
    }

    if (password !== confirmation) {
      return "Passwords do not match"
    }

    return null
  }

  /**
   * Validate URL
   */
  static url(value: string, required: boolean = false): string | null {
    if (!value || !value.trim()) {
      return required ? "URL is required" : null
    }

    try {
      new URL(value)
      return null
    } catch {
      return "Please enter a valid URL"
    }
  }

  /**
   * Validate number range
   */
  static numberRange(value: number, min: number, max: number, fieldName: string): string | null {
    if (isNaN(value)) {
      return `${fieldName} must be a valid number`
    }

    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`
    }

    return null
  }

  /**
   * Validate positive number
   */
  static positiveNumber(value: number | string, fieldName: string): string | null {
    const num = typeof value === "string" ? parseFloat(value) : value

    if (isNaN(num)) {
      return `${fieldName} must be a valid number`
    }

    if (num <= 0) {
      return `${fieldName} must be greater than 0`
    }

    return null
  }

  /**
   * Validate non-negative number
   */
  static nonNegativeNumber(value: number | string, fieldName: string): string | null {
    const num = typeof value === "string" ? parseFloat(value) : value

    if (isNaN(num)) {
      return `${fieldName} must be a valid number`
    }

    if (num < 0) {
      return `${fieldName} must be 0 or greater`
    }

    return null
  }

  /**
   * Validate date is not in the past
   */
  static futureDate(value: Date | string, fieldName: string): string | null {
    const date = typeof value === "string" ? new Date(value) : value
    const now = new Date()

    if (date < now) {
      return `${fieldName} must be in the future`
    }

    return null
  }

  /**
   * Validate date is not in the future
   */
  static pastDate(value: Date | string, fieldName: string): string | null {
    const date = typeof value === "string" ? new Date(value) : value
    const now = new Date()

    if (date > now) {
      return `${fieldName} must be in the past`
    }

    return null
  }

  /**
   * Compose multiple validators
   */
  static compose(...validators: Array<() => string | null>): string | null {
    for (const validator of validators) {
      const error = validator()
      if (error) return error
    }
    return null
  }

  /**
   * Validate all fields and return first error
   */
  static validateAll(...validations: Array<string | null>): string | null {
    for (const validation of validations) {
      if (validation) return validation
    }
    return null
  }
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^[0-9]+$/,
  alpha: /^[a-zA-Z]+$/,
}
