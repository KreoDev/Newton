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
        return { isValid: true }
      }

      return {
        isValid: false,
        error: "This QR code is already assigned to another asset",
        existingAsset,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate vehicle registration is unique within the company (checks in-memory assets from data service)
   */
  static validateRegistration(registration: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      if (!registration || !registration.trim()) {
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.registration === registration.trim() && a.id !== excludeId)

      if (!existingAsset) {
        return { isValid: true }
      }

      return {
        isValid: false,
        error: "This registration number is already assigned to another vehicle",
        existingAsset,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate vehicle VIN is unique (synchronous, uses in-memory assets)
   */
  static validateVIN(vin: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      if (!vin || !vin.trim()) {
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.vin === vin.trim() && a.id !== excludeId)

      if (!existingAsset) {
        return { isValid: true }
      }

      return {
        isValid: false,
        error: "This VIN is already assigned to another vehicle",
        existingAsset,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate driver ID number is unique within the company (checks in-memory assets from data service)
   */
  static validateIDNumber(idNumber: string, excludeId?: string): { isValid: boolean; error?: string; existingAsset?: Asset } {
    try {
      if (!idNumber || !idNumber.trim()) {
        return { isValid: true }
      }

      // Check uniqueness in the already-loaded company-scoped assets
      const assets = globalData.assets.value
      const existingAsset = assets.find(a => a.idNumber === idNumber.trim() && a.id !== excludeId)

      if (!existingAsset) {
        return { isValid: true }
      }

      return {
        isValid: false,
        error: "This ID number is already assigned to another driver",
        existingAsset,
      }
    } catch (error) {
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
      throw error
    }
  }

  /**
   * Get assets by type
   */
  static async getByType(companyId: string, assetType: "truck" | "trailer" | "driver"): Promise<Asset[]> {
    try {
      const q = query(collection(db, "assets"), where("companyId", "==", companyId), where("type", "==", assetType))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Asset[]
    } catch (error) {
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
  }
}
