import { signal, Signal } from "@preact/signals-react"
import { log } from "@/services/console.service"
import type { User, Company, Role, Product, Group, Site, Client, Asset, Order } from "@/types"
import { createCollectionListener } from "@/lib/firebase-utils"
import { where, query, collection, onSnapshot, or, and } from "firebase/firestore"
import { db } from "@/lib/firebase"

class Data {
  private static instance: Data

  companies: Signal<Company[]> = signal([])
  roles: Signal<Role[]> = signal([])
  users: Signal<User[]> = signal([])
  products: Signal<Product[]> = signal([])
  groups: Signal<Group[]> = signal([])
  sites: Signal<Site[]> = signal([])
  clients: Signal<Client[]> = signal([])
  assets: Signal<Asset[]> = signal([])
  orders: Signal<Order[]> = signal([])
  loading: Signal<boolean> = signal(true)

  private unsubscribers: (() => void)[] = []
  private loadedCollections = new Set<string>()
  private expectedCollections = 9 // companies, roles, users, products, groups, sites, clients, assets, orders

  private constructor() {
    log.loaded("Data")
  }

  static getInstance(): Data {
    if (!Data.instance) {
      Data.instance = new Data()
    }
    return Data.instance
  }

  private markCollectionLoaded(collectionName: string) {
    this.loadedCollections.add(collectionName)
    if (this.loadedCollections.size === this.expectedCollections) {
      log.i("Data Service", "All data has been loaded")
      this.loading.value = false
    }
  }

  initializeForCompany(companyId: string, orderHistoryDays: number = 60) {
    this.cleanup()
    this.loading.value = true
    this.loadedCollections.clear()

    // Calculate cutoff date for orders (default 60 days, max 120)
    const daysToLoad = Math.min(Math.max(orderHistoryDays, 1), 120)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToLoad)
    const cutoffMillis = cutoffDate.getTime()

    // Companies: Load ALL (including inactive) for admin pages
    const companiesListener = createCollectionListener<Company>("companies", this.companies, {
      companyScoped: false,
      onFirstLoad: () => {
        this.markCollectionLoaded("companies")
      },
    })

    // Roles: GLOBAL - not company-scoped (shared across all companies)
    const rolesListener = createCollectionListener<Role>("roles", this.roles, {
      companyScoped: false,
      onFirstLoad: () => this.markCollectionLoaded("roles"),
    })

    // Users: Company-scoped
    const usersListener = createCollectionListener<User>("users", this.users, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("users"),
    })

    // Products: Company-scoped
    const productsListener = createCollectionListener<Product>("products", this.products, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("products"),
    })

    // Groups: Company-scoped
    const groupsListener = createCollectionListener<Group>("groups", this.groups, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("groups"),
    })

    // Sites: Company-scoped
    const sitesListener = createCollectionListener<Site>("sites", this.sites, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("sites"),
    })

    // Clients: Company-scoped
    const clientsListener = createCollectionListener<Client>("clients", this.clients, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("clients"),
    })

    // Assets: Company-scoped
    const assetsListener = createCollectionListener<Asset>("assets", this.assets, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("assets"),
    })

    // Orders: Custom listener with multi-condition visibility
    // Different company types see different orders:
    // - Mine companies: orders they created (companyId)
    // - LC companies: orders assigned to them (assignedToLCId)
    // - Transporter companies: orders allocated to them (allocatedCompanyIds array)
    // Use createdAt (client timestamp) instead of dbCreatedAt (server timestamp)
    // because dbCreatedAt uses serverTimestamp() which is resolved asynchronously
    const ordersListener = () => {
      let isFirstLoad = true

      console.log("🔍 Orders Query - Company ID:", companyId)
      console.log("🔍 Orders Query - Cutoff Date:", new Date(cutoffMillis).toISOString())

      // Create compound query: Each visibility condition must include the date filter
      // Firestore requires composite filters (or/and) to include all constraints
      const q = query(
        collection(db, "orders"),
        or(
          and(where("companyId", "==", companyId), where("createdAt", ">=", cutoffMillis)), // Mine companies
          and(where("assignedToLCId", "==", companyId), where("createdAt", ">=", cutoffMillis)), // LC companies
          and(where("allocatedCompanyIds", "array-contains", companyId), where("createdAt", ">=", cutoffMillis)) // Transporters
        )
      )

      return onSnapshot(
        q,
        snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[]

          this.orders.value = data

          if (isFirstLoad) {
            this.markCollectionLoaded("orders")
            isFirstLoad = false
          }
        },
        error => {
          console.error("Error loading orders:", error)
          log.i("Data Service", "Failed to load orders")
        }
      )
    }

    // Start all listeners
    const unsubCompanies = companiesListener()
    const unsubRoles = rolesListener() // No companyId - roles are global
    const unsubUsers = usersListener(companyId)
    const unsubProducts = productsListener(companyId)
    const unsubGroups = groupsListener(companyId)
    const unsubSites = sitesListener(companyId)
    const unsubClients = clientsListener(companyId)
    const unsubAssets = assetsListener(companyId)
    const unsubOrders = ordersListener()

    this.unsubscribers = [unsubCompanies, unsubRoles, unsubUsers, unsubProducts, unsubGroups, unsubSites, unsubClients, unsubAssets, unsubOrders]

    return () => this.cleanup()
  }

  private cleanup() {
    // Unsubscribe all listeners
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []

    // Clear all signal values to prevent stale data
    this.users.value = []
    this.products.value = []
    this.groups.value = []
    this.sites.value = []
    this.clients.value = []
    this.assets.value = []
    this.orders.value = []
    // Note: Don't clear companies and roles as they're global
  }
}

export const data = Data.getInstance()
