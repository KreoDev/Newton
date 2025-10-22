import { collection, doc, getDoc, getDocs, query, where, orderBy, limit as firestoreLimit, type Query, type DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"

/**
 * Base service class for generic CRUD operations
 * Provides reusable methods for common database operations
 */
export abstract class BaseService<T extends { id: string }> {
  constructor(protected collectionName: string) {}

  /**
   * Get a document by ID
   */
  static async getById<T extends { id: string }>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return { id: docSnap.id, ...docSnap.data() } as T
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all documents in a collection
   */
  static async getAll<T extends { id: string }>(collectionName: string): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName)
      const snapshot = await getDocs(collectionRef)

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get documents by company ID
   */
  static async getByCompany<T extends { id: string; companyId: string }>(collectionName: string, companyId: string): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where("companyId", "==", companyId))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get active documents (isActive = true)
   */
  static async getActive<T extends { id: string; isActive: boolean }>(collectionName: string): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where("isActive", "==", true))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get active documents by company
   */
  static async getActiveByCompany<T extends { id: string; isActive: boolean; companyId: string }>(
    collectionName: string,
    companyId: string
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), where("companyId", "==", companyId), where("isActive", "==", true))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }

  /**
   * Create a new document
   */
  static async create<T>(collectionName: string, data: Partial<T>, successMessage?: string): Promise<string> {
    try {
      return await createDocument(collectionName, data, successMessage)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update a document
   */
  static async update<T>(collectionName: string, id: string, data: Partial<T>, successMessage?: string): Promise<void> {
    try {
      await updateDocument(collectionName, id, data, successMessage)
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete a document
   */
  static async delete(collectionName: string, id: string, successMessage?: string): Promise<void> {
    try {
      await deleteDocument(collectionName, id, successMessage)
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if a document exists
   */
  static async exists(collectionName: string, id: string): Promise<boolean> {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)
      return docSnap.exists()
    } catch (error) {
      throw error
    }
  }

  /**
   * Count documents matching a query
   */
  static async count(collectionName: string, q?: Query<DocumentData>): Promise<number> {
    try {
      const queryRef = q || collection(db, collectionName)
      const snapshot = await getDocs(queryRef)
      return snapshot.size
    } catch (error) {
      throw error
    }
  }

  /**
   * Get documents with custom query
   */
  static async getWithQuery<T extends { id: string }>(q: Query<DocumentData>): Promise<T[]> {
    try {
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get paginated documents
   */
  static async getPaginated<T extends { id: string }>(
    collectionName: string,
    pageSize: number,
    orderByField: string = "createdAt",
    orderDirection: "asc" | "desc" = "desc"
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), orderBy(orderByField, orderDirection), firestoreLimit(pageSize))
      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    } catch (error) {
      throw error
    }
  }
}
