"use client"

import { useState } from "react"
import { useViewPermission } from "@/hooks/useViewPermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ViewOnlyBadge } from "@/components/ui/view-only-badge"
import { Plus, Search, Package, Edit, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react"
import type { Product } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateDocument, deleteDocument } from "@/lib/firebase-utils"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useSimpleModalState } from "@/hooks/useModalState"

export default function ProductsPage() {
  useSignals() // Required for reactivity
  const { canView, canManage, isViewOnly, loading: permissionLoading } = useViewPermission(
    PERMISSIONS.ADMIN_PRODUCTS_VIEW,
    PERMISSIONS.ADMIN_PRODUCTS
  )
  const { showSuccess, showError, showConfirm } = useAlert()
  const { showCreateModal, setShowCreateModal, editingEntity: editingProduct, setEditingEntity: setEditingProduct } = useSimpleModalState<Product>()
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Get products from centralized data service
  const products = globalData.products.value
  const loading = globalData.loading.value

  const { searchTerm, setSearchTerm, filteredItems: searchedProducts, isSearching } = useOptimizedSearch(products, SEARCH_CONFIGS.products)

  const filteredProducts = searchedProducts.filter(product => {
    if (filterStatus === "all") return true
    return filterStatus === "active" ? product.isActive : !product.isActive
  })

  const toggleProductStatus = async (product: Product) => {
    try {
      await updateDocument("products", product.id, {
        isActive: !product.isActive,
      })
      showSuccess(
        `Product ${product.isActive ? "Deactivated" : "Activated"}`,
        `${product.name} has been ${product.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      showError("Failed to Update Product", error instanceof Error ? error.message : "An unexpected error occurred.")
    }
  }

  const handleDeleteClick = async (product: Product) => {
    try {
      // Check if product is used in any orders
      const ordersQuery = query(collection(db, "orders"), where("productId", "==", product.id))
      const ordersSnapshot = await getDocs(ordersQuery)

      if (!ordersSnapshot.empty) {
        showError(
          "Cannot Delete Product",
          `This product is used in ${ordersSnapshot.size} order(s) and cannot be deleted. Please deactivate it instead.`
        )
        return
      }

      const confirmed = await showConfirm(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        "Delete"
      )
      if (!confirmed) return

      try {
        await deleteDocument("products", product.id, "Product deleted successfully")
      } catch (error) {
        showError("Failed to Delete Product", error instanceof Error ? error.message : "An unexpected error occurred.")
      }
    } catch (error) {
      showError("Error", "Failed to check if product can be deleted. Please try again.")
    }
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to view products.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              {isViewOnly ? "View product catalog and specifications" : "Manage product catalog and specifications"}
            </p>
          </div>
          {isViewOnly && <ViewOnlyBadge />}
        </div>
        {canManage && (
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <Card className="glass-surface">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-md px-3 py-2 bg-background/60 backdrop-blur-md">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {(loading || isSearching) ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message={loading ? "Loading products..." : "Searching..."} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No products found</div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.code}
                        {product.specifications && ` • ${product.specifications}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => toggleProductStatus(product)} title={product.isActive ? "Deactivate product" : "Activate product"}>
                          {product.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="Edit product">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)} title="Delete product">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : isViewOnly ? (
                      <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="View product details">
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <StatusBadge isActive={product.isActive} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && <ProductFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />}

      {editingProduct && (
        <ProductFormModal
          open={Boolean(editingProduct)}
          onClose={() => setEditingProduct(undefined)}
          onSuccess={() => setEditingProduct(undefined)}
          product={editingProduct}
          viewOnly={isViewOnly}
        />
      )}
    </div>
  )
}
