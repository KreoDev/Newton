/**
 * File Upload Configuration
 *
 * CRITICAL: NEVER use hardcoded file size limits or allowed types in the codebase.
 * Always import and use these constants to ensure consistency.
 *
 * @example
 * ```typescript
 * import { UPLOAD } from "@/lib/constants"
 *
 * // ✅ CORRECT
 * if (file.size > UPLOAD.MAX_PROFILE_IMAGE_SIZE) { ... }
 * if (!UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type)) { ... }
 *
 * // ❌ WRONG
 * if (file.size > 10 * 1024 * 1024) { ... }
 * if (!["image/jpeg", "image/png"].includes(file.type)) { ... }
 * ```
 */

export const UPLOAD = {
  // File Size Limits (in bytes)
  MAX_PROFILE_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_AVATAR_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed File Types
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "image/jpeg", "image/png"],

  // File Size Display (for UI)
  MAX_PROFILE_IMAGE_SIZE_MB: 10,
  MAX_DOCUMENT_SIZE_MB: 50,
  MAX_AVATAR_SIZE_MB: 10,
} as const
