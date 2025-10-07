"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Package, Edit, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import type { Product } from "@/types"
import { useAlert } from "@/hooks/useAlert"
import { ProductFormModal } from "@/components/products/ProductFormModal"
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch"
import { SEARCH_CONFIGS } from "@/config/search-configs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ProductsPage() {
  const { user } = useAuth()
  const { hasPermission: canManage, loading: permissionLoading } = usePermission(PERMISSIONS.ADMIN_PRODUCTS)
  const { showSuccess, showError, showConfirm } = useAlert()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    if (!user?.companyId) return

    const q = query(
      collection(db, "products"),
      where("companyId", "==", user.companyId),
      orderBy("name", "asc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
      setProducts(productsList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.companyId])

  const { searchTerm, setSearchTerm, filteredItems: searchedProducts, isSearching } = useOptimizedSearch(products, SEARCH_CONFIGS.products)

  const filteredProducts = searchedProducts.filter(product => {
    if (filterStatus === "all") return true
    return filterStatus === "active" ? product.isActive : !product.isActive
  })

  const toggleProductStatus = async (product: Product) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isActive: !product.isActive,
        updatedAt: Date.now(),
      })
      showSuccess(
        `Product ${product.isActive ? "Deactivated" : "Activated"}`,
        `${product.name} has been ${product.isActive ? "deactivated" : "activated"} successfully.`
      )
    } catch (error) {
      console.error("Error toggling product status:", error)
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

      showConfirm(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        async () => {
          try {
            await deleteDoc(doc(db, "products", product.id))
            showSuccess("Product Deleted", `${product.name} has been permanently removed.`)
          } catch (error) {
            console.error("Error deleting product:", error)
            showError("Failed to Delete Product", error instanceof Error ? error.message : "An unexpected error occurred.")
          }
        },
        undefined,
        "Delete",
        "Cancel"
      )
    } catch (error) {
      console.error("Error checking product usage:", error)
      showError("Error", "Failed to check if product can be deleted. Please try again.")
    }
  }

  if (permissionLoading) {
    return <LoadingSpinner fullScreen message="Checking permissions..." />
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">You don&apos;t have permission to manage products.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage product catalog and specifications</p>
        </div>
        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
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
                    <Button variant="ghost" size="sm" onClick={() => toggleProductStatus(product)} title={product.isActive ? "Deactivate product" : "Activate product"}>
                      {product.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct(product)} title="Edit product">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)} title="Delete product">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Badge variant={product.isActive ? "success" : "secondary"}>{product.isActive ? "Active" : "Inactive"}</Badge>
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
        />
      )}
    </div>
  )
}
