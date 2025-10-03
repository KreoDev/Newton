import { signal, Signal } from "@preact/signals-react"
import { log } from "@/services/console.service"

export interface CompanySummary {
  id: string
  name: string
}

export interface RoleSummary {
  id: string
  name: string
}

class Data {
  private static instance: Data

  companies: Signal<CompanySummary[]> = signal([])
  roles: Signal<RoleSummary[]> = signal([])

  private constructor() {
    log.loaded("Data")
  }

  static getInstance(): Data {
    if (!Data.instance) {
      Data.instance = new Data()
    }
    return Data.instance
  }

  setCompanies(companies: CompanySummary[]) {
    this.companies.value = companies
  }

  setRoles(roles: RoleSummary[]) {
    this.roles.value = roles
  }
}

export const data = Data.getInstance()
