"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, Edit, ToggleLeft, ToggleRight, Mountain, Truck, PackageSearch, Trash2, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CompanyService } from "@/services/company.service"
import type { Company } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { CompanyFormModal } from "@/components/companies/CompanyFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"

export default function CompaniesPage() {
  useSignals()

  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_COMPANIES)
  const { showSuccess, showError, showConfirm } = useAlert()
  const [filterType, setFilterType] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined)
  const [fullCompanies, setFullCompanies] = useState<Company[]>([])
  const [loadingFull, setLoadingFull] = useState(true)

  // Get all companies (including inactive) from centralized data
  const allCompanies = globalData.companies.value
  const loading = globalData.loading.value

  // Filter based on user permissions
  useMemo(() => {
    if (!user) {
      setFullCompanies([])
      setLoadingFull(false)
      return
    }

    // Filter based on user permissions
    const accessibleCompanies = user.isGlobal ? allCompanies : allCompanies.filter(c => c.id === user.companyId)

    setFullCompanies(accessibleCompanies)
    setLoadingFull(false)
  }, [allCompanies, user])

  const { searchTerm, setSearchTerm, filteredItems: searchedCompanies, isSearching } = useOptimizedSearch(fullCompanies, SEARCH_CONFIGS.companies)

  const filteredCompanies = searchedCompanies.filter(company => {
    return filterType === "all" || company.companyType === filterType
  })

  const toggleCompanyStatus = async (company: Company) => {
    try {
      await CompanyService.update(company.id, { isActive: !company.isActive })
      showSuccess(
        `Company ${company.isActive ? "Deactivated" : "Activated"}`,
        `${company.name} has been ${company.isActive ? "deactivated" : "activated"} successfully.`
      )
      // Real-time listener will automatically update the list
    } catch (error) {
      console.error("Error toggling company status:", error)
      showError("Failed to Update Company", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDeleteClick = async (company: Company) => {
    try {
      // Check if trying to delete the active company
      if (user && company.id === user.companyId) {
        showError(
          "Cannot Delete Company",
          "You cannot delete the company you are currently using. Please switch to a different company first if you need to delete this one."
        )
        return
      }

      // Check if company is in use
      const usage = await CompanyService.checkCompanyInUse(company.id)

      if (usage.inUse) {
        const detailsText = usage.details.map(detail => `• ${detail}`).join('\n')
        showError(
          "Cannot Delete Company",
          `This company has:\n\n${detailsText}\n\nPlease remove or reassign these items before deleting the company.`
        )
        return
      }

      showConfirm(
        "Delete Company",
        `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
        async () => {
          try {
            if (!user) return
            await CompanyService.delete(company.id, user.companyId)
            showSuccess("Company Deleted", `${company.name} has been permanently removed.`)
            // Real-time listener will automatically update the list
          } catch (error) {
            console.error("Error deleting company:", error)
            showError("Failed to Delete Company", error instanceof Error ? error.message : "An unexpected error occurred.")
          }
        },
        undefined,
        "Delete",
        "Cancel"
      )
    } catch (error) {
      console.error("Error checking company usage:", error)
      showError("Error", "Failed to check if company can be deleted. Please try again.")
    }
  }

  const getCompanyIcon = (companyType: string) => {
    switch (companyType) {
      case "mine":
        return Mountain
      case "transporter":
        return Truck
      case "logistics_coordinator":
        return PackageSearch
      default:
        return Building2
    }
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to manage companies.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage company profiles and configurations</p>
        </div>
        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or registration..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {filterType === "all" ? "All Types" : filterType === "mine" ? "Mine" : filterType === "transporter" ? "Transporter" : "Logistics Coordinator"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("mine")}>Mine</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("transporter")}>Transporter</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("logistics_coordinator")}>Logistics Coordinator</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || loadingFull || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading companies..." : isSearching ? "Searching..." : "Loading details..."} />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No companies found</div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map(company => {
                const CompanyIcon = getCompanyIcon(company.companyType)
                return (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CompanyIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {company.registrationNumber} • {company.companyType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleCompanyStatus(company)} title={company.isActive ? "Deactivate company" : "Activate company"}>
                        {company.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingCompany(company)} title="Edit company">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(company)} title="Delete company">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Badge variant={company.isActive ? "success" : "secondary"}>{company.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <CompanyFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingCompany && (
        <CompanyFormModal
          open={Boolean(editingCompany)}
          onClose={() => setEditingCompany(undefined)}
          onSuccess={() => setEditingCompany(undefined)}
          company={editingCompany}
        />
      )}
    </div>
  )
}
