"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building, Edit, ToggleLeft, ToggleRight, Trash2, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Client } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { ClientFormModal } from "@/components/clients/ClientFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ClientsPage() {
  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_CLIENTS)
  const { showSuccess, showError, showConfirm } = useAlert()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    if (!user?.companyId) return

    const q = query(
      collection(db, "clients"),
      where("companyId", "==", user.companyId),
      orderBy("name", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[]
      setClients(clientsList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.companyId])

  const { searchTerm, setSearchTerm, filteredItems: searchedClients, isSearching } = useOptimizedSearch(clients, SEARCH_CONFIGS.clients)

  const filteredClients = searchedClients.filter(client => {
    if (filterStatus === "all") return true
    return filterStatus === "active" ? client.isActive : !client.isActive
  })

  const toggleClientStatus = async (client: Client) => {
    try {
      await updateDoc(doc(db, "clients", client.id), {
        isActive: !client.isActive,
        updatedAt: Date.now(),
      })
      showSuccess(
        `Client ${client.isActive ? "Deactivated" : "Activated"}`,
        `${client.name} has been ${client.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      console.error("Error toggling client status:", error)
      showError("Failed to Update Client", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDeleteClick = async (client: Client) => {
    try {
      // Check if client is used in any orders
      const ordersQuery = query(collection(db, "orders"), where("clientCompanyId", "==", client.id))
      const ordersSnapshot = await getDocs(ordersQuery)

      if (!ordersSnapshot.empty) {
        showError(
          "Cannot Delete Client",
          `This client has existing orders. Please remove or complete these orders before deleting the client.`
        )
        return
      }

      showConfirm(
        "Delete Client",
        `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
        async () => {
          try {
            await deleteDoc(doc(db, "clients", client.id))
            showSuccess("Client Deleted", `${client.name} has been permanently removed.`)
          } catch (error) {
            console.error("Error deleting client:", error)
            showError("Failed to Delete Client", error instanceof Error ? error.message : "An unexpected error occurred.")
          }
        },
        undefined,
        "Delete",
        "Cancel"
      )
    } catch (error) {
      console.error("Error checking client usage:", error)
      showError("Error", "Failed to check if client can be deleted. Please try again.")
    }
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to manage clients.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client companies and contacts</p>
        </div>
        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, registration, or contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {filterStatus === "all" ? "All Status" : filterStatus === "active" ? "Active" : "Inactive"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading clients..." : "Searching..."} />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No clients found</div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{client.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {client.registrationNumber}
                        {client.vatNumber && ` • VAT: ${client.vatNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {client.contactName} • {client.contactEmail} • {client.contactPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleClientStatus(client)} title={client.isActive ? "Deactivate client" : "Activate client"}>
                      {client.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingClient(client)} title="Edit client">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(client)} title="Delete client">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Badge variant={client.isActive ? "success" : "secondary"}>{client.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <ClientFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingClient && (
        <ClientFormModal
          open={Boolean(editingClient)}
          onClose={() => setEditingClient(undefined)}
          onSuccess={() => setEditingClient(undefined)}
          client={editingClient}
        />
      )}
    </div>
  )
}
