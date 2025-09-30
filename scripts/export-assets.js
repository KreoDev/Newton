#!/usr/bin/env node

/**
 * Export all assets from Firestore to a JSON file
 *
 * Usage: node scripts/export-assets.js
 *
 * This will create assets-data.json in the scripts directory
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// Make sure you have GOOGLE_APPLICATION_CREDENTIALS environment variable set
// or update the credential path below
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function exportAssets() {
  try {
    console.log('Fetching assets from Firestore...');

    const assetsSnapshot = await db.collection('assets').get();

    const assets = [];
    assetsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamps to ISO strings for JSON serialization
      const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value && typeof value === 'object' && value._seconds !== undefined) {
          // Firestore Timestamp
          return new Date(value._seconds * 1000 + (value._nanoseconds || 0) / 1000000).toISOString();
        }
        return value;
      }));

      assets.push({
        id: doc.id,
        ...serializedData
      });
    });

    console.log(`Found ${assets.length} assets`);

    // Save to JSON file
    const outputPath = path.join(__dirname, 'assets-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(assets, null, 2));

    console.log(`✓ Successfully exported assets to ${outputPath}`);
    console.log('\nAsset breakdown:');
    const byType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error exporting assets:', error);
    process.exit(1);
  }
}

exportAssets();