import { signal, Signal } from "@preact/signals-react"
import { log } from "@/services/console.service"
import type { User, Company, Role, Product, Group, Site, Client, Asset } from "@/types"
import { createCollectionListener } from "@/lib/firebase-utils"

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
  loading: Signal<boolean> = signal(true)

  private unsubscribers: (() => void)[] = []
  private loadedCollections = new Set<string>()
  private expectedCollections = 8 // companies, roles, users, products, groups, sites, clients, assets

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

  initializeForCompany(companyId: string) {
    this.cleanup()
    this.loading.value = true
    this.loadedCollections.clear()

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

    // Start all listeners
    const unsubCompanies = companiesListener()
    const unsubRoles = rolesListener() // No companyId - roles are global
    const unsubUsers = usersListener(companyId)
    const unsubProducts = productsListener(companyId)
    const unsubGroups = groupsListener(companyId)
    const unsubSites = sitesListener(companyId)
    const unsubClients = clientsListener(companyId)
    const unsubAssets = assetsListener(companyId)

    this.unsubscribers = [unsubCompanies, unsubRoles, unsubUsers, unsubProducts, unsubGroups, unsubSites, unsubClients, unsubAssets]

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
    // Note: Don't clear companies and roles as they're global
  }
}

export const data = Data.getInstance()
