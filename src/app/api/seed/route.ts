import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import fs from "fs"
import path from "path"

interface ProgressData {
  stage: string
  message: string
  collection?: string
  count?: number
  progress?: { current: number; total: number }
  completed?: boolean
  results?: {
    cleared: {
      companies: number
      users: number
      transporters: number
      assets: number
      templates: number
      roles: number
    }
    seeded: {
      companies: number
      users: number
      transporters: number
      assets: number
      templates: number
      roles: number
    }
  }
}

const DEFAULT_COMPANY_ID = "c_dev"
const DEFAULT_COMPANY = {
  id: DEFAULT_COMPANY_ID,
  name: "Dev Company",
  companyType: "mine",
  registrationNumber: "2025/DEV/001",
  vatNumber: "0000000000",
  physicalAddress: "1 Dev Street, Sandbox City",
  mainContactId: "u_dev",
  secondaryContactIds: [] as string[],
  mineConfig: {
    sites: ["site_dev"],
    defaultOperatingHours: {
      monday: { open: "06:00", close: "18:00" },
      tuesday: { open: "06:00", close: "18:00" },
      wednesday: { open: "06:00", close: "18:00" },
      thursday: { open: "06:00", close: "18:00" },
      friday: { open: "06:00", close: "18:00" },
      saturday: { open: "06:00", close: "14:00" },
      sunday: { open: "closed", close: "closed" },
    },
  },
  transporterConfig: {},
  logisticsCoordinatorConfig: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
  dbCreatedAt: FieldValue.serverTimestamp(),
  dbUpdatedAt: FieldValue.serverTimestamp(),
  isActive: true,
}

const DEFAULT_USER_EMAIL = "dev@newton.co.za"
const DEFAULT_USER_PASSWORD = process.env.SEED_DEFAULT_USER_PASSWORD || "NewtonDev123!"

const DEFAULT_USER_PROFILE = {
  email: DEFAULT_USER_EMAIL,
  firstName: "Dev",
  lastName: "User",
  roleId: "r_newton_admin",
  companyId: DEFAULT_COMPANY_ID,
  isGlobal: true,
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
}

const TRANSPORTERS = [
  { id: "t_dev_1", name: "Noble Freight", companyId: DEFAULT_COMPANY_ID },
  { id: "t_dev_2", name: "VR Cargo (PTY) LTD", companyId: DEFAULT_COMPANY_ID },
]

const DEFAULT_TEMPLATES = [
  {
    id: "tpl_asset_added",
    name: "Asset Added",
    subject: "New Asset Added",
    body: "A new asset has been added for {{companyName}}",
    category: "asset",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
  },
  {
    id: "tpl_order_created",
    name: "Order Created",
    subject: "New Order Created",
    body: "Order {{orderNumber}} has been created",
    category: "order",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dbCreatedAt: FieldValue.serverTimestamp(),
    dbUpdatedAt: FieldValue.serverTimestamp(),
  },
]

const DEFAULT_ROLES = [
  { id: "r_newton_admin", name: "Newton Administrator", permissionKeys: ["*"], description: "Full system access" },
  { id: "r_site_admin", name: "Site Administrator", permissionKeys: ["assets.view", "orders.view"], description: "Site-level control" },
]

async function clearCollection(collectionName: string, sendProgress: (data: ProgressData) => void) {
  sendProgress({
    stage: "clearing",
    message: `Fetching ${collectionName} collection...`,
    collection: collectionName,
  })

  const snapshot = await adminDb.collection(collectionName).get()
  const totalDocs = snapshot.size

  sendProgress({
    stage: "clearing",
    message: `Found ${totalDocs} documents in ${collectionName}`,
    collection: collectionName,
    count: totalDocs,
  })

  if (totalDocs === 0) {
    return 0
  }

  if (collectionName === "users") {
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const authUid = (data.authUid as string | undefined) ?? docSnap.id
      try {
        await adminAuth.deleteUser(authUid)
      } catch (error) {
        console.warn(`Failed to delete auth user ${authUid}:`, error)
      }
    }
  }

  const batch = adminDb.batch()
  snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref))
  await batch.commit()

  sendProgress({
    stage: "clearing",
    message: `Deleted ${totalDocs} documents from ${collectionName}`,
    collection: collectionName,
    count: totalDocs,
    completed: true,
  })

  return totalDocs
}

async function seedCompany(sendProgress: (data: ProgressData) => void) {
  await adminDb.collection("companies").doc(DEFAULT_COMPANY_ID).set(DEFAULT_COMPANY)
  sendProgress({
    stage: "seeding_companies",
    message: `Seeded company ${DEFAULT_COMPANY.name} (ID: ${DEFAULT_COMPANY_ID})`,
    collection: "companies",
    count: 1,
    completed: true,
  })
  return 1
}

async function seedDefaultUser(sendProgress: (data: ProgressData) => void) {
  const createdUser = await adminAuth.createUser({
    email: DEFAULT_USER_EMAIL,
    password: DEFAULT_USER_PASSWORD,
    displayName: "Dev User",
    emailVerified: true,
  })

  await adminDb
    .collection("users")
    .doc(createdUser.uid)
    .set({
      ...DEFAULT_USER_PROFILE,
      id: createdUser.uid,
      authUid: createdUser.uid,
      isGlobal: DEFAULT_USER_PROFILE.isGlobal,
    })

  sendProgress({
    stage: "seeding_users",
    message: `Seeded default user (${DEFAULT_USER_EMAIL}) with uid ${createdUser.uid}`,
    collection: "users",
    count: 1,
    completed: true,
  })
  return 1
}

