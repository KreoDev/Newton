import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(userId)
    } catch (authError: any) {
      // If user doesn't exist in auth (e.g., contact-only user), continue
      if (authError.code !== "auth/user-not-found") {
        throw authError
      }
    }

    // Delete from Firestore
    await adminDb.collection("users").doc(userId).delete()

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    )
  }
}
