"use client"

import { type ColumnDef } from "@tanstack/react-table"
import type { Asset } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, AlertTriangle, User } from "lucide-react"
import { AssetFieldMapper } from "@/lib/asset-field-mappings"
import { data as globalData } from "@/services/data.service"
import Image from "next/image"

export const getDriverColumns = (
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

  const getDriverName = (asset: Asset) => {
    if (asset.name && asset.surname) {
      return `${asset.initials || asset.name} ${asset.surname}`
    }
    return asset.surname || asset.name || "No Name"
  }

  return [
    {
      id: "photo",
      header: "",
      cell: ({ row }) => {
        const asset = row.original
        return (
          <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            {asset.img ? (
              <Image src={asset.img} alt="Driver photo" width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-primary" />
            )}
          </div>
        )
      },
      enableHiding: false,
      size: 60,
    },
    {
      id: "name",
      accessorFn: (row) => getDriverName(row),
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold whitespace-nowrap">
          {getDriverName(row.original)}
        </span>
      ),
      enableHiding: false,
    },
    {
      id: "idNumber",
      accessorKey: "idNumber",
      header: "ID Number",
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.original.idNumber || "-"}
        </span>
      ),
      enableHiding: false,
    },
    {
      id: "licenceNumber",
      accessorKey: "licenceNumber",
      header: "License Number",
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.original.licenceNumber || "-"}
        </span>
      ),
    },
    {
      id: "licenceType",
      accessorKey: "licenceType",
      header: "License Type",
      cell: ({ row }) => {
        const licenceType = row.original.licenceType
        return licenceType ? (
          <Badge variant="outline" className="text-xs">{licenceType}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      },
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
      id: "expiryDate",
      accessorFn: (row) => row.expiryDate,
      header: "License Expiry",
      cell: ({ row }) => {
        const expiryDate = row.original.expiryDate
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
      id: "gender",
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <span className="text-sm">{row.original.gender || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "birthDate",
      accessorKey: "birthDate",
      header: "Date of Birth",
      cell: ({ row }) => <span className="text-sm">{row.original.birthDate || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "age",
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => <span className="text-sm">{row.original.age || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "sadcCountry",
      accessorKey: "sadcCountry",
      header: "Country",
      cell: ({ row }) => <span className="text-sm">{row.original.sadcCountry || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "issueDate",
      accessorFn: (row) => row.issueDate || row.firstIssueDate,
      header: "Issue Date",
      cell: ({ row }) => {
        const issueDate = row.original.issueDate || row.original.firstIssueDate
        return <span className="text-sm">{issueDate || "-"}</span>
      },
      enableHiding: true,
    },
    {
      id: "vehicleCodes",
      accessorKey: "vehicleCodes",
      header: "Vehicle Codes",
      cell: ({ row }) => <span className="text-sm">{row.original.vehicleCodes || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "vehicleClassCodes",
      accessorKey: "vehicleClassCodes",
      header: "Vehicle Class Codes",
      cell: ({ row }) => <span className="text-sm">{row.original.vehicleClassCodes || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "endorsement",
      accessorKey: "endorsement",
      header: "Endorsement",
      cell: ({ row }) => <span className="text-sm">{row.original.endorsement || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "prdpCode",
      accessorKey: "prdpCode",
      header: "PrDP Code",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.prdpCode || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "prdpCategory",
      accessorKey: "prdpCategory",
      header: "PrDP Category",
      cell: ({ row }) => <span className="text-sm">{row.original.prdpCategory || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "prdpValidUntil",
      accessorKey: "prdpValidUntil",
      header: "PrDP Valid Until",
      cell: ({ row }) => <span className="text-sm">{row.original.prdpValidUntil || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "driverRestrictions",
      accessorKey: "driverRestrictions",
      header: "Driver Restrictions",
      cell: ({ row }) => <span className="text-sm">{row.original.driverRestrictions || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "vehicleRestrictions",
      accessorKey: "vehicleRestrictions",
      header: "Vehicle Restrictions",
      cell: ({ row }) => <span className="text-sm">{row.original.vehicleRestrictions || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "restrictions",
      accessorKey: "restrictions",
      header: "General Restrictions",
      cell: ({ row }) => <span className="text-sm">{row.original.restrictions || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "issuedPlace",
      accessorKey: "issuedPlace",
      header: "Place Issued",
      cell: ({ row }) => <span className="text-sm">{row.original.issuedPlace || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "idType",
      accessorKey: "idType",
      header: "ID Type",
      cell: ({ row }) => <span className="text-sm">{row.original.idType || "-"}</span>,
      enableHiding: true,
    },
    {
      id: "licenceIssueNumber",
      accessorKey: "licenceIssueNumber",
      header: "License Issue Number",
      cell: ({ row }) => <span className="text-sm font-mono">{row.original.licenceIssueNumber || "-"}</span>,
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
        if (row.expiryDate) {
          const expiryInfo = AssetFieldMapper.getExpiryInfo(row.expiryDate)
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
        if (asset.expiryDate) {
          const expiryDate = asset.expiryDate
          if (expiryDate) {
            const expiryInfo = AssetFieldMapper.getExpiryInfo(expiryDate)
            if (expiryInfo.status === "expired") {
              return <Badge variant="destructive">Expired</Badge>
            }
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
