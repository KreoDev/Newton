import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists in Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()

    // Check if user is already a contact (canLogin === false)
    if (userData?.canLogin === false) {
      return NextResponse.json(
        { error: "User is already a contact-only user" },
        { status: 400 }
      )
    }

    // Delete Firebase Authentication account
    try {
      await adminAuth.deleteUser(userId)
    } catch (authError: any) {
      // If user doesn't exist in auth, continue anyway
      if (authError.code !== "auth/user-not-found") {
        throw authError
      }
    }

    // Update Firestore to mark user as contact-only
    await adminDb.collection("users").doc(userId).update({
      canLogin: false,
      updatedAt: Date.now(),
    })

    return NextResponse.json({
      success: true,
      message: "User converted to contact-only successfully",
    })
  } catch (error) {
    console.error("Error converting user to contact:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert user" },
      { status: 500 }
    )
  }
}
