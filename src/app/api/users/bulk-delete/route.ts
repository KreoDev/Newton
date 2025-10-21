import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(req: NextRequest) {
  try {
    const { userIds } = await req.json()

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid user IDs array" }, { status: 400 })
    }

    // Delete all users in parallel
    const deletePromises = userIds.map(async (userId: string) => {
      try {
        // Delete from Authentication
        await adminAuth.deleteUser(userId)

        // Delete from Firestore
        await adminDb.collection("users").doc(userId).delete()
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error)
        throw error
      }
    })

    await Promise.all(deletePromises)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${userIds.length} user(s)`
    })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete users" },
      { status: 500 }
    )
  }
}
