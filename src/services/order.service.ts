import { createDocument, updateDocument, deleteDocument } from "@/lib/firebase-utils"
import type { Order, Allocation, Site } from "@/types"
import { data as globalData } from "@/services/data.service"
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, Timestamp, DocumentData, Query } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * OrderService - Business logic for order management
 *
 * CRITICAL:
 * - Orders can ONLY be created in mine companies
 * - Use globalData for validation (NO duplicate Firebase queries)
 * - Use firebase-utils for all CRUD operations
 */
export class OrderService {
  /**
   * Create new order
   * @param orderData Order data
   * @param toastMessage Success message
   * @returns Created order ID
   */
  static async create(orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "dbCreatedAt" | "dbUpdatedAt">, toastMessage = "Order created successfully"): Promise<string> {
    // Set order status based on allocations
    const status = orderData.allocations && orderData.allocations.length > 0 ? "allocated" : "pending"

    const data = {
      ...orderData,
      status,
      completedWeight: 0,
      completedTrips: 0,
    }

    return await createDocument("orders", data, toastMessage)
  }

  /**
   * Update existing order
   * @param id Order ID
   * @param updates Order updates
   * @param toastMessage Success message
   */
  static async update(id: string, updates: Partial<Order>, toastMessage = "Order updated successfully"): Promise<void> {
    await updateDocument("orders", id, updates, toastMessage)
  }

  /**
   * Delete order (with validation)
   * @param id Order ID
   * @param toastMessage Success message
   */
  static async delete(id: string, toastMessage = "Order deleted successfully"): Promise<void> {
    // Check if order has any weighing records or pre-bookings
    const hasTransactions = await this.checkOrderInUse(id)

    if (hasTransactions) {
      throw new Error("Cannot delete order with existing transactions (weighing records or pre-bookings)")
    }

    await deleteDocument("orders", id, toastMessage)
  }

  /**
   * Get order by ID
   * @param id Order ID
   * @returns Order or undefined
   */
  static getById(id: string): Order | undefined {
    return globalData.orders.value.find(o => o.id === id)
  }

  /**
   * Get all orders for a company
   * @param companyId Company ID
   * @returns Array of orders
   */
  static getByCompany(companyId: string): Order[] {
    return globalData.orders.value.filter(o => o.companyId === companyId)
  }

  /**
   * Get orders by status
   * @param companyId Company ID
   * @param status Order status
   * @returns Filtered orders
   */
  static getByStatus(companyId: string, status: Order["status"]): Order[] {
    return globalData.orders.value.filter(o => o.companyId === companyId && o.status === status)
  }

  /**
   * Get orders allocated to a specific transporter company
   * @param transporterCompanyId Transporter company ID
   * @returns Orders with allocations to this transporter
   */
  static getMyAllocatedOrders(transporterCompanyId: string): Order[] {
    return globalData.orders.value.filter(o =>
      o.allocations.some(a => a.companyId === transporterCompanyId)
    )
  }

  /**
   * Get orders expiring soon
   * @param companyId Company ID
   * @param daysThreshold Days until expiry (default 7)
   * @returns Orders expiring within threshold
   */
  static getExpiringOrders(companyId: string, daysThreshold = 7): Order[] {
    const now = Date.now()
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000

    return globalData.orders.value.filter(o => {
      if (o.companyId !== companyId) return false
      if (o.status === "completed" || o.status === "cancelled") return false

      const endDate = new Date(o.dispatchEndDate).getTime()
      const timeUntilExpiry = endDate - now

      return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs
    })
  }

  /**
   * Generate auto order number
   * @param prefix Order number prefix
   * @returns Generated order number (e.g., "DEV-2024-0001")
   */
  static async generateOrderNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefixPattern = `${prefix}${year}-`

    // Query last order number for this year
    const ordersRef = collection(db, "orders")
    const q = query(
      ordersRef,
      where("orderNumber", ">=", prefixPattern),
      where("orderNumber", "<", `${prefix}${year + 1}-`),
      orderBy("orderNumber", "desc"),
      limit(1)
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // First order of the year
      return `${prefixPattern}0001`
    }

    // Extract sequence number and increment
    const lastOrderNumber = snapshot.docs[0].data().orderNumber as string
    const lastSequence = parseInt(lastOrderNumber.split("-").pop() || "0")
    const nextSequence = lastSequence + 1

