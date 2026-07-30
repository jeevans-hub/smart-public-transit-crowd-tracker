import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import LiveVehicle from '../models/LiveVehicle';

dotenv.config({ path: '.env.local' });

async function verifyLiveVehicles() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Check if collection exists
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections().toArray();
    const liveVehicleCollection = collections.find(c => c.name === 'livevehicles');
    
    console.log('\n=== COLLECTION VERIFICATION ===');
    if (liveVehicleCollection) {
      console.log('✓ LiveVehicle collection exists: "livevehicles"');
    } else {
      console.log('✗ LiveVehicle collection does NOT exist');
      console.log('Available collections:', collections.map(c => c.name).join(', '));
    }

    // Count documents
    const count = await LiveVehicle.countDocuments();
    console.log(`\n=== DOCUMENT COUNT ===`);
    console.log(`Number of documents in LiveVehicle collection: ${count}`);

    if (count === 0) {
      console.log('✗ Collection is empty - needs seed data');
    } else {
      console.log('✓ Collection has documents');
      
      // Sample a document
      const sample = await LiveVehicle.findOne();
      console.log('\n=== SAMPLE DOCUMENT ===');
      console.log(JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyLiveVehicles();
