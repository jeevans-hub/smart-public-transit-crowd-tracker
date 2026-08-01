import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import LiveVehicle from '../models/LiveVehicle';
import { determineVehicleStatus } from '../utils/vehicleStatus';

dotenv.config({ path: '.env.local' });

// BMTC & KSRTC vehicle data
const vehicleTypes = ['BMTC Bus', 'BMTC AC Bus', 'BMTC Vajra (AC Volvo)', 'KSRTC Bus', 'KSRTC AC Bus', 'KSRTC Rajahamsa'];
const bmtcRoutes = ['500', '500A', '335', '335E', 'KIA-7', 'KIA-8', '378', '378A', '378C', '378K', '378M', '378P', '378R', '378V', '378W'];
const ksrtcRoutes = ['KA-01', 'KA-02', 'KA-03', 'KA-04', 'KA-05', 'KA-06', 'KA-07', 'KA-08', 'KA-09', 'KA-10'];
const stations = [
  'Majestic Bus Station (Kempegowda Bus Station)',
  'Shivajinagar Bus Station',
  'Koramangala Bus Stand',
  'Indiranagar Bus Station',
  'Electronic City Bus Terminal',
  'Yelahanka Bus Station',
  'Banashankari Bus Station',
  'Jayanagar Bus Station',
  'MG Road Bus Stop',
  'KR Market Bus Station',
  'KIA Airport Bus Terminal',
  'Peenya Industrial Area',
  'Whitefield Bus Station',
  'HSR Layout Bus Stop',
  'BTM Layout Bus Station',
];

const driverNames = [
  'Ramesh Kumar',
  'Suresh Reddy',
  'Venkatesh Murthy',
  'Krishnaiah',
  'Mohan Das',
  'Rajesh Nair',
  'Srinivasan',
  'Balakrishna',
  'Chandrasekhar',
  'Venkataramana',
  'Nagaraj',
  'Siddaramaiah',
  'Manjunath',
  'Ravi Kumar',
  'Prakash',
];

// Bengaluru area coordinates for realistic positioning
const baseCoordinates = [
  { lat: 12.9716, lng: 77.5946 }, // Bengaluru City Center
  { lat: 12.9352, lng: 77.6245 }, // Majestic Bus Station
  { lat: 12.9784, lng: 77.6408 }, // Indiranagar
  { lat: 12.9141, lng: 77.6101 }, // Jayanagar
  { lat: 12.9356, lng: 77.5355 }, // Yeshwanthpur
  { lat: 12.9767, lng: 77.5713 }, // Shivajinagar
  { lat: 12.9081, lng: 77.5970 }, // Basavanagudi
  { lat: 12.9724, lng: 77.5806 }, // MG Road
  { lat: 12.9304, lng: 77.5837 }, // Malleshwaram
  { lat: 12.9168, lng: 77.5951 }, // Chamrajpet
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
  
  // Alternate between BMTC and KSRTC routes
  const isBMTC = index < 8; // First 8 vehicles are BMTC
  const route = isBMTC ? getRandomItem(bmtcRoutes) : getRandomItem(ksrtcRoutes);
  const vehicleType = isBMTC 
    ? getRandomItem(['BMTC Bus', 'BMTC AC Bus', 'BMTC Vajra (AC Volvo)'])
    : getRandomItem(['KSRTC Bus', 'KSRTC AC Bus', 'KSRTC Rajahamsa']);
  
  return {
    vehicleId: `VH-${String(index + 1).padStart(4, '0')}`,
    vehicleNumber: isBMTC ? `KA-57-${String(index + 1).padStart(2, '0')}` : `KA-01-${String(index + 1).padStart(2, '0')}`,
    vehicleType,
    route,
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
      console.log('Clearing existing documents...');
      await LiveVehicle.deleteMany({});
      console.log('✓ Cleared existing documents');
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
