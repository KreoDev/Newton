"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2 } from "lucide-react"
import { CompanyService } from "@/services/company.service"
import type { Company } from "@/types"
import { toast } from "sonner"
import { CompanyFormModal } from "@/components/companies/CompanyFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"

export default function CompaniesPage() {
  const { user } = useAuth()
  const canManage = usePermission(PERMISSIONS.ADMIN_COMPANIES)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { searchTerm, setSearchTerm, filteredItems: searchedCompanies, isSearching } = useOptimizedSearch(companies, SEARCH_CONFIGS.companies)

  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchCompanies() {
    if (!user) return

    try {
      setLoading(true)
      const data = await CompanyService.listAccessibleCompanies(user)
      setCompanies(data)
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setLoading(false)
    }
  }

  const filteredCompanies = searchedCompanies.filter(company => {
    const matchesType = filterType === "all" || company.companyType === filterType
    return matchesType
  })

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
        <Button onClick={() => setShowCreateModal(true)}>
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
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md"
            >
              <option value="all">All Types</option>
              <option value="mine">Mine</option>
              <option value="transporter">Transporter</option>
              <option value="logistics_coordinator">Logistics Coordinator</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading || isSearching ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No companies found</div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.map(company => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.registrationNumber} • {company.companyType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={company.isActive ? "success" : "secondary"}>{company.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <CompanyFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={fetchCompanies} />}
    </div>
  )
}
