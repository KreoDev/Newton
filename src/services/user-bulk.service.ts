import type { User as UserType } from "@/types"
import { writeBatch, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Export selected users to CSV file
 */
export function exportUsersToCSV(users: UserType[]) {
  const headers = [
    "Name",
    "Email",
    "User Type",
    "Role ID",
    "Company ID",
    "Status",
    "Is Global",
    "Created At",
  ]

  const rows = users.map((user) => [
    `${user.firstName} ${user.lastName}`,
    user.email,
    user.canLogin !== false ? "Login User" : "Contact Only",
    user.roleId,
    user.companyId,
    user.isActive ? "Active" : "Inactive",
    user.isGlobal ? "Yes" : "No",
    new Date(user.createdAt).toLocaleDateString(),
  ])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `users_export_${Date.now()}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Bulk update users with Firestore batch
 */
export async function bulkUpdateUsers(
  userIds: string[],
  updates: Partial<UserType>
): Promise<void> {
  const batch = writeBatch(db)

  userIds.forEach((userId) => {
    const userRef = doc(db, "users", userId)
    batch.update(userRef, {
      ...updates,
      updatedAt: Date.now(),
    })
  })

  await batch.commit()
}

/**
 * Bulk delete users via API
 */
export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
  const response = await fetch("/api/users/bulk-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete users")
  }
}
