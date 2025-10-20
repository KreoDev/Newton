/**
 * Asset Field Mappings and Barcode Parsing
 * Integrates with South African driver's license and vehicle disk standards
 */

import { scan } from "@/services/scan.service"
import type {
  VehicleInformation,
  PersonInformation,
  LicenceInformation,
  ParsedAssetData,
  FieldValidation,
  ExpiryInfo,
  ExpiryStatus,
} from "@/types/asset-types"

export class AssetFieldMapper {
  /**
   * Parse vehicle disk barcode data
   * Returns extracted vehicle information
   */
  static parseVehicleDisk(barcodeData: string): VehicleInformation | { error: string } {
    try {
      const result = scan.getVehicleLicence(barcodeData)

      if ("error" in result) {
        return { error: result.error }
      }

      return {
        registration: result.vehicleReg || result.identifier || "",
        make: result.make,
        model: result.model,
        colour: result.colour,
        vehicleDiskNo: result.licenceDiskNo,
        expiryDate: result.dateOfExpiry,
        engineNo: result.engineNo,
        vin: result.vin,
        description: result.description, // Vehicle type description
      }
    } catch (error) {
      console.error("Error parsing vehicle disk:", error)
      return { error: "Failed to parse vehicle disk barcode" }
    }
  }

  /**
   * Parse driver license or ID barcode data
   * Returns extracted person and license information
   */
  static parseDriverLicense(barcodeData: string): { person: PersonInformation; licence?: LicenceInformation } | { error: string } {
    try {
      // First check if it's a driver's license with | delimiter
      if (barcodeData.includes("|")) {
        const result = scan.getID(barcodeData)

        if ("error" in result) {
          return { error: result.error || "Parsing error" }
        }

        // Extract person info
        const personInfo: PersonInformation = {
          idNumber: result.idNumber,
          name: result.names || "",
          surname: result.surname || "",
          initials: result.names?.split(" ").map(n => n[0]).join(".") || "",
          gender: result.gender,
          birthDate: result.dateOfBirth,
          nationality: result.nationality,
          countryOfBirth: result.countryOfBirth,
          securityCode: result.securityCode,
          citizenshipStatus: result.status,
        }

        // If it has license-specific fields, include them
        if ("cardNumber" in result) {
          const licenceInfo: LicenceInformation = {
            licenceNumber: result.cardNumber || result.idNumber,
            issueDate: result.dateOfIssue,
            expiryDate: result.dateOfBirth, // Driver licenses expire based on age
            driverRestrictions: "",
            licenceType: result.type || "SMARTID",
            ntCode: "",
          }

          return {
            person: personInfo,
            licence: licenceInfo,
          }
        }

        return { person: personInfo }
      }

      // Try as green book ID (13 digits)
      if (barcodeData.length === 13 && /^\d+$/.test(barcodeData)) {
        const result = scan.getID(barcodeData)

        if ("error" in result) {
          return { error: result.error || "Parsing error" }
        }

        const personInfo: PersonInformation = {
          idNumber: result.idNumber,
          name: "",
          surname: "",
          initials: "",
          gender: result.gender,
          birthDate: result.dateOfBirth,
          citizenshipStatus: result.status, // For green book IDs
        }

        return { person: personInfo }
      }

      return { error: "Invalid driver license or ID format" }
    } catch (error) {
      console.error("Error parsing driver license:", error)
      return { error: "Failed to parse driver license barcode" }
    }
  }

