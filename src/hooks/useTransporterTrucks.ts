import { useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Custom hook to fetch and cache truck counts for transporter companies
 * Used in both OrderCreationWizard and LC allocation page
 */
export function useTransporterTrucks() {
  const [transporterTrucks, setTransporterTrucks] = useState<Record<string, number>>({})
  const [loadingTrucksFor, setLoadingTrucksFor] = useState<string | null>(null)

  /**
   * Fetch trucks for a specific transporter from Firestore
   * Results are cached to avoid redundant queries
   */
  const fetchTrucksForTransporter = async (transporterId: string): Promise<number> => {
    // If already fetched, return cached value
    if (transporterId in transporterTrucks) {
      return transporterTrucks[transporterId]
    }

    setLoadingTrucksFor(transporterId)
    try {
      const assetsRef = collection(db, "assets")
      const q = query(
        assetsRef,
        where("companyId", "==", transporterId),
        where("type", "==", "truck"),
        where("isActive", "==", true)
      )

      const snapshot = await getDocs(q)
      const truckCount = snapshot.size

      setTransporterTrucks(prev => ({
        ...prev,
        [transporterId]: truckCount,
      }))

      return truckCount
    } finally {
      setLoadingTrucksFor(null)
    }
  }

  /**
   * Get available trucks for a transporter (from cache)
   */
  const getAvailableTrucks = (transporterId: string): number => {
    return transporterTrucks[transporterId] ?? 0
  }

  /**
   * Check if trucks are currently being fetched for a transporter
   */
  const isLoadingTrucks = (transporterId: string): boolean => {
    return loadingTrucksFor === transporterId
  }

  /**
   * Check if any trucks are currently being loaded
   */
  const isAnyLoading = (): boolean => {
    return loadingTrucksFor !== null
  }

  return {
    fetchTrucksForTransporter,
    getAvailableTrucks,
    isLoadingTrucks,
    isAnyLoading,
    transporterTrucks,
    loadingTrucksFor,
  }
}