async function seedTransporters(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const transporter of TRANSPORTERS) {
    await adminDb
      .collection("transporters")
      .doc(transporter.id)
      .set({
        ...transporter,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_transporters",
      message: `Seeded transporter ${transporter.name} (ID: ${transporter.id})`,
      collection: "transporters",
      progress: { current: count, total: TRANSPORTERS.length },
    })
  }

  sendProgress({
    stage: "seeding_transporters",
    message: `Completed seeding ${count} transporters`,
    collection: "transporters",
    count,
    completed: true,
  })

  return count
}

async function seedAssets(sendProgress: (data: ProgressData) => void) {
  const dataPath = path.join(process.cwd(), "data", "assets-data.json")
  if (!fs.existsSync(dataPath)) {
    sendProgress({
      stage: "seeding_assets",
      message: "No assets data file found. Skipping asset seed.",
      collection: "assets",
      completed: true,
    })
    return 0
  }

  const assets: Array<{ id: string; [key: string]: any }> = JSON.parse(fs.readFileSync(dataPath, "utf8"))

  sendProgress({
    stage: "seeding_assets",
    message: `Found ${assets.length} assets to seed`,
    progress: { current: 0, total: assets.length },
  })

  let count = 0
  const batchSize = 500
  let batch = adminDb.batch()
  let batchCount = 0

  for (const asset of assets) {
    const { id, ...data } = asset
    batch.set(adminDb.collection("assets").doc(id), {
      ...data,
      companyId: data.companyId ?? DEFAULT_COMPANY_ID,
      createdAt: data.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      dbCreatedAt: FieldValue.serverTimestamp(),
      dbUpdatedAt: FieldValue.serverTimestamp(),
      isActive: data.isActive ?? true,
    })

    batchCount += 1
    count += 1

    if (batchCount >= batchSize) {
      await batch.commit()
      batch = adminDb.batch()
      batchCount = 0
      sendProgress({
        stage: "seeding_assets",
        message: `Seeded ${count} / ${assets.length} assets...`,
        collection: "assets",
        progress: { current: count, total: assets.length },
      })
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  sendProgress({
    stage: "seeding_assets",
    message: `Completed seeding ${count} assets`,
    collection: "assets",
    count,
    completed: true,
  })

  return count
}

async function seedNotificationTemplates(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const tpl of DEFAULT_TEMPLATES) {
    await adminDb.collection("notification_templates").doc(tpl.id).set(tpl)
    count += 1
    sendProgress({
      stage: "seeding_templates",
      message: `Seeded notification template ${tpl.name}`,
      collection: "notification_templates",
      progress: { current: count, total: DEFAULT_TEMPLATES.length },
    })
  }

  sendProgress({
    stage: "seeding_templates",
    message: `Completed seeding ${count} notification templates`,
    collection: "notification_templates",
    count,
    completed: true,
  })

  return count
}

async function seedRoles(sendProgress: (data: ProgressData) => void) {
  let count = 0
  for (const role of DEFAULT_ROLES) {
    await adminDb
      .collection("roles")
      .doc(role.id)
      .set({
        ...role,
        companyId: DEFAULT_COMPANY_ID,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        dbCreatedAt: FieldValue.serverTimestamp(),
        dbUpdatedAt: FieldValue.serverTimestamp(),
        isActive: true,
      })
    count += 1
    sendProgress({
      stage: "seeding_roles",
      message: `Seeded role ${role.name}`,
      collection: "roles",
      progress: { current: count, total: DEFAULT_ROLES.length },
    })
  }

  sendProgress({
    stage: "seeding_roles",
    message: `Completed seeding ${count} roles`,
    collection: "roles",
    count,
    completed: true,
  })

  return count
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (data: ProgressData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const results = {
        cleared: { companies: 0, users: 0, transporters: 0, assets: 0, templates: 0, roles: 0 },
        seeded: { companies: 0, users: 0, transporters: 0, assets: 0, templates: 0, roles: 0 },
      }

      try {
        sendProgress({ stage: "start", message: "Starting database seed process..." })

        results.cleared.companies = await clearCollection("companies", sendProgress)
        results.cleared.users = await clearCollection("users", sendProgress)
        results.cleared.transporters = await clearCollection("transporters", sendProgress)
        results.cleared.assets = await clearCollection("assets", sendProgress)
        results.cleared.templates = await clearCollection("notification_templates", sendProgress)
        results.cleared.roles = await clearCollection("roles", sendProgress)

        results.seeded.companies = await seedCompany(sendProgress)
        results.seeded.users = await seedDefaultUser(sendProgress)
        results.seeded.transporters = await seedTransporters(sendProgress)
        results.seeded.assets = await seedAssets(sendProgress)
        results.seeded.templates = await seedNotificationTemplates(sendProgress)
        results.seeded.roles = await seedRoles(sendProgress)

        sendProgress({
          stage: "complete",
          message: "Database seeded successfully!",
          results,
          completed: true,
        })
        sendProgress({
          stage: "summary",
          message: `Seed summary -> Companies: ${results.seeded.companies}, Users: ${results.seeded.users}, Transporters: ${results.seeded.transporters}, Assets: ${results.seeded.assets}`,
        })
      } catch (error) {
        console.error("Error seeding database:", error)
        sendProgress({
          stage: "error",
          message: error instanceof Error ? error.message : "Failed to seed database",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
