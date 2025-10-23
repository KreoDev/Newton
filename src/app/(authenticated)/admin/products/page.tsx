"use client"

import { Package, Edit, ToggleLeft, ToggleRight, Trash2, FileText } from "lucide-react"
import type { Product } from "@/types"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { PERMISSIONS } from "@/lib/permissions"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { data as globalData } from "@/services/data.service"
import { useSignals } from "@preact/signals-react/runtime"
import { useSimpleModalState } from "@/hooks/useModalState"
import { useEntityList } from "@/hooks/useEntityList"
import { useEntityActions } from "@/hooks/useEntityActions"
import { EntityListPage } from "@/components/ui/entity-list/EntityListPage"
import { EntityCardListView } from "@/components/ui/entity-card-list/EntityCardListView"
import { EntityCardSearchBar } from "@/components/ui/entity-card-list/EntityCardSearchBar"
import { EntityCard } from "@/components/ui/entity-card-list/EntityCard"

export default function ProductsPage() {
  useSignals() // Required for reactivity

  const { showCreateModal, setShowCreateModal, editingEntity: editingProduct, setEditingEntity: setEditingProduct } = useSimpleModalState<Product>()

  // Get products from centralized data service
  const products = globalData.products.value
  const loading = globalData.loading.value

  // Use entity list hook
  const {
    canView,
    canManage,
    isViewOnly,
    permissionLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    filterStatus,
    setFilterStatus,
    filteredItems: filteredProducts,
  } = useEntityList({
    items: products,
    searchConfig: SEARCH_CONFIGS.products,
    viewPermission: PERMISSIONS.ADMIN_PRODUCTS_VIEW,
    managePermission: PERMISSIONS.ADMIN_PRODUCTS,
    globalDataLoading: loading,
  })

  // Use entity actions hook
  const { toggleStatus, deleteEntity } = useEntityActions({
    collection: "products",
    entityName: "Product",
    usageCheckQuery: async (product) => {
      const ordersQuery = query(collection(db, "orders"), where("productId", "==", product.id))
      const ordersSnapshot = await getDocs(ordersQuery)
      return {
        inUse: !ordersSnapshot.empty,
        count: ordersSnapshot.size,
        message: `This product is used in ${ordersSnapshot.size} order(s) and cannot be deleted. Please deactivate it instead.`,
      }
    },
    canManage,
  })

  return (
    <EntityListPage
      title="Products"
      description={(isViewOnly) => (isViewOnly ? "View product catalog and specifications" : "Manage product catalog and specifications")}
      addButtonLabel="Add Product"
      onAddClick={() => setShowCreateModal(true)}
      canView={canView}
      canManage={canManage}
      isViewOnly={isViewOnly}
      permissionLoading={permissionLoading}
    >
      <EntityCardListView
        items={filteredProducts}
        loading={loading}
        isSearching={isSearching}
        emptyMessage="No products found"
        loadingMessage="Loading products..."
        searchBar={
          <EntityCardSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or code..."
            filterValue={filterStatus}
            onFilterChange={setFilterStatus}
            filterOptions={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            filterLabel="All Status"
          />
        }
        renderCard={(product) => (
          <EntityCard
            icon={<Package className="h-5 w-5 text-primary" />}
            title={product.name}
            subtitle={product.code + (product.specifications ? ` • ${product.specifications}` : "")}
            statusBadge={<StatusBadge isActive={product.isActive} />}
            actions={
              <>
                {canManage ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(product)} title={product.isActive ? "Deactivate product" : "Activate product"}>
                      {product.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="Edit product">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntity(product)} title="Delete product">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                ) : isViewOnly ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="View product details">
                    <FileText className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            }
          />
        )}
      />

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
    </EntityListPage>
  )
}
