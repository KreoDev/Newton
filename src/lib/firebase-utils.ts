import { db } from "./firebase"
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"

// Generic CRUD operations with toast notifications
export const createDocument = async (collectionName: string, data: Record<string, unknown>, successMessage?: string) => {
  try {
    const localStorageCompany = typeof window !== "undefined" ? localStorage.getItem("companyDB") : null
    const companyDB = typeof data.companyDB === "string" ? data.companyDB : localStorageCompany ?? "dev"

    const docRef = await addDoc(collection(db, collectionName), {
      companyDB,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdDate: Date.now(),
      modifiedDate: Date.now(),
    })

    toast.success(successMessage || `${collectionName.slice(0, -1)} created successfully`, {
      description: `ID: ${docRef.id}`,
    })

    return docRef.id
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error)
    toast.error(`Failed to create ${collectionName.slice(0, -1)}`, {
      description: error instanceof Error ? error.message : "Unknown error occurred",
    })
    throw error
  }
}

export const updateDocument = async (collectionName: string, id: string, data: Record<string, unknown>, successMessage?: string) => {
  try {
    await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
      modifiedDate: Date.now(),
    })

    toast.success(successMessage || `${collectionName.slice(0, -1)} updated successfully`, {
      description: `Changes have been saved`,
    })
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error)
    toast.error(`Failed to update ${collectionName.slice(0, -1)}`, {
      description: error instanceof Error ? error.message : "Unknown error occurred",
    })
    throw error
  }
}

export const deleteDocument = async (collectionName: string, id: string, successMessage?: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id))

    toast.success(successMessage || `${collectionName.slice(0, -1)} deleted successfully`, {
      description: `Item has been permanently removed`,
    })
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error)
    toast.error(`Failed to delete ${collectionName.slice(0, -1)}`, {
      description: error instanceof Error ? error.message : "Unknown error occurred",
    })
    throw error
  }
}

// Specific entity operations
export const userOperations = {
  delete: (id: string) => deleteDocument("users", id, "User deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("users", id, data, "User updated successfully"),
}

// Convenience function for profile updates
export const updateUserProfile = (id: string, data: Record<string, unknown>) => updateDocument("users", id, data, "Profile updated successfully")

export const assetOperations = {
  create: (data: Record<string, unknown>) => createDocument("assets", data, "Asset created successfully"),
  delete: (id: string) => deleteDocument("assets", id, "Asset deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("assets", id, data, "Asset updated successfully"),
}

export const transporterOperations = {
  delete: (id: string) => deleteDocument("transporters", id, "Transporter deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("transporters", id, data, "Transporter updated successfully"),
  create: (data: Record<string, unknown>) => createDocument("transporters", data, "Transporter created successfully"),
}

export const documentTypeOperations = {
  delete: (id: string) => deleteDocument("document_types", id, "Document type deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("document_types", id, data, "Document type updated successfully"),
  create: (data: Record<string, unknown>) => createDocument("document_types", data, "Document type created successfully"),
}

export const assetTypeOperations = {
  delete: (id: string) => deleteDocument("asset_types", id, "Asset type deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("asset_types", id, data, "Asset type updated successfully"),
  create: (data: Record<string, unknown>) => createDocument("asset_types", { ...data, status: "active" }, "Asset type created successfully"),
}

export const roleOperations = {
  delete: (id: string) => deleteDocument("roles", id, "Role deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("roles", id, data, "Role updated successfully"),
  create: (data: Record<string, unknown>) => createDocument("roles", data, "Role created successfully"),
}

export const documentOperations = {
  delete: (id: string) => deleteDocument("documents", id, "Document deleted successfully"),
  update: (id: string, data: Record<string, unknown>) => updateDocument("documents", id, data, "Document updated successfully"),
}
