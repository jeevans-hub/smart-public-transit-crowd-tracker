import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import Station from '../models/Station';
import Agency from '../models/Agency';

// Load environment variables
dotenv.config({ path: '.env.local' });

const bengaluruStations = [
  {
    stationName: 'Majestic Bus Station',
    stationCode: 'MBS001',
    latitude: 12.9767,
    longitude: 77.5713,
    address: 'Kempegowda Bus Station, Bengaluru',
    zone: 'Central',
    platformCount: 10,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms', 'Food Court', 'Parking'],
  },
  {
    stationName: 'Kempegowda Metro Station',
    stationCode: 'KMS001',
    latitude: 12.9767,
    longitude: 77.5713,
    address: 'Kempegowda Metro Station, Majestic, Bengaluru',
    zone: 'Central',
    platformCount: 4,
    facilities: ['Metro Access', 'Ticket Counter', 'Restrooms', 'Elevators', 'Parking'],
  },
  {
    stationName: 'Indiranagar Metro Station',
    stationCode: 'IMS001',
    latitude: 12.9784,
    longitude: 77.6408,
    address: 'Indiranagar Metro Station, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Metro Access', 'Ticket Counter', 'Restrooms', 'Elevators'],
  },
  {
    stationName: 'MG Road Metro Station',
    stationCode: 'MGS001',
    latitude: 12.9756,
    longitude: 77.6066,
    address: 'MG Road Metro Station, Bengaluru',
    zone: 'Central',
    platformCount: 2,
    facilities: ['Metro Access', 'Ticket Counter', 'Restrooms', 'Elevators', 'Shopping'],
  },
  {
    stationName: 'Yeshwanthpur Bus Station',
    stationCode: 'YBS001',
    latitude: 13.0167,
    longitude: 77.5510,
    address: 'Yeshwanthpur Bus Station, Bengaluru',
    zone: 'North',
    platformCount: 8,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms', 'Food Court', 'Parking'],
  },
  {
    stationName: 'Electronic City Bus Station',
    stationCode: 'EBS001',
    latitude: 12.8452,
    longitude: 77.6767,
    address: 'Electronic City Bus Station, Bengaluru',
    zone: 'South',
    platformCount: 6,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms', 'Parking'],
  },
  {
    stationName: 'Banashankari Bus Station',
    stationCode: 'BBS001',
    latitude: 12.9348,
    longitude: 77.5484,
    address: 'Banashankari Bus Station, Bengaluru',
    zone: 'South',
    platformCount: 5,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms', 'Parking'],
  },
  {
    stationName: 'Koramangala Bus Station',
    stationCode: 'KRS001',
    latitude: 12.9352,
    longitude: 77.6245,
    address: 'Koramangala Bus Station, Bengaluru',
    zone: 'South East',
    platformCount: 4,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms'],
  },
  {
    stationName: 'Whitefield Bus Station',
    stationCode: 'WBS001',
    latitude: 12.9698,
    longitude: 77.7498,
    address: 'Whitefield Bus Station, Bengaluru',
    zone: 'East',
    platformCount: 6,
    facilities: ['Waiting Area', 'Ticket Counter', 'Restrooms', 'Food Court', 'Parking'],
  },
  {
    stationName: 'Jayadeva Interchange',
    stationCode: 'JDI001',
    latitude: 12.9170,
    longitude: 77.6231,
    address: 'Jayadeva Interchange, Bengaluru',
    zone: 'South',
    platformCount: 3,
    facilities: ['Metro Access', 'Bus Terminal', 'Ticket Counter', 'Restrooms', 'Elevators'],
  },
];

async function seedBengaluruStations() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('Connected to MongoDB');

    // Find or create BMTC agency
    let agency = await Agency.findOne({ name: 'BMTC' });
    if (!agency) {
      agency = await Agency.create({
        name: 'BMTC',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        contactEmail: 'info@bmtc.karnataka.gov.in',
        contactPhone: '080-22952345',
        website: 'https://bmtc.karnataka.gov.in',
        description: 'Bengaluru Metropolitan Transport Corporation',
        active: true,
      });
      console.log('Created BMTC agency');
    }

    console.log('Seeding Bengaluru stations...');
    let addedCount = 0;
    let updatedCount = 0;

    for (const stationData of bengaluruStations) {
      const existingStation = await Station.findOne({ stationCode: stationData.stationCode });
      
      if (existingStation) {
        // Update existing station
        await Station.findByIdAndUpdate(existingStation._id, {
          ...stationData,
          agencyId: agency._id,
        });
        updatedCount++;
        console.log(`Updated station: ${stationData.stationName}`);
      } else {
        // Create new station
        await Station.create({
          ...stationData,
          agencyId: agency._id,
        });
        addedCount++;
        console.log(`Added station: ${stationData.stationName}`);
      }
    }

    console.log(`\nSeeding completed!`);
    console.log(`Added: ${addedCount} stations`);
    console.log(`Updated: ${updatedCount} stations`);
    console.log(`Total stations in database: ${await Station.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding stations:', error);
    process.exit(1);
  }
}

seedBengaluruStations();
