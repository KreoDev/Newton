"use client"

import { type ColumnDef } from "@tanstack/react-table"
import type { Asset } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, AlertTriangle } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { data as globalData } from "@/services/data.service"

export const getTrailerColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onView: (asset: Asset) => void,
  onEdit: (asset: Asset) => void,
  onDelete: (asset: Asset) => void,
  onInactivate: (asset: Asset) => void
): ColumnDef<Asset>[] => {
  const getGroupName = (groupId?: string | null) => {
    if (!groupId) return "-"
    const group = globalData.groups.value.find(g => g.id === groupId)
    return group?.name || groupId
  }

  return [
    {
      id: "registration",
      accessorKey: "registration",
      header: "Registration",
      cell: ({ row }) => (
        <span className="font-semibold font-mono whitespace-nowrap">
          {row.original.registration || "N/A"}
        </span>
      ),
      enableHiding: false,
    },
    {
      id: "fleetNumber",
      accessorKey: "fleetNumber",
      header: "Fleet Number",
      cell: ({ row }) => <span className="text-sm">{row.original.fleetNumber || "-"}</span>,
    },
    {
      id: "group",
      accessorFn: (row) => getGroupName(row.groupId),
      header: "Group",
      cell: ({ row }) => {
        const groupName = getGroupName(row.original.groupId)
        return groupName !== "-" ? (
          <Badge variant="purple" className="text-xs">{groupName}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
    },
    {
      id: "makeModel",
      accessorFn: (row) => `${row.make || ""} ${row.model || ""}`.trim(),
      header: "Make & Model",
      cell: ({ row }) => {
        const makeModel = `${row.original.make || ""} ${row.original.model || ""}`.trim()
        return <span className="text-sm">{makeModel || "-"}</span>
      },
    },
    {
      id: "expiryDate",
      accessorKey: "dateOfExpiry",
      header: "Expiry Date",
      cell: ({ row }) => {
        const expiryDate = row.original.dateOfExpiry
        if (!expiryDate) return <span className="text-sm text-muted-foreground">-</span>

        const expiryInfo = AssetFieldMapper.getExpiryInfo(expiryDate)
        const colorMap = {
          green: "bg-green-500/20 text-green-700 dark:text-green-300",
          yellow: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
          orange: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
          red: "bg-red-500/20 text-red-700 dark:text-red-300",
        }

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{expiryDate}</span>
            <Badge variant="outline" className={colorMap[expiryInfo.color]}>
              {expiryInfo.status === "expired" ? "Expired" : expiryInfo.message}
            </Badge>
          </div>
        )
      },
    },
    // Additional hideable columns
    {
      id: "ntCode",
      accessorKey: "ntCode",
      header: "Newton QR",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.ntCode || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "vin",
      accessorKey: "vin",
      header: "VIN",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.vin || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "colour",
      accessorKey: "colour",
      header: "Colour",
      cell: ({ row }) => <span className="text-sm">{row.original.colour || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-sm">{row.original.description || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "licenceDiskNo",
      accessorKey: "licenceDiskNo",
      header: "License Disk No",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.licenceDiskNo || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
      enableHiding: true,
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => <span className="text-sm">{new Date(row.original.updatedAt).toLocaleDateString()}</span>,
      enableHiding: true,
    },
    {
      id: "status",
      accessorFn: (row) => {
        // Return actual status text for searchability
        if (!row.isActive) return "Inactive"
        if (row.dateOfExpiry) {
          const expiryInfo = AssetFieldMapper.getExpiryInfo(row.dateOfExpiry)
          if (expiryInfo.status === "expired") return "Expired"
        }
        return "Active"
      },
      header: "Status",
      cell: ({ row }) => {
        const asset = row.original
        if (!asset.isActive) {
          return <Badge variant="secondary">Inactive</Badge>
        }
        if (asset.dateOfExpiry) {
          const expiryInfo = AssetFieldMapper.getExpiryInfo(asset.dateOfExpiry)
          if (expiryInfo.status === "expired") {
            return <Badge variant="destructive">Expired</Badge>
          }
        }
        return <Badge variant="success">Active</Badge>
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const asset = row.original
        return (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(asset)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(asset)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {asset.isActive && (
                      <DropdownMenuItem onClick={() => onInactivate(asset)}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Mark Inactive
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete(asset)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
