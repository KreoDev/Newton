/**
 * Asset Service
 * Business logic for asset management
 */

import type { Asset } from "@/types"
import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import type { ParsedAssetData } from "@/types/asset-types"
import { data as globalData } from "@/services/data.service"

const testDriver =
  "019B094500003D04B647B0F15FC4861E1CEA68F8EFD04137F5CF55623BB7F14A3757E887075E8EBBF0A649B64504F151962E8F2F5A3BE2356284DC6C48D1740DE577B6654DF26AD708A8158E0F4CA5CE2E7F5FEF384ED84DF6B58D3D8F52C0D658D14CD87974AD1623D2958A45E3F846A71924B0232D30A604BFB02FDF8F6D965E00D0C3C113B3A4B1C38584B6B8FC54BE559FB80B294AD35B13A02BEB39C51896E0FB5FD07318AF1855F3AC478E81EABE5B191077760113E8BCB1680E4965AE70C8BAE5A8A9AC90F70250F6472FB1BBBE0ED629F959B38E8356207851CDA52A774A42A0A049C900B851A26CC14FFAF6519508CAE78EC2BF6A30DD739009A6B4FD65EE3761C41CD235172AB1803E402F8F755A54D6E622AE0328F10E1CF671617375E8FB186F907AB0E07FF1A3D16857437E5F1752FECA11BDE5F4BA3F15218E688BAA08EBF0E0148B005430045D9AE9B3E4B22138D538B9856BA1EF0CB1C89EBD59D3588CD14FF10B5788D91669D07731ED9048F7A8F74262B3C2548C2E8A54816B93D4E8498067BC4861A29A0BE86F3F9E5A35B1D176979E47EFE1D67125DDC517ECB27C1AC292581C3BAC8CF57829F6AEF2E52BAFD3D76D56D8E6C497592E6B29AE286A816C457E174C34B7D3CEBAF8D46F4797837A8942889B77CFE76C56AA1BF5D47F3B3FCE7D20CB9ADEB97CCEC05E5DA1DB3F1A8C01AF59F7847D022926ED8B78E5256ADF2E366A7CF639221A2ABF3903B43E416329253003BE88BC9E9D69DDF755CCF979932550AEB37567F534AB8681DDFABDE7FA4FE780446A0F5D085342752D442151FF606ADF822B6076D3F90B1549D4E2A81AE8071819E3EBC42C0CE11D1D9D374B310592B6C445A6D3C09706295A8474BA9EC8CFB91FEC32D86440E26BD008B0C9CC4B8988453093CD1629FEDE4E42743DE7FA4AA4FA69D84CAF57FB7DCB215578EDD24673840A7F348722F3595F7D9A694FBD233F95DDDF3181A8FCAF5FA7E64438DDB26DF479D79E"

export class AssetService {
  /**
   * Create a new asset
   */
  static async create(
    parsedData: ParsedAssetData,
    companyId: string,
    additionalFields: {
      fleetNumber?: string
      groupId?: string
    }
  ): Promise<string> {
    const assetData = AssetFieldMapper.toAssetDocument(parsedData, companyId, additionalFields)
    return await createDocument("assets", assetData, "Asset created successfully")
  }

  /**
   * Update an existing asset
   */
  static async update(id: string, data: Partial<Asset>): Promise<void> {
    await updateDocument("assets", id, data, "Asset updated successfully")
  }

