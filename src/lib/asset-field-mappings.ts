/**
 * Asset Field Mappings and Barcode Parsing
 * Integrates with South African driver's license and vehicle disk standards
 */

import type {
  VehicleInformation,
  PersonInformation,
  LicenceInformation,
  ParsedAssetData,
  FieldValidation,
  ExpiryInfo,
  ExpiryStatus,
} from "@/types/asset-types"

// Dynamic import helper to avoid SSR issues with scan service
async function getScanService() {
  const { scan } = await import("@/services/scan.service")
  return scan
}

export class AssetFieldMapper {
  /**
   * Parse vehicle disk barcode data
   * Returns extracted vehicle information
   */
  static async parseVehicleDisk(barcodeData: string): Promise<VehicleInformation | { error: string }> {
    try {
      const scan = await getScanService()
      const result = scan.getVehicleLicence(barcodeData)

      if ("error" in result) {
        return { error: result.error ?? "Unknown error" }
      }

      return {
        registration: result.vehicleReg || result.identifier || "",
        make: result.make,
        model: result.model,
        colour: result.colour,
        licenceNo: result.licenceNo,
        vehicleDiskNo: result.licenceDiskNo,
        expiryDate: result.dateOfExpiry,
        engineNo: result.engineNo,
        vin: result.vin,
        description: result.description, // Vehicle type description
      }
    } catch (error) {
      return { error: "Failed to parse vehicle disk barcode" }
    }
  }

  /**
   * Parse SADL decrypted driver's license data
   * Handles data from expo-sadl decrypt result
   */
  static parseSADLDriverLicense(sadlData: any): { person: PersonInformation; licence: LicenceInformation } | { error: string } {
    try {
      if (!sadlData.success || !sadlData.idNumber) {
        return { error: sadlData.error || "Invalid SADL data" }
      }

      // Check if expired
      if (sadlData.expired) {
        return { error: "Driver's license has expired" }
      }

      const personInfo: PersonInformation = {
        idNumber: sadlData.idNumber,
        name: sadlData.name || "",
        surname: sadlData.surname || "",
        initials: sadlData.initials || "",
        gender: sadlData.gender,
        birthDate: sadlData.birthDate, // Already formatted DD/MM/YYYY by expo-sadl
        nationality: sadlData.sadcCountry,
        countryOfBirth: sadlData.sadcCountry,
        citizenshipStatus: sadlData.idType,
      }

      const licenceInfo: LicenceInformation = {
        licenceNumber: sadlData.licenceNumber || sadlData.idNumber,
        issueDate: sadlData.issueDate, // Already formatted DD/MM/YYYY
        expiryDate: sadlData.expiryDate, // Already formatted DD/MM/YYYY
        driverRestrictions: sadlData.vehicleCodes || sadlData.restrictions || "",
        licenceType: sadlData.licenceType || "SADL",
        ntCode: "",
      }

      return {
        person: personInfo,
        licence: licenceInfo,
      }
    } catch (error) {
      return { error: "Failed to parse SADL driver license data" }
    }
  }

  /**
   * Parse driver license or ID barcode data
   * Returns extracted person and license information
   */
  static async parseDriverLicense(barcodeData: string): Promise<{ person: PersonInformation; licence?: LicenceInformation } | { error: string }> {
    try {
      const scan = await getScanService()

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
    // Helper function to remove undefined values
    const removeUndefined = (obj: any): any => {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
      )
    }

    const baseData = {
      type: parsedData.type,
      ntCode: parsedData.ntCode, // Android app field
      companyId,
      isActive: true,
      fleetNumber: additionalFields.fleetNumber || null,
      groupId: additionalFields.groupId || null,
    }

    if (parsedData.type === "driver" && parsedData.personInfo && parsedData.licenceInfo) {
      return removeUndefined({
        ...baseData,
        // All driver-specific fields from barcode scan (matching Android app structure)
        idNumber: parsedData.personInfo.idNumber, // Android app field
        name: parsedData.personInfo.name, // Android app field
        surname: parsedData.personInfo.surname, // Android app field
        initials: parsedData.personInfo.initials,
        gender: parsedData.personInfo.gender,
        birthDate: parsedData.personInfo.birthDate, // Android app field
        licenceNumber: parsedData.licenceInfo.licenceNumber, // Android app field (British spelling)
        licenceType: parsedData.licenceInfo.licenceType, // Android app field
        issueDate: parsedData.licenceInfo.issueDate, // Android app field
        expiryDate: parsedData.licenceInfo.expiryDate, // Android app field
        vehicleCodes: parsedData.licenceInfo.driverRestrictions, // Vehicle codes driver is authorized for
        // Additional expo-sadl driver fields
        driverNationality: parsedData.personInfo.nationality,
        driverCountryOfBirth: parsedData.personInfo.countryOfBirth,
        driverSecurityCode: parsedData.personInfo.securityCode,
        driverCitizenshipStatus: parsedData.personInfo.citizenshipStatus,
      })
    }

    if ((parsedData.type === "truck" || parsedData.type === "trailer") && parsedData.vehicleInfo) {
      const vehicleDocument = {
        ...baseData,
        // All vehicle-specific fields from barcode scan (matching Android app structure)
        registration: parsedData.vehicleInfo.registration, // Android app field
        make: parsedData.vehicleInfo.make, // Android app field
        model: parsedData.vehicleInfo.model, // Android app field
        vin: parsedData.vehicleInfo.vin, // Android app field
        colour: parsedData.vehicleInfo.colour, // Android app field
        engineNo: parsedData.type === "truck" ? parsedData.vehicleInfo.engineNo : undefined, // Trucks only - trailers don't have engines
        licenceNo: parsedData.vehicleInfo.licenceNo, // Android app field
        licenceDiskNo: parsedData.vehicleInfo.vehicleDiskNo,
        dateOfExpiry: parsedData.vehicleInfo.expiryDate, // Android app field
        description: parsedData.vehicleInfo.description, // Android app field
      }

      return removeUndefined(vehicleDocument)
    }

    return baseData
  }
}
