import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phoneNumber, roleId, companyId, isGlobal } = body

    const isContactRole = roleId === "r_contact"

    // Validate required fields (password not required for contact-only users)
    if (!email || !firstName || !lastName || !roleId || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isContactRole && !password) {
      return NextResponse.json({ error: "Password is required for login users" }, { status: 400 })
    }

    let userId: string

    // Only create Firebase Auth user for login users (non-contact roles)
    if (!isContactRole) {
      const authUser = await adminAuth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: false,
      })
      userId = authUser.uid
    } else {
      // For contact-only users, generate a custom ID
      const userRef = adminDb.collection("users").doc()
      userId = userRef.id
    }

    // Create Firestore user document
    await adminDb
      .collection("users")
      .doc(userId)
      .set({
        id: userId,
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        phoneNumber: phoneNumber || "",
        roleId,
        companyId,
        isGlobal: isGlobal || false,
        canLogin: !isContactRole,
        notificationPreferences: {
          "asset.added": true,
          "asset.inactive": true,
          "asset.edited": true,
          "asset.deleted": true,
          "order.created": true,
          "order.allocated": true,
          "order.cancelled": true,
          "order.completed": true,
          "order.expiring": true,
          "weighbridge.overload": true,
          "weighbridge.underweight": true,
          "weighbridge.violations": true,
          "weighbridge.manualOverride": true,
          "preBooking.created": true,
          "preBooking.lateArrival": true,
          "security.invalidLicense": true,
          "security.unbookedArrival": true,
          "security.noActiveOrder": true,
          "security.sealMismatch": true,
          "security.incorrectSealsNo": true,
          "security.unregisteredAsset": true,
          "security.inactiveEntity": true,
          "security.incompleteTruck": true,
          "driver.licenseExpiring7": true,
          "driver.licenseExpiring30": true,
          "system.calibrationDue": true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })

    return NextResponse.json({
      success: true,
      userId: userId,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    )
  }
}
