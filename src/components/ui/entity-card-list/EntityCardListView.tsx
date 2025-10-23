"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface EntityCardListViewProps<T> {
  items: T[]
  loading: boolean
  isSearching: boolean
  renderCard: (item: T) => ReactNode
  searchBar: ReactNode
  emptyMessage?: string
  loadingMessage?: string
}

/**
 * Reusable card list view component
 * Handles loading states, empty states, and card rendering
 */
export function EntityCardListView<T extends { id: string }>({
  items,
  loading,
  isSearching,
  renderCard,
  searchBar,
  emptyMessage = "No items found",
  loadingMessage = "Loading...",
}: EntityCardListViewProps<T>) {
  return (
    <Card className="glass-surface">
      <CardHeader>{searchBar}</CardHeader>
      <CardContent>
        {loading || isSearching ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message={loading ? loadingMessage : "Searching..."} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
