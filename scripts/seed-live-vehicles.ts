import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import LiveVehicle from '../models/LiveVehicle';
import { determineVehicleStatus } from '../utils/vehicleStatus';

dotenv.config({ path: '.env.local' });

// Realistic transit vehicle data
const vehicleTypes = ['Electric Bus', 'Hybrid Bus', 'Diesel Bus', 'Articulated Bus'];
const routes = ['Route 101', 'Route 102', 'Route 103', 'Route 201', 'Route 202', 'Route 301', 'Route 302'];
const stations = [
  'Central Station',
  'North Terminal',
  'South Plaza',
  'East Gate',
  'West End',
  'Downtown',
  'Airport',
  'University',
  'Hospital',
  'Shopping Mall',
  'Sports Complex',
  'Industrial Park',
  'Residential Area',
  'Business District',
  'Tech Hub',
];

const driverNames = [
  'John Smith',
  'Maria Garcia',
  'David Johnson',
  'Sarah Williams',
  'Michael Brown',
  'Emily Davis',
  'James Wilson',
  'Jennifer Martinez',
  'Robert Anderson',
  'Lisa Taylor',
  'William Thomas',
  'Jessica Jackson',
  'Christopher White',
  'Amanda Harris',
  'Daniel Martin',
];

// NYC area coordinates for realistic positioning
const baseCoordinates = [
  { lat: 40.7128, lng: -74.0060 }, // NYC
  { lat: 40.7589, lng: -73.9851 }, // Times Square
  { lat: 40.7484, lng: -73.9857 }, // Empire State
  { lat: 40.7614, lng: -73.9776 }, // Central Park
  { lat: 40.6892, lng: -74.0445 }, // Statue of Liberty
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateVehicleData(index: number) {
  const baseCoord = getRandomItem(baseCoordinates);
  const latOffset = getRandomNumber(-0.05, 0.05);
  const lngOffset = getRandomNumber(-0.05, 0.05);
  
  const capacity = getRandomItem([40, 50, 60, 80]);
  const currentPassengers = Math.floor(getRandomNumber(0, capacity));
  const speed = getRandomNumber(0, 60);
  const heading = getRandomNumber(0, 360);
  
  const currentStation = getRandomItem(stations);
  const nextStation = getRandomItem(stations.filter(s => s !== currentStation));
  
  return {
    vehicleId: `VH-${String(index + 1).padStart(4, '0')}`,
    vehicleNumber: `BUS-${1000 + index}`,
    vehicleType: getRandomItem(vehicleTypes),
    route: getRandomItem(routes),
    driverName: getRandomItem(driverNames),
    currentStation,
    nextStation,
    latitude: baseCoord.lat + latOffset,
    longitude: baseCoord.lng + lngOffset,
    speed: Math.round(speed * 10) / 10,
    heading: Math.round(heading),
    capacity,
    currentPassengers,
    status: determineVehicleStatus(speed, new Date()),
    lastUpdated: new Date(),
  };
}

async function seedLiveVehicles() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Check if collection is empty
    const count = await LiveVehicle.countDocuments();
    console.log(`\nCurrent document count: ${count}`);

    if (count > 0) {
      console.log('✗ Collection already has documents. Skipping seed.');
      console.log('To re-seed, clear the collection first.');
      process.exit(0);
    }

    console.log('\n=== SEEDING LIVE VEHICLES ===');
    console.log('Generating 15 realistic transit vehicles...');

    const vehicles = [];
    for (let i = 0; i < 15; i++) {
      const vehicleData = generateVehicleData(i);
      vehicles.push(vehicleData);
      console.log(`  - ${vehicleData.vehicleNumber}: ${vehicleData.route} (${vehicleData.status})`);
    }

    console.log('\nInserting vehicles into database...');
    await LiveVehicle.insertMany(vehicles);
    console.log('✓ Successfully inserted 15 vehicles');

    // Verify insertion
    const newCount = await LiveVehicle.countDocuments();
    console.log(`\nNew document count: ${newCount}`);

    // Show sample
    const sample = await LiveVehicle.findOne();
    console.log('\n=== SAMPLE VEHICLE ===');
    console.log(JSON.stringify(sample, null, 2));

    console.log('\n✓ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding vehicles:', error);
    process.exit(1);
  }
}

seedLiveVehicles();
