#!/usr/bin/env node

/**
 * Seed Firestore with assets from assets-data.json
 *
 * Usage: node scripts/seed-assets.js [--clear]
 *
 * Options:
 *   --clear    Delete all existing assets before seeding
 *
 * This will populate the assets collection in Firestore with data from assets-data.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function clearAssets() {
  console.log('Clearing existing assets...');
  const assetsSnapshot = await db.collection('assets').get();

  const batch = db.batch();
  let deleteCount = 0;

  assetsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
    deleteCount++;
  });

  if (deleteCount > 0) {
    await batch.commit();
    console.log(`✓ Deleted ${deleteCount} existing assets`);
  } else {
    console.log('No existing assets to delete');
  }
}

async function seedAssets() {
  try {
    // Check if --clear flag is provided
    const shouldClear = process.argv.includes('--clear');

    if (shouldClear) {
      await clearAssets();
    }

    // Read the exported data
    const dataPath = path.join(__dirname, 'assets-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('Error: assets-data.json not found!');
      console.error('Please run "node scripts/export-assets.js" first to export your data.');
      process.exit(1);
    }

    const assetsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`\nSeeding ${assetsData.length} assets to Firestore...`);

    let successCount = 0;
    let errorCount = 0;

    // Seed assets one by one (or use batching for large datasets)
    for (const asset of assetsData) {
      try {
        const { id, ...data } = asset;

        // Convert ISO strings back to Firestore Timestamps
        const processedData = JSON.parse(JSON.stringify(data, (key, value) => {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            // ISO date string - convert to Firestore Timestamp
            return admin.firestore.Timestamp.fromDate(new Date(value));
          }
          return value;
        }));

        // Use the original document ID
        await db.collection('assets').doc(id).set(processedData);
        successCount++;
        process.stdout.write(`\rSeeded: ${successCount}/${assetsData.length}`);
      } catch (error) {
        errorCount++;
        console.error(`\nError seeding asset ${asset.id}:`, error.message);
      }
    }

    console.log(`\n\n✓ Successfully seeded ${successCount} assets`);

    if (errorCount > 0) {
      console.log(`⚠ Failed to seed ${errorCount} assets`);
    }

    console.log('\nAsset breakdown:');
    const byType = assetsData.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error seeding assets:', error);
    process.exit(1);
  }
}

seedAssets();