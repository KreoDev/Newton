import { db } from "./firebase"
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore"
import { Signal } from "@preact/signals-react"

export const createDocument = async (collectionName: string, data: Record<string, unknown>, successMessage?: string) => {
  try {
    const localStorageCompany = typeof window !== "undefined" ? localStorage.getItem("newton-layout-company") : null
    const inferredCompanyId = typeof data.companyId === "string" ? data.companyId : localStorageCompany

    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      ...(inferredCompanyId ? { companyId: inferredCompanyId } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dbCreatedAt: serverTimestamp(),
      dbUpdatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    throw error
  }
}

export const updateDocument = async (collectionName: string, id: string, data: Record<string, unknown>, successMessage?: string) => {
  try {
    const updateData = {
      ...data,
      updatedAt: Date.now(),
      dbUpdatedAt: serverTimestamp(),
    }

    await updateDoc(doc(db, collectionName, id), updateData)
  } catch (error) {
    throw error
  }
}

export const deleteDocument = async (collectionName: string, id: string, successMessage?: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id))
  } catch (error) {
    throw error
  }
}

export function createCollectionListener<T>(
  collectionName: string,
  signal: Signal<T[]>,
  options?: {
    companyScoped?: boolean
    filter?: (item: T) => boolean
    onFirstLoad?: () => void
  }
) {
  return (companyId?: string) => {
    const constraints: any[] = []
    let isFirstLoad = true

    if (options?.companyScoped && companyId) {
      constraints.push(where("companyId", "==", companyId))
    }

    const q = constraints.length > 0 ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName)

    return onSnapshot(
      q,
      snapshot => {
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]

        if (options?.filter) {
          data = data.filter(options.filter)
        }

        signal.value = data

        if (isFirstLoad && options?.onFirstLoad) {
          options.onFirstLoad()
          isFirstLoad = false
        }
      },
      error => {
        signal.value = []
        if (isFirstLoad && options?.onFirstLoad) {
          options.onFirstLoad()
          isFirstLoad = false
        }
      }
    )
  }
}

function createEntityOperations(collectionName: string, entityLabel: string, defaultData?: Record<string, unknown>) {
  return {
    create: (data: Record<string, unknown>) => createDocument(collectionName, { ...defaultData, ...data }, `${entityLabel} created successfully`),
    update: (id: string, data: Record<string, unknown>) => updateDocument(collectionName, id, data, `${entityLabel} updated successfully`),
    delete: (id: string) => deleteDocument(collectionName, id, `${entityLabel} deleted successfully`),
  }
}

export const userOperations = createEntityOperations("users", "User")
