"use client"

import { useState, useMemo } from "react"
import { Building2, Edit, ToggleLeft, ToggleRight, Mountain, Truck, PackageSearch, Trash2, FileText } from "lucide-react"
import type { Company } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { useAlert } from "@/hooks/useAlert"
import { CompanyService } from "@/services/company.service"
import { CompanyFormModal } from "@/components/companies/CompanyFormModal"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { PERMISSIONS } from "@/lib/permissions"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useSimpleModalState } from "@/hooks/useModalState"
import { useEntityList } from "@/hooks/useEntityList"
import { EntityListPage } from "@/components/ui/entity-list/EntityListPage"
import { EntityCardListView } from "@/components/ui/entity-card-list/EntityCardListView"
import { EntityCardSearchBar } from "@/components/ui/entity-card-list/EntityCardSearchBar"
import { EntityCard } from "@/components/ui/entity-card-list/EntityCard"

export default function CompaniesPage() {
  useSignals()
  const { user } = useAuth()
  const { showSuccess, showError, showConfirm } = useAlert()

  const { showCreateModal, setShowCreateModal, editingEntity: editingCompany, setEditingEntity: setEditingCompany } = useSimpleModalState<Company>()
  const [filterType, setFilterType] = useState<string>("all")

  // Get all companies from centralized data
  const allCompanies = globalData.companies.value
  const loading = globalData.loading.value

  // Filter based on user permissions (global users see all, others see only their own)
  const accessibleCompanies = useMemo(() => {
    if (!user) return []
    return user.isGlobal ? allCompanies : allCompanies.filter((c) => c.id === user.companyId)
  }, [allCompanies, user])

  // Use entity list hook (but we'll use custom filtering for companyType)
  const {
    canView,
    canManage,
    isViewOnly,
    permissionLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    filteredItems: searchedCompanies,
  } = useEntityList({
    items: accessibleCompanies,
    searchConfig: SEARCH_CONFIGS.companies,
    viewPermission: PERMISSIONS.ADMIN_COMPANIES_VIEW,
    managePermission: PERMISSIONS.ADMIN_COMPANIES,
    globalDataLoading: loading,
  })

  // Custom filter by companyType (not status)
  const filteredCompanies = searchedCompanies.filter((company) => {
    return filterType === "all" || company.companyType === filterType
  })

  // Custom toggle status with active company protection
  const toggleCompanyStatus = async (company: Company) => {
    if (company.isActive && user && company.id === user.companyId) {
      showError("Cannot Deactivate Active Company", "You cannot deactivate the company you are currently using. Please switch to a different company first.")
      return
    }

    try {
      await CompanyService.update(company.id, { isActive: !company.isActive })
      showSuccess(
        `Company ${company.isActive ? "Deactivated" : "Activated"}`,
        `${company.name} has been ${company.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      showError("Failed to Update Company", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  // Custom delete with active company protection and usage check
  const handleDeleteClick = async (company: Company) => {
    if (!canManage) {
      showError("Permission Denied", "You don't have permission to delete companies.")
      return
    }

    try {
      if (user && company.id === user.companyId) {
        showError("Cannot Delete Company", "You cannot delete the company you are currently using. Please switch to a different company first.")
        return
      }

      const usage = await CompanyService.checkCompanyInUse(company.id)

      if (usage.inUse) {
        const detailsText = usage.details.map((detail) => `• ${detail}`).join("\n")

        const shouldDeactivate = await showConfirm(
          "Cannot Delete Company",
          `This company cannot be deleted because it has:\n\n${detailsText}\n\nInstead of deleting, you can deactivate the company to prevent it from being used while preserving all data.\n\nWould you like to deactivate this company?`,
          "Deactivate Instead"
        )

        if (shouldDeactivate) {
          await toggleCompanyStatus(company)
        }
        return
      }

      const confirmed = await showConfirm("Delete Company", `Are you sure you want to delete "${company.name}"? This action cannot be undone.`, "Delete")
      if (!confirmed) return

      if (!user) return
      await CompanyService.delete(company.id, user.companyId)
      showSuccess("Company Deleted", `${company.name} has been permanently removed.`)
    } catch (error) {
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

  const getFilterLabel = (type: string) => {
    switch (type) {
      case "mine":
        return "Mine"
      case "transporter":
        return "Transporter"
      case "logistics_coordinator":
        return "Logistics Coordinator"
      default:
        return "All Types"
    }
  }

  return (
    <EntityListPage
      title="Companies"
      description={(isViewOnly) => (isViewOnly ? "View company profiles and configurations" : "Manage company profiles and configurations")}
      addButtonLabel="Add Company"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredCompanies}
        loading={loading}
        isSearching={isSearching}
        emptyMessage="No companies found"
        loadingMessage="Loading companies..."
        searchBar={
          <EntityCardSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or registration..."
            filterValue={filterType}
            onFilterChange={setFilterType}
            filterOptions={[
              { label: "All Types", value: "all" },
              { label: "Mine", value: "mine" },
              { label: "Transporter", value: "transporter" },
              { label: "Logistics Coordinator", value: "logistics_coordinator" },
            ]}
            filterLabel={getFilterLabel(filterType)}
          />
        }
        renderCard={(company) => {
          const CompanyIcon = getCompanyIcon(company.companyType)
          return (
            <EntityCard
              icon={<CompanyIcon className="h-5 w-5 text-primary" />}
              title={company.name}
              subtitle={company.registrationNumber ? `${company.registrationNumber} • ${company.companyType.replace("_", " ")}` : company.companyType.replace("_", " ")}
              statusBadge={<Badge variant={company.isActive ? "success" : "secondary"}>{company.isActive ? "Active" : "Inactive"}</Badge>}
              actions={
                <>
                  {canManage ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => toggleCompanyStatus(company)} title={company.isActive ? "Deactivate company" : "Activate company"}>
                        {company.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingCompany(company)} title="Edit company">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(company)} title="Delete company">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : isViewOnly ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditingCompany(company)} title="View company details">
                      <FileText className="h-4 w-4" />
                    </Button>
                  ) : null}
                </>
              }
            />
          )
        }}
      />

      {showCreateModal && <CompanyFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingCompany && (
        <CompanyFormModal
          open={Boolean(editingCompany)}
          onClose={() => setEditingCompany(undefined)}
          onSuccess={() => setEditingCompany(undefined)}
          company={editingCompany}
          viewOnly={isViewOnly}
        />
      )}
    </EntityListPage>
  )
}