  /**
   * Validate expiry date and return status
   */
  static validateExpiry(expiryDateString: string): FieldValidation {
    try {
      if (!expiryDateString || expiryDateString === "N/A") {
        return {
          isValid: false,
          error: "Expiry date is required",
        }
      }

      // Parse DD/MM/YYYY format
      const parts = expiryDateString.split("/")
      if (parts.length !== 3) {
        return {
          isValid: false,
          error: "Invalid date format. Expected DD/MM/YYYY",
        }
      }

      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
      const year = parseInt(parts[2], 10)

      const expiryDate = new Date(year, month, day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate days until expiry
      const diffTime = expiryDate.getTime() - today.getTime()
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (daysUntilExpiry < 0) {
        return {
          isValid: false,
          error: `License/disk expired ${Math.abs(daysUntilExpiry)} days ago`,
          daysUntilExpiry,
        }
      }

      if (daysUntilExpiry <= 7) {
        return {
          isValid: true,
          warning: `Expires in ${daysUntilExpiry} day(s) - CRITICAL`,
          daysUntilExpiry,
        }
      }

      if (daysUntilExpiry <= 30) {
        return {
          isValid: true,
          warning: `Expires in ${daysUntilExpiry} day(s)`,
          daysUntilExpiry,
        }
      }

      return {
        isValid: true,
        daysUntilExpiry,
      }
    } catch (error) {
      console.error("Error validating expiry:", error)
      return {
        isValid: false,
        error: "Failed to validate expiry date",
      }
    }
  }

  /**
   * Get expiry info for UI display
   */
  static getExpiryInfo(expiryDateString: string): ExpiryInfo {
    const validation = this.validateExpiry(expiryDateString)

    if (!validation.isValid) {
      return {
        status: "expired",
        daysUntilExpiry: validation.daysUntilExpiry || -1,
        expiryDate: expiryDateString,
        message: validation.error || "Expired",
        color: "red",
      }
    }

    const days = validation.daysUntilExpiry || 0

    if (days <= 7) {
      return {
        status: "expiring-critical",
        daysUntilExpiry: days,
        expiryDate: expiryDateString,
        message: `Expires in ${days} day(s)`,
        color: "orange",
      }
    }

    if (days <= 30) {
      return {
        status: "expiring-soon",
        daysUntilExpiry: days,
        expiryDate: expiryDateString,
        message: `Expires in ${days} day(s)`,
        color: "yellow",
      }
    }

    return {
      status: "valid",
      daysUntilExpiry: days,
      expiryDate: expiryDateString,
      message: `Valid for ${days} day(s)`,
      color: "green",
    }
  }

  /**
   * Get required fields based on asset type
   */
  static getRequiredFields(assetType: "truck" | "trailer" | "driver"): string[] {
    switch (assetType) {
      case "truck":
        return ["registration", "qrCode", "make", "model", "expiryDate"]
      case "trailer":
        return ["registration", "qrCode", "make", "model", "expiryDate"]
      case "driver":
        return ["idNumber", "name", "surname", "qrCode", "licenceNumber"]
      default:
        return []
    }
  }

  /**
   * Detect asset type from parsed barcode data
   */
  static detectAssetType(
    vehicleInfo?: VehicleInformation,
    personInfo?: PersonInformation
  ): "truck" | "trailer" | "driver" | "unknown" {
    if (personInfo && personInfo.idNumber) {
      return "driver"
    }

    if (vehicleInfo && vehicleInfo.registration) {
      // Could be truck or trailer - default to truck
      // User will confirm in wizard
      return "truck"
    }

    return "unknown"
  }

  /**
   * Convert parsed data to Asset document structure
   */
  static toAssetDocument(
    parsedData: ParsedAssetData,
    companyId: string,
    additionalFields: {
      fleetNumber?: string
      groupId?: string
    }
  ): any {
    const baseData = {
      type: parsedData.type,
      qrCode: parsedData.qrCode,
      companyId,
      isActive: true,
      fleetNumber: additionalFields.fleetNumber || null,
      groupId: additionalFields.groupId || null,
    }

    if (parsedData.type === "driver" && parsedData.personInfo && parsedData.licenceInfo) {
      return {
        ...baseData,
        driverLicenseData: JSON.stringify({
          person: parsedData.personInfo,
          licence: parsedData.licenceInfo,
        }),
        licenseNumber: parsedData.licenceInfo.licenceNumber,
        licenseExpiryDate: parsedData.licenceInfo.expiryDate,
        // Additional expo-sadl driver fields
        driverNationality: parsedData.personInfo.nationality,
        driverCountryOfBirth: parsedData.personInfo.countryOfBirth,
        driverSecurityCode: parsedData.personInfo.securityCode,
        driverCitizenshipStatus: parsedData.personInfo.citizenshipStatus,
      }
    }

    if ((parsedData.type === "truck" || parsedData.type === "trailer") && parsedData.vehicleInfo) {
      return {
        ...baseData,
        vehicleDiskData: JSON.stringify(parsedData.vehicleInfo),
        registrationNumber: parsedData.vehicleInfo.registration,
        licenseExpiryDate: parsedData.vehicleInfo.expiryDate,
        // Additional expo-sadl vehicle field
        vehicleDescription: parsedData.vehicleInfo.description,
      }
    }

    return baseData
  }
}
