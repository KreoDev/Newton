import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, newEmail } = body

    // Validate required fields
    if (!userId || !newEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update Firebase Auth email
    await adminAuth.updateUser(userId, {
      email: newEmail,
    })

    // Update Firestore email
    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        email: newEmail,
        updatedAt: Date.now(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
      })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error updating email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update email" },
      { status: 500 }
    )
  }
}