    return `${prefixPattern}${nextSequence.toString().padStart(4, "0")}`
  }

  /**
   * Validate order number uniqueness (in-memory check)
   * @param orderNumber Order number to validate
   * @param excludeId Order ID to exclude (for edits)
   * @returns Validation result
   */
  static validateOrderNumber(orderNumber: string, excludeId?: string): { isValid: boolean; error?: string } {
    const exists = globalData.orders.value.some(o =>
      o.orderNumber === orderNumber && o.id !== excludeId
    )

    if (exists) {
      return { isValid: false, error: "Order number already exists" }
    }

    return { isValid: true }
  }

  /**
   * Validate order number uniqueness (Firebase check - checks ALL orders, not just recent)
   * Use this for manual entry validation to ensure no duplicates exist in the entire database
   * @param orderNumber Order number to validate
   * @param companyId Company ID
   * @param excludeId Order ID to exclude (for edits)
   * @returns Validation result
   */
  static async validateOrderNumberGlobal(orderNumber: string, companyId: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const ordersRef = collection(db, "orders")
      const q = query(
        ordersRef,
        where("companyId", "==", companyId),
        where("orderNumber", "==", orderNumber)
      )

      const snapshot = await getDocs(q)

      // Check if any documents exist (excluding the current one if editing)
      const exists = snapshot.docs.some(doc => doc.id !== excludeId)

      if (exists) {
        return { isValid: false, error: "Order number already exists" }
      }

      return { isValid: true }
    } catch (error) {
      console.error("Error validating order number:", error)
      return { isValid: false, error: "Failed to validate order number" }
    }
  }

  /**
   * Load historical orders (one-off fetch, no real-time listener)
   * Uses cursor-based pagination for efficient loading of large datasets
   * @param companyId Company ID
   * @param companyType Company type (mine, transporter, logistics_coordinator)
   * @param startDate Start date for date range
   * @param endDate End date for date range
   * @param lastDoc Last document from previous page (for pagination)
   * @returns Orders, hasMore flag, and cursor for next page
   */
  static async loadHistoricalOrders(
    companyId: string,
    companyType: "mine" | "transporter" | "logistics_coordinator",
    startDate: Date,
    endDate: Date,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ orders: Order[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    try {
      const ordersRef = collection(db, "orders")
      const batchSize = 500 // Firestore recommended batch size

      // Convert dates to Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startDate)
      const endTimestamp = Timestamp.fromDate(endDate)

      // Build query based on company type
      let q: Query<DocumentData>;

      if (companyType === "mine") {
        // Mine companies: See all orders they created
        q = query(
          ordersRef,
          where("companyId", "==", companyId),
          where("dbCreatedAt", ">=", startTimestamp),
          where("dbCreatedAt", "<=", endTimestamp),
          orderBy("dbCreatedAt", "desc"),
          limit(batchSize + 1) // Load one extra to check if there are more
        )
      } else {
        // Transporters and LCs: See orders allocated to them
        // Note: This requires a composite index on (allocations.companyId, dbCreatedAt)
        q = query(
          ordersRef,
          where("dbCreatedAt", ">=", startTimestamp),
          where("dbCreatedAt", "<=", endTimestamp),
          orderBy("dbCreatedAt", "desc"),
          limit(batchSize + 1)
        )
      }

      // Add pagination cursor if provided
      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)

      // Check if there are more results
      const hasMore = snapshot.docs.length > batchSize
      const docs = hasMore ? snapshot.docs.slice(0, batchSize) : snapshot.docs

      // Map documents to Order objects
      let orders = docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        } as Order
      })

      // Filter for transporters and LCs (check allocations)
      if (companyType === "transporter") {
        orders = orders.filter(o =>
          o.allocations.some(a => a.companyId === companyId)
        )
      } else if (companyType === "logistics_coordinator") {
        orders = orders.filter(o =>
          o.companyId === companyId ||
          o.allocations.some(a => a.companyId === companyId)
        )
      }

      // Get last document for next pagination
      const newLastDoc = hasMore ? docs[docs.length - 1] : undefined

      return {
        orders,
        hasMore,
        lastDoc: newLastDoc
      }
    } catch (error) {
      console.error("Error loading historical orders:", error)
      return { orders: [], hasMore: false }
    }
  }

  /**
   * Validate allocation weights sum to total
   * @param allocations Allocations array
   * @param totalWeight Total order weight
   * @returns Validation result
   */
  static validateAllocation(allocations: Allocation[], totalWeight: number): { isValid: boolean; error?: string } {
    if (!allocations || allocations.length === 0) {
      return { isValid: true } // No allocations is valid (pending order)
    }

    const sum = allocations.reduce((acc, a) => acc + a.allocatedWeight, 0)

    if (Math.abs(sum - totalWeight) > 0.01) { // Allow small floating point differences
      return {
        isValid: false,
        error: `Weight allocation (${sum} kg) doesn't match total weight (${totalWeight} kg)`
      }
    }

    return { isValid: true }
  }

  /**
   * Validate date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Validation result
   */
  static validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    if (end < start) {
      return { isValid: false, error: "End date must be after start date" }
    }

    return { isValid: true }
  }

  /**
   * Validate collection and destination sites are different
   * @param collectionSiteId Collection site ID
   * @param destinationSiteId Destination site ID
   * @returns Validation result
   */
  static validateSites(collectionSiteId: string, destinationSiteId: string): { isValid: boolean; error?: string } {
    if (collectionSiteId === destinationSiteId) {
      return { isValid: false, error: "Collection and destination sites must be different" }
    }

    return { isValid: true }
  }

  /**
   * Calculate possible trips based on site operating hours and trip duration
   * @param siteId Site ID
   * @param tripDuration Trip duration in hours
   * @param startDate Order start date
   * @param endDate Order end date
   * @returns Trips per day and total trips
   */
  static calculatePossibleTrips(
    siteId: string,
    tripDuration: number,
    startDate: string,
    endDate: string
  ): { tripsPerDay: number; totalTrips: number; error?: string } {
    // Get site from globalData
    const site = globalData.sites.value.find(s => s.id === siteId)

    if (!site || !site.operatingHours) {
      return { tripsPerDay: 0, totalTrips: 0, error: "Site not found or operating hours not configured" }
    }

    // Calculate number of days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Get average operating hours per day
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    let totalOperatingHours = 0
    let operatingDays = 0

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      const dayName = daysOfWeek[currentDate.getDay()]

      const hours = site.operatingHours[dayName as keyof typeof site.operatingHours]
      if (hours && hours.open !== "closed") {
        const openTime = parseFloat(hours.open.replace(":", "."))
        const closeTime = parseFloat(hours.close.replace(":", "."))
        totalOperatingHours += closeTime - openTime
        operatingDays++
      }
    }

    if (operatingDays === 0) {
      return { tripsPerDay: 0, totalTrips: 0, error: "No operating days in selected date range" }
    }

    const avgOperatingHours = totalOperatingHours / operatingDays
    const tripsPerDay = Math.floor(avgOperatingHours / tripDuration)
    const totalTrips = tripsPerDay * operatingDays

    return { tripsPerDay, totalTrips }
  }

  /**
   * Update order allocations (post-creation allocation by LC)
   * @param orderId Order ID
   * @param allocations New allocations array
   * @param toastMessage Success message
   */
  static async allocate(orderId: string, allocations: Allocation[], toastMessage = "Order allocated successfully"): Promise<void> {
    await updateDocument("orders", orderId, {
      allocations,
      status: "allocated"
    }, toastMessage)
  }

  /**
   * Update allocation status for a specific company
   * @param orderId Order ID
   * @param companyId Company ID
   * @param status New status
   */
  static async updateAllocationStatus(orderId: string, companyId: string, status: Allocation["status"]): Promise<void> {
    const order = this.getById(orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    const updatedAllocations = order.allocations.map(a =>
      a.companyId === companyId ? { ...a, status } : a
    )

    await this.update(orderId, { allocations: updatedAllocations }, "Allocation status updated")
  }

  /**
   * Get order progress statistics
   * @param orderId Order ID
   * @returns Progress stats
   */
  static getProgress(orderId: string): {
    completedWeight: number
    totalWeight: number
    completedTrips: number
    percentageComplete: number
  } | null {
    const order = this.getById(orderId)
    if (!order) return null

    const percentageComplete = order.totalWeight > 0
      ? Math.round((order.completedWeight || 0) / order.totalWeight * 100)
      : 0

    return {
      completedWeight: order.completedWeight || 0,
      totalWeight: order.totalWeight,
      completedTrips: order.completedTrips || 0,
      percentageComplete,
    }
  }

  /**
   * Update order progress (called from weighing operations)
   * @param orderId Order ID
   * @param completedWeight Completed weight
   * @param completedTrips Completed trips
   */
  static async updateProgress(orderId: string, completedWeight: number, completedTrips: number): Promise<void> {
    const order = this.getById(orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    // Check if order is now completed
    const status = completedWeight >= order.totalWeight ? "completed" : order.status

    await this.update(orderId, {
      completedWeight,
      completedTrips,
      status,
    }, "Order progress updated")
  }

  /**
   * Check if order has any transactions (weighing records or pre-bookings)
   * @param orderId Order ID
   * @returns True if order is in use
   */
  static async checkOrderInUse(orderId: string): Promise<boolean> {
    // Check weighing records
    const weighingRecordsRef = collection(db, "weighing_records")
    const weighingQuery = query(weighingRecordsRef, where("orderId", "==", orderId), limit(1))
    const weighingSnapshot = await getDocs(weighingQuery)

    if (!weighingSnapshot.empty) {
      return true
    }

    // Check pre-bookings
    const preBookingsRef = collection(db, "pre_bookings")
    const preBookingsQuery = query(preBookingsRef, where("orderId", "==", orderId), limit(1))
    const preBookingsSnapshot = await getDocs(preBookingsQuery)

    return !preBookingsSnapshot.empty
  }

  /**
   * Cancel order
   * @param orderId Order ID
   * @param reason Cancellation reason
   */
  static async cancel(orderId: string, reason: string): Promise<void> {
    await this.update(orderId, {
      status: "cancelled",
      // Store reason in a note or custom field if needed
    }, "Order cancelled successfully")
  }
}
