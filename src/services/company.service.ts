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
   * Delete a company
   */
  static async delete(id: string): Promise<void> {
    try {
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
