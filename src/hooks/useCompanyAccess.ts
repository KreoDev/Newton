import { useMemo } from "react"
import { useCompany } from "@/contexts/CompanyContext"
import type { CompanyType } from "@/types"

/**
 * Features that require specific company types
 */
export type CompanyFeature = "assets" | "products" | "clients" | "sites" | "groups" | "users" | "roles" | "dashboard"

/**
 * Hook to check company type access control
 * Simplifies checking if current company can access specific features
 */
export function useCompanyAccess(feature: CompanyFeature): {
  canAccess: boolean
  companyType: CompanyType | null
  isLoading: boolean
} {
  const { company, loading } = useCompany()

  const canAccess = useMemo(() => {
    if (!company) return false

    switch (feature) {
      case "assets":
        // Assets: Transporter OR Logistics Coordinator with isAlsoTransporter flag
        return company.companyType === "transporter" || (company.companyType === "logistics_coordinator" && company.isAlsoTransporter === true)

      case "products":
      case "clients":
      case "sites":
        // Products, Clients, Sites: Mine companies only
        return company.companyType === "mine"

      case "groups":
        // Organizational Groups: Mine companies only
        return company.companyType === "mine"

      case "users":
      case "roles":
      case "dashboard":
        // Users, Roles, Dashboard: All company types
        return true

      default:
        return false
    }
  }, [company, feature])

  return {
    canAccess,
    companyType: company?.companyType || null,
    isLoading: loading,
  }
}

/**
 * Helper to check multiple features at once
 */
export function useCompanyAccessMultiple(features: CompanyFeature[]): {
  access: Record<CompanyFeature, boolean>
  canAccessAny: boolean
  canAccessAll: boolean
  companyType: CompanyType | null
  isLoading: boolean
} {
  const { company, loading } = useCompany()

  const result = useMemo(() => {
    if (!company) {
      return {
        access: features.reduce((acc, feature) => ({ ...acc, [feature]: false }), {} as Record<CompanyFeature, boolean>),
        canAccessAny: false,
        canAccessAll: false,
      }
    }

    const access = features.reduce((acc, feature) => {
      let canAccess = false

      switch (feature) {
        case "assets":
          canAccess = company.companyType === "transporter" || (company.companyType === "logistics_coordinator" && company.isAlsoTransporter === true)
          break
        case "products":
        case "clients":
        case "sites":
        case "groups":
          canAccess = company.companyType === "mine"
          break
        case "users":
        case "roles":
        case "dashboard":
          canAccess = true
          break
      }

      return { ...acc, [feature]: canAccess }
    }, {} as Record<CompanyFeature, boolean>)

    const accessValues = Object.values(access)

    return {
      access,
      canAccessAny: accessValues.some(v => v),
      canAccessAll: accessValues.every(v => v),
    }
  }, [company, features])

  return {
    ...result,
    companyType: company?.companyType || null,
    isLoading: loading,
  }
}

/**
 * Utility function to get human-readable company type name
 */
export function getCompanyTypeName(companyType: CompanyType): string {
  const typeNames: Record<CompanyType, string> = {
    mine: "Mine",
    transporter: "Transporter",
    logistics_coordinator: "Logistics Coordinator",
  }
  return typeNames[companyType] || companyType
}
