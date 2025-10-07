import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"
import type { Company, User, Timestamped } from "@/types"

export class CompanyService {
  /**
   * Get a single company by ID
   */
  static async getById(id: string): Promise<Company | null> {
    try {
      const docRef = doc(db, "companies", id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) return null

      return { id: docSnap.id, ...(docSnap.data() as Partial<Company>) } as Company
    } catch (error) {
      console.error("Error fetching company:", error)
      throw error
    }
  }

  /**
   * List all companies accessible to the user
   * - Global users: see all companies
   * - Regular users: see only their company
   */
  static async listAccessibleCompanies(user: User): Promise<Company[]> {
    try {
      let q

      if (user.isGlobal) {
        // Global users see all companies
        q = query(collection(db, "companies"), orderBy("name", "asc"))
      } else {
        // Regular users see only their company
        q = query(collection(db, "companies"), where("id", "==", user.companyId))
      }

      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...(doc.data() as Partial<Company>),
        } as Company
      })
    } catch (error) {
      console.error("Error fetching companies:", error)
      throw error
    }
  }

  /**
   * Create a new company
   */
  static async create(data: Omit<Company, "id" | keyof Timestamped>): Promise<string> {
    try {
      // sourcery skip: inline-immediately-returned-variable
      const id = await createDocument("companies", data, "Company created successfully")
      return id
    } catch (error) {
      console.error("Error creating company:", error)
      throw error
    }
  }

  /**
   * Update an existing company
   */
  static async update(id: string, data: Partial<Company>): Promise<void> {
    try {
      await updateDocument("companies", id, data, "Company updated successfully")
    } catch (error) {
      console.error("Error updating company:", error)
      throw error
    }
  }

  /**
   * Check if a company is in use (has users, sites, orders, etc.)
   * Returns object with usage details
   */
  static async checkCompanyInUse(id: string): Promise<{
    inUse: boolean
    userCount: number
    siteCount: number
    orderCount: number
    details: string[]
  }> {
    try {
      const details: string[] = []

      // Check for users
      const usersQuery = query(collection(db, "users"), where("companyId", "==", id))
      const usersSnapshot = await getDocs(usersQuery)
      const userCount = usersSnapshot.size

      if (userCount > 0) {
        details.push(`${userCount} user${userCount > 1 ? "s" : ""}`)
      }

      // Check for sites
      const sitesQuery = query(collection(db, "sites"), where("companyId", "==", id))
      const sitesSnapshot = await getDocs(sitesQuery)
      const siteCount = sitesSnapshot.size

      if (siteCount > 0) {
        details.push(`${siteCount} site${siteCount > 1 ? "s" : ""}`)
      }

      // Check for orders
      const ordersQuery = query(collection(db, "orders"), where("companyId", "==", id))
      const ordersSnapshot = await getDocs(ordersQuery)
      const orderCount = ordersSnapshot.size

      if (orderCount > 0) {
        details.push(`${orderCount} order${orderCount > 1 ? "s" : ""}`)
      }

      // Check for assets
      const assetsQuery = query(collection(db, "assets"), where("companyId", "==", id))
      const assetsSnapshot = await getDocs(assetsQuery)
      const assetCount = assetsSnapshot.size

      if (assetCount > 0) {
        details.push(`${assetCount} asset${assetCount > 1 ? "s" : ""}`)
      }

      const inUse = details.length > 0

      return {
        inUse,
        userCount,
        siteCount,
        orderCount,
        details,
      }
    } catch (error) {
      console.error("Error checking company usage:", error)
      throw error
    }
  }

  /**
   * Delete a company (only if not in use)
   * @param id - Company ID to delete
   * @param currentUserCompanyId - Optional: Current user's company ID to prevent self-deletion
   */
  static async delete(id: string, currentUserCompanyId?: string): Promise<void> {
    try {
      // Prevent deletion of the user's current company
      if (currentUserCompanyId && id === currentUserCompanyId) {
        throw new Error("Cannot delete the company you are currently using")
      }

      // Check if company is in use
      const usage = await this.checkCompanyInUse(id)

      if (usage.inUse) {
        throw new Error(`Cannot delete company - it has ${usage.details.join(", ")}`)
      }

      await deleteDocument("companies", id, "Company deleted successfully")
    } catch (error) {
      console.error("Error deleting company:", error)
      throw error
    }
  }

  /**
   * Get all users for a specific company (helper for contact selectors)
   */
  static async getCompanyUsers(companyId: string): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("companyId", "==", companyId), where("isActive", "==", true), orderBy("firstName", "asc"))

      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...(doc.data() as Partial<User>),
        } as User
      })
    } catch (error) {
      console.error("Error fetching company users:", error)
      throw error
    }
  }
}
