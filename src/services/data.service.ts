import { signal, Signal } from "@preact/signals-react"
import { log } from "@/services/console.service"
import type { User, Company, Role } from "@/types"
import { createCollectionListener } from "@/lib/firebase-utils"

class Data {
  private static instance: Data

  companies: Signal<Company[]> = signal([])
  roles: Signal<Role[]> = signal([])
  users: Signal<User[]> = signal([])
  loading: Signal<boolean> = signal(true)

  private unsubscribers: (() => void)[] = []
  private loadedCollections = new Set<string>()
  private expectedCollections = 3

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

    const companiesListener = createCollectionListener<Company>("companies", this.companies, {
      onFirstLoad: () => this.markCollectionLoaded("companies"),
    })

    const rolesListener = createCollectionListener<Role>("roles", this.roles, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("roles"),
    })

    const usersListener = createCollectionListener<User>("users", this.users, {
      companyScoped: true,
      onFirstLoad: () => this.markCollectionLoaded("users"),
    })

    const unsubCompanies = companiesListener()
    const unsubRoles = rolesListener(companyId)
    const unsubUsers = usersListener(companyId)

    this.unsubscribers = [unsubCompanies, unsubRoles, unsubUsers]

    return () => this.cleanup()
  }

  private cleanup() {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []
  }
}

export const data = Data.getInstance()