  /**
   * Validate Newton QR code (ntCode)
   * - Must start with "NT"
   * - Must be unique within the company (checks in-memory assets from data service)
   */
  static validateNTCode(ntCode: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      console.log("AssetService: Validating NT code:", ntCode, "using in-memory assets")

      // Validate NT prefix
      if (!ntCode.toUpperCase().startsWith("NT")) {
        return {
          isValid: false,
          error: "Please scan a Newton QR Code (must start with NT)",
        }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.ntCode === ntCode && a.id !== excludeId)

      if (!existingAsset) {
        console.log("AssetService: NT code is unique in this company")
        return { isValid: true }
      }

      console.log("AssetService: Existing asset found:", {
        id: existingAsset.id,
        ntCode: existingAsset.ntCode,
        companyId: existingAsset.companyId,
      })

      return {
        isValid: false,
        error: "This QR code is already assigned to another asset",
        existingAsset,
      }
    } catch (error) {
      console.error("Error validating NT code:", error)
      throw error
    }
  }

  /**
   * Validate vehicle registration is unique within the company (checks in-memory assets from data service)
   */
  static validateRegistration(registration: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      console.log("AssetService: Validating registration using in-memory assets:", registration.trim())

      if (!registration || !registration.trim()) {
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.registration === registration.trim() && a.id !== excludeId)

      if (!existingAsset) {
        console.log("AssetService: Registration is unique in this company")
        return { isValid: true }
      }

      console.log("AssetService: Found existing asset:", {
        id: existingAsset.id,
        registration: existingAsset.registration,
        type: existingAsset.type,
        companyId: existingAsset.companyId,
      })

      return {
        isValid: false,
        error: "This registration number is already assigned to another vehicle",
        existingAsset,
      }
    } catch (error) {
      console.error("Error validating registration:", error)
      throw error
    }
  }

  /**
   * Validate vehicle VIN is unique (synchronous, uses in-memory assets)
   */
  static validateVIN(vin: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      console.log("AssetService: Validating VIN using in-memory assets:", vin.trim())

      if (!vin || !vin.trim()) {
        console.log("AssetService: VIN is empty, skipping validation")
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.vin === vin.trim() && a.id !== excludeId)

      if (!existingAsset) {
        console.log("AssetService: VIN is unique in this company")
        return { isValid: true }
      }

      console.log("AssetService: Existing asset found:", {
        id: existingAsset.id,
        vin: existingAsset.vin,
        companyId: existingAsset.companyId,
      })

      return {
        isValid: false,
        error: "This VIN is already assigned to another vehicle",
        existingAsset,
      }
    } catch (error) {
      console.error("Error validating VIN:", error)
      throw error
    }
  }

  /**
   * Validate driver ID number is unique within the company (checks in-memory assets from data service)
   */
  static validateIDNumber(idNumber: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      console.log("AssetService: Validating ID number using in-memory assets:", idNumber.trim())

      if (!idNumber || !idNumber.trim()) {
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.idNumber === idNumber.trim() && a.id !== excludeId)

      if (!existingAsset) {
        console.log("AssetService: ID number is unique in this company")
        return { isValid: true }
      }

      console.log("AssetService: Existing asset found:", {
        id: existingAsset.id,
        idNumber: existingAsset.idNumber,
        companyId: existingAsset.companyId,
      })

      return {
        isValid: false,
        error: "This ID number is already assigned to another driver",
        existingAsset,
      }
    } catch (error) {
      console.error("Error validating ID number:", error)
      throw error
    }
  }

  /**
   * Check expiry date
   */
  static checkExpiry(expiryDate: string): {
    isExpired: boolean
    isExpiringSoon: boolean
    daysUntilExpiry: number
    shouldBlock: boolean
  } {
    const expiryInfo = AssetFieldMapper.getExpiryInfo(expiryDate)

    return {
      isExpired: expiryInfo.status === "expired",
      isExpiringSoon: expiryInfo.status === "expiring-soon" || expiryInfo.status === "expiring-critical",
      daysUntilExpiry: expiryInfo.daysUntilExpiry,
      shouldBlock: expiryInfo.status === "expired",
    }
  }

  /**
   * Get asset by ID
   */
  static async getById(id: string): Promise<Asset | null> {
    try {
      const docRef = doc(db, "assets", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return {
        ...docSnap.data(),
        id: docSnap.id,
      } as Asset
    } catch (error) {
      console.error("Error fetching asset:", error)
      throw error
    }
  }

  /**
   * Get all assets for a company
   */
  static async getByCompany(companyId: string): Promise<Asset[]> {
    try {
      const q = query(collection(db, "assets"), where("companyId", "==", companyId))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Asset[]
    } catch (error) {
      console.error("Error fetching assets:", error)
      throw error
    }
  }

  /**
   * Get assets by type
   */
  static async getByType(companyId: string, assetType: "truck" | "trailer" | "driver"): Promise<Asset[]> {
    try {
      const q = query(collection(db, "assets"), where("companyId", "==", companyId), where("assetType", "==", assetType))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Asset[]
    } catch (error) {
      console.error("Error fetching assets by type:", error)
      throw error
    }
  }

  /**
   * Get expiring assets
   */
  static async getExpiringAssets(companyId: string, daysThreshold: number = 30): Promise<Asset[]> {
    try {
      // Get all assets for company
      const assets = await this.getByCompany(companyId)

      // Filter by expiry date
      const now = new Date()
      const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000)

      return assets.filter(asset => {
        if (!asset.expiryDate) return false

        // Parse DD/MM/YYYY format
        const parts = asset.expiryDate.split("/")
        if (parts.length !== 3) return false

        const expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))

        return expiryDate >= now && expiryDate <= thresholdDate
      })
    } catch (error) {
      console.error("Error fetching expiring assets:", error)
      throw error
    }
  }

  /**
   * Get expired assets
   */
  static async getExpiredAssets(companyId: string): Promise<Asset[]> {
    try {
      const assets = await this.getByCompany(companyId)

      const now = new Date()

      return assets.filter(asset => {
        if (!asset.expiryDate) return false

        // Parse DD/MM/YYYY format
        const parts = asset.expiryDate.split("/")
        if (parts.length !== 3) return false

        const expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))

        return expiryDate < now
      })
    } catch (error) {
      console.error("Error fetching expired assets:", error)
      throw error
    }
  }

  /**
   * Check if asset has transactions
   * Returns count of related transactions
   */
  static async checkHasTransactions(assetId: string): Promise<{ hasTransactions: boolean; count: number }> {
    try {
      // Check weighing_records
      const weighingQ = query(collection(db, "weighing_records"), where("assetId", "==", assetId))
      const weighingSnapshot = await getDocs(weighingQ)

      // Check security_checks for any asset field
      const securityQueries = [query(collection(db, "security_checks"), where("assetId", "==", assetId)), query(collection(db, "security_checks"), where("driverId", "==", assetId)), query(collection(db, "security_checks"), where("trailer1Id", "==", assetId)), query(collection(db, "security_checks"), where("trailer2Id", "==", assetId))]

      const securitySnapshots = await Promise.all(securityQueries.map(q => getDocs(q)))

      const totalCount = weighingSnapshot.size + securitySnapshots.reduce((sum, snap) => sum + snap.size, 0)

      return {
        hasTransactions: totalCount > 0,
        count: totalCount,
      }
    } catch (error) {
      console.error("Error checking asset transactions:", error)
      throw error
    }
  }

  /**
   * Hard delete an asset (only if no transactions)
   */
  static async delete(id: string, reason: string): Promise<void> {
    // Check for transactions first
    const { hasTransactions, count } = await this.checkHasTransactions(id)

    if (hasTransactions) {
      throw new Error(`Cannot delete asset - it has ${count} transaction(s)`)
    }

    // Store reason in the document before deleting for audit purposes
    await updateDocument("assets", id, { deletedReason: reason }, "")

    // Hard delete
    await deleteDocument("assets", id, "Asset deleted successfully")
  }

  /**
   * Soft delete (inactivate) an asset
   */
  static async inactivate(id: string, reason: string): Promise<void> {
    await updateDocument(
      "assets",
      id,
      {
        isActive: false,
        inactiveReason: reason,
        inactiveDate: new Date().toISOString(),
      },
      "Asset marked as inactive"
    )
  }

  /**
   * Reactivate an asset
   */
  static async reactivate(id: string): Promise<void> {
    await updateDocument(
      "assets",
      id,
      {
        isActive: true,
        inactiveReason: null,
        inactiveDate: null,
      },
      "Asset reactivated"
    )
  }

  /**
   * Send expiry notifications (placeholder for future implementation)
   */
  static async sendExpiryNotifications(asset: Asset, daysUntilExpiry: number): Promise<void> {
    // TODO: Implement notification system integration
    console.log(`Would send expiry notification for asset ${asset.id}, expiring in ${daysUntilExpiry} days`)
  }
}
