import { adminDb } from "@/lib/firebase-admin"
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
    cleared: { assets: number; transporters: number }
    seeded: { assets: number; transporters: number }
  }
}

const transporters = [
  { id: "wddF8Zv1jhsXM8fyGv8u", name: "Noble Freight" },
  { id: "ycKo5YSgfOPuqRL8V6LX", name: "VR Cargo (PTY) LTD" },
]

async function clearCollection(collectionName: string, sendProgress: (data: ProgressData) => void) {
  sendProgress({
    stage: "clearing",
    message: `Fetching ${collectionName} collection...`,
    collection: collectionName,
  })

  const snapshot = await adminDb.collection(collectionName).get()
  const totalDocs = snapshot.docs.length

  sendProgress({
    stage: "clearing",
    message: `Found ${totalDocs} documents in ${collectionName}`,
    collection: collectionName,
    count: totalDocs,
  })

  if (totalDocs === 0) {
    return 0
  }

  const batch = adminDb.batch()
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })

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

async function seedTransporters(sendProgress: (data: ProgressData) => void) {
  sendProgress({
    stage: "seeding_transporters",
    message: "Starting to seed transporters...",
    progress: { current: 0, total: transporters.length },
  })

  let count = 0
  for (const transporter of transporters) {
    await adminDb.collection("transporters").doc(transporter.id).set({
      name: transporter.name,
    })
    count++
    sendProgress({
      stage: "seeding_transporters",
      message: `Added transporter: ${transporter.name}`,
      progress: { current: count, total: transporters.length },
    })
  }

  sendProgress({
    stage: "seeding_transporters",
    message: `Completed seeding ${count} transporters`,
    progress: { current: count, total: transporters.length },
    completed: true,
  })

  return count
}

async function seedAssets(sendProgress: (data: ProgressData) => void) {
  const dataPath = path.join(process.cwd(), "data", "assets-data.json")

  if (!fs.existsSync(dataPath)) {
    throw new Error("assets-data.json not found in data directory")
  }

  sendProgress({
    stage: "seeding_assets",
    message: "Loading assets data...",
  })

  const assetsData = JSON.parse(fs.readFileSync(dataPath, "utf8"))
  const totalAssets = assetsData.length

  sendProgress({
    stage: "seeding_assets",
    message: `Found ${totalAssets} assets to seed`,
    progress: { current: 0, total: totalAssets },
  })

  let count = 0
  const batchSize = 500
  let batch = adminDb.batch()
  let batchCount = 0

  for (const asset of assetsData) {
    const { id, ...data } = asset

    // Convert ISO strings to Firestore Timestamps
    const processedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return [key, new Date(value)]
        }
        return [key, value]
      })
    )

    const docRef = adminDb.collection("assets").doc(id)
    batch.set(docRef, processedData)
    batchCount++
    count++

    // Commit batch every 500 documents
    if (batchCount >= batchSize) {
      await batch.commit()
      sendProgress({
        stage: "seeding_assets",
        message: `Seeded ${count} of ${totalAssets} assets...`,
        progress: { current: count, total: totalAssets },
      })
      batch = adminDb.batch()
      batchCount = 0
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit()
  }

  sendProgress({
    stage: "seeding_assets",
    message: `Completed seeding ${count} assets`,
    progress: { current: count, total: totalAssets },
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

      try {
        const results = {
          cleared: {
            assets: 0,
            transporters: 0,
          },
          seeded: {
            assets: 0,
            transporters: 0,
          },
        }

        // Clear collections
        sendProgress({ stage: "start", message: "Starting database seed process..." })

        results.cleared.transporters = await clearCollection("transporters", sendProgress)
        results.cleared.assets = await clearCollection("assets", sendProgress)

        // Seed transporters
        results.seeded.transporters = await seedTransporters(sendProgress)

        // Seed assets
        results.seeded.assets = await seedAssets(sendProgress)

        // Send final results
        sendProgress({
          stage: "complete",
          message: "Database seeded successfully!",
          results,
        })

        controller.close()
      } catch (error) {
        console.error("Error seeding database:", error)
        sendProgress({
          stage: "error",
          message: error instanceof Error ? error.message : "Failed to seed database",
        })
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