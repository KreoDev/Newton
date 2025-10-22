import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { SortingState, VisibilityState, PaginationState, ColumnSizingState } from "@tanstack/react-table"

export interface TableConfig {
  columnOrder: string[]
  columnOrderVersion?: number // Track version of column order to handle migrations
  columnVisibility: VisibilityState
  sorting: SortingState
  pagination?: PaginationState
  columnSizing?: ColumnSizingState
}

interface TableConfigStore {
  configs: Record<string, TableConfig>
  getConfig: (tableId: string) => TableConfig | undefined
  setConfig: (tableId: string, config: Partial<TableConfig>) => void
  resetConfig: (tableId: string) => void
  clearAllConfigs: () => void
}

export const useTableConfigStore = create<TableConfigStore>()(
  persist(
    (set, get) => ({
      configs: {},

      getConfig: (tableId: string) => {
        return get().configs[tableId]
      },

      setConfig: (tableId: string, config: Partial<TableConfig>) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [tableId]: {
              ...state.configs[tableId],
              ...config,
            },
          },
        }))
      },

      resetConfig: (tableId: string) => {
        set((state) => {
          const newConfigs = { ...state.configs }
          delete newConfigs[tableId]
          return { configs: newConfigs }
        })
      },

      clearAllConfigs: () => {
        set({ configs: {} })
      },
    }),
    {
      name: "newton-table-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
