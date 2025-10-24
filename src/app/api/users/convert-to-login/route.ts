import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, password } = await request.json()

    if (!userId || !email || !password) {
      return NextResponse.json(
        { error: "User ID, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user exists in Firestore
    const userDoc = await adminDb.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()

    // Check if user already has auth account (canLogin !== false)
    if (userData?.canLogin !== false) {
      return NextResponse.json(
        { error: "User already has login credentials" },
        { status: 400 }
      )
    }

    // Create Firebase Authentication account with the user's existing ID
    try {
      await adminAuth.createUser({
        uid: userId,
        email: email,
        password: password,
        emailVerified: false,
      })
    } catch (authError: any) {
      if (authError.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "Email is already in use by another account" },
          { status: 400 }
        )
      }
      throw authError
    }

    // Update Firestore to mark user as login-enabled
    await adminDb.collection("users").doc(userId).update({
      canLogin: true,
      updatedAt: Date.now(),
      dbUpdatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: "User converted to login user successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert user" },
      { status: 500 }
    )
  }
}
