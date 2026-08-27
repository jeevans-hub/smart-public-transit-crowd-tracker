/**
 * Seed script for Bengaluru Transit Data
 * This script populates the database with realistic Bengaluru metro, bus, and train stations/routes
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Station from '../models/Station';
import Route from '../models/Route';
import Agency from '../models/Agency';

const BENGALURU_STATIONS = [
  // Metro Stations (Namma Metro)
  {
    stationName: 'Majestic',
    stationCode: 'BLR-MET-001',
    latitude: 12.9767,
    longitude: 77.5713,
    address: 'Kempegowda Bus Station, Bengaluru',
    zone: 'Central',
    platformCount: 4,
    facilities: ['Elevator', 'Escalator', 'Parking', 'ATM', 'Food Court'],
  },
  {
    stationName: 'Indiranagar',
    stationCode: 'BLR-MET-002',
    latitude: 12.9749,
    longitude: 77.6408,
    address: 'Indiranagar, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator', 'Parking'],
  },
  {
    stationName: 'Vidhana Soudha',
    stationCode: 'BLR-MET-003',
    latitude: 12.9802,
    longitude: 77.5908,
    address: 'Vidhana Soudha, Bengaluru',
    zone: 'Central',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator'],
  },
  {
    stationName: 'Cubbon Park',
    stationCode: 'BLR-MET-004',
    latitude: 12.9750,
    longitude: 77.5950,
    address: 'Cubbon Park, Bengaluru',
    zone: 'Central',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator', 'Parking'],
  },
  {
    stationName: 'MG Road',
    stationCode: 'BLR-MET-005',
    latitude: 12.9756,
    longitude: 77.6066,
    address: 'MG Road, Bengaluru',
    zone: 'Central',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator', 'Parking', 'ATM'],
  },
  {
    stationName: 'Trinity',
    stationCode: 'BLR-MET-006',
    latitude: 12.9730,
    longitude: 77.6120,
    address: 'Trinity Circle, Bengaluru',
    zone: 'Central',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator'],
  },
  {
    stationName: 'Halasuru',
    stationCode: 'BLR-MET-007',
    latitude: 12.9780,
    longitude: 77.6280,
    address: 'Halasuru, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator', 'Parking'],
  },
  {
    stationName: 'Indiranagar ISRO',
    stationCode: 'BLR-MET-008',
    latitude: 12.9790,
    longitude: 77.6450,
    address: 'ISRO, Indiranagar, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator'],
  },
  {
    stationName: 'Swami Vivekananda Road',
    stationCode: 'BLR-MET-009',
    latitude: 12.9810,
    longitude: 77.6520,
    address: 'Swami Vivekananda Road, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Elevator', 'Escalator', 'Parking'],
  },
  {
    stationName: 'Baiyappanahalli',
    stationCode: 'BLR-MET-010',
    latitude: 12.9900,
    longitude: 77.6600,
    address: 'Baiyappanahalli, Bengaluru',
    zone: 'East',
    platformCount: 4,
    facilities: ['Elevator', 'Escalator', 'Parking', 'Depot'],
  },
  // Bus Stations (BMTC)
  {
    stationName: 'Kempegowda Bus Station',
    stationCode: 'BLR-BUS-001',
    latitude: 12.9767,
    longitude: 77.5713,
    address: 'Majestic, Bengaluru',
    zone: 'Central',
    platformCount: 50,
    facilities: ['Waiting Area', 'Toilets', 'Food Court', 'Parking', 'ATM'],
  },
  {
    stationName: 'Shivajinagar Bus Station',
    stationCode: 'BLR-BUS-002',
    latitude: 12.9814,
    longitude: 77.6027,
    address: 'Shivajinagar, Bengaluru',
    zone: 'Central',
    platformCount: 30,
    facilities: ['Waiting Area', 'Toilets', 'Parking'],
  },
  {
    stationName: 'Electronic City Bus Station',
    stationCode: 'BLR-BUS-003',
    latitude: 12.8442,
    longitude: 77.6337,
    address: 'Electronic City, Bengaluru',
    zone: 'South',
    platformCount: 20,
    facilities: ['Waiting Area', 'Toilets', 'Parking'],
  },
  {
    stationName: 'Whitefield Bus Station',
    stationCode: 'BLR-BUS-004',
    latitude: 12.9698,
    longitude: 77.7498,
    address: 'Whitefield, Bengaluru',
    zone: 'East',
    platformCount: 25,
    facilities: ['Waiting Area', 'Toilets', 'Parking'],
  },
  {
    stationName: 'Yelahanka Bus Station',
    stationCode: 'BLR-BUS-005',
    latitude: 13.1067,
    longitude: 77.5807,
    address: 'Yelahanka, Bengaluru',
    zone: 'North',
    platformCount: 15,
    facilities: ['Waiting Area', 'Toilets', 'Parking'],
  },
  // Railway Stations
  {
    stationName: 'Bangalore City Junction',
    stationCode: 'SBC',
    latitude: 12.9767,
    longitude: 77.5713,
    address: 'Majestic, Bengaluru',
    zone: 'Central',
    platformCount: 10,
    facilities: ['Waiting Halls', 'Retiring Rooms', 'Food Court', 'Parking', 'ATM', 'Wi-Fi'],
  },
  {
    stationName: 'Bangalore Cantonment',
    stationCode: 'BNC',
    latitude: 12.9857,
    longitude: 77.5970,
    address: 'Cantonment, Bengaluru',
    zone: 'Central',
    platformCount: 6,
    facilities: ['Waiting Halls', 'Retiring Rooms', 'Food Court', 'Parking'],
  },
  {
    stationName: 'Yeshwanthpur Junction',
    stationCode: 'YPR',
    latitude: 13.0167,
    longitude: 77.5542,
    address: 'Yeshwanthpur, Bengaluru',
    zone: 'West',
    platformCount: 6,
    facilities: ['Waiting Halls', 'Retiring Rooms', 'Food Court', 'Parking'],
  },
  {
    stationName: 'Krishnarajapuram',
    stationCode: 'KJM',
    latitude: 12.9925,
    longitude: 77.6830,
    address: 'Krishnarajapuram, Bengaluru',
    zone: 'East',
    platformCount: 4,
    facilities: ['Waiting Halls', 'Parking'],
  },
  {
    stationName: 'Banaswadi',
    stationCode: 'BAND',
    latitude: 13.0075,
    longitude: 77.6500,
    address: 'Banaswadi, Bengaluru',
    zone: 'East',
    platformCount: 2,
    facilities: ['Waiting Area', 'Parking'],
  },
];

const BENGALURU_ROUTES = [
  // Metro Routes
  {
    routeNumber: 'MG-1',
    routeName: 'Purple Line - Majestic to Baiyappanahalli',
    transportType: 'METRO',
    originStation: 'Majestic',
    destinationStation: 'Baiyappanahalli',
    estimatedDuration: 25,
    distance: 18.5,
  },
  {
    routeNumber: 'MG-2',
    routeName: 'Purple Line - Baiyappanahalli to Majestic',
    transportType: 'METRO',
    originStation: 'Baiyappanahalli',
    destinationStation: 'Majestic',
    estimatedDuration: 25,
    distance: 18.5,
  },
  {
    routeNumber: 'GW-1',
    routeName: 'Green Line - Majestic to Nagasandra',
    transportType: 'METRO',
    originStation: 'Majestic',
    destinationStation: 'Nagasandra',
    estimatedDuration: 30,
    distance: 20.0,
  },
  {
    routeNumber: 'GW-2',
    routeName: 'Green Line - Nagasandra to Majestic',
    transportType: 'METRO',
    originStation: 'Nagasandra',
    destinationStation: 'Majestic',
    estimatedDuration: 30,
    distance: 20.0,
  },
  // Bus Routes
  {
    routeNumber: 'BMTC-500',
    routeName: 'Vajra - Electronic City to Majestic',
    transportType: 'BUS',
    originStation: 'Electronic City Bus Station',
    destinationStation: 'Kempegowda Bus Station',
    estimatedDuration: 60,
    distance: 25.0,
  },
  {
    routeNumber: 'BMTC-501',
    routeName: 'Vajra - Majestic to Electronic City',
    transportType: 'BUS',
    originStation: 'Kempegowda Bus Station',
    destinationStation: 'Electronic City Bus Station',
    estimatedDuration: 60,
    distance: 25.0,
  },
  {
    routeNumber: 'BMTC-201',
    routeName: 'Big 10 - Shivajinagar to Whitefield',
    transportType: 'BUS',
    originStation: 'Shivajinagar Bus Station',
    destinationStation: 'Whitefield Bus Station',
    estimatedDuration: 75,
    distance: 30.0,
  },
  {
    routeNumber: 'BMTC-202',
    routeName: 'Big 10 - Whitefield to Shivajinagar',
    transportType: 'BUS',
    originStation: 'Whitefield Bus Station',
    destinationStation: 'Shivajinagar Bus Station',
    estimatedDuration: 75,
    distance: 30.0,
  },
  {
    routeNumber: 'BMTC-299',
    routeName: 'Circular - Majestic to Yelahanka',
    transportType: 'BUS',
    originStation: 'Kempegowda Bus Station',
    destinationStation: 'Yelahanka Bus Station',
    estimatedDuration: 90,
    distance: 35.0,
  },
  {
    routeNumber: 'BMTC-298',
    routeName: 'Circular - Yelahanka to Majestic',
    transportType: 'BUS',
    originStation: 'Yelahanka Bus Station',
    destinationStation: 'Kempegowda Bus Station',
    estimatedDuration: 90,
    distance: 35.0,
  },
  // Train Routes
  {
    routeNumber: 'SBC-MAS',
    routeName: 'Chennai Express - Bangalore to Chennai',
    transportType: 'TRAIN',
    originStation: 'Bangalore City Junction',
    destinationStation: 'Chennai Central',
    estimatedDuration: 360,
    distance: 350.0,
  },
  {
    routeNumber: 'SBC-HYB',
    routeName: 'Hyderabad Express - Bangalore to Hyderabad',
    transportType: 'TRAIN',
    originStation: 'Bangalore City Junction',
    destinationStation: 'Hyderabad Deccan',
    estimatedDuration: 480,
    distance: 570.0,
  },
  {
    routeNumber: 'SBC-MYS',
    routeName: 'Mysore Express - Bangalore to Mysore',
    transportType: 'TRAIN',
    originStation: 'Bangalore City Junction',
    destinationStation: 'Mysore Junction',
    estimatedDuration: 180,
    distance: 140.0,
  },
  {
    routeNumber: 'YPR-SBC',
    routeName: 'Local - Yeshwanthpur to Bangalore City',
    transportType: 'TRAIN',
    originStation: 'Yeshwanthpur Junction',
    destinationStation: 'Bangalore City Junction',
    estimatedDuration: 20,
    distance: 15.0,
  },
  {
    routeNumber: 'KJM-SBC',
    routeName: 'Local - Krishnarajapuram to Bangalore City',
    transportType: 'TRAIN',
    originStation: 'Krishnarajapuram',
    destinationStation: 'Bangalore City Junction',
    estimatedDuration: 25,
    distance: 18.0,
  },
];

async function seedBengaluruData() {
  try {
    // Check for MONGODB_URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-transit-db';
    
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not set in .env.local, using default:', mongoUri);
    }
    
    // Set MONGODB_URI for connectDB
    process.env.MONGODB_URI = mongoUri;
    
    await connectDB();
    console.log('Connected to MongoDB');

    // Get or create Bengaluru agency
    let agency = await Agency.findOne({ city: 'Bengaluru' });
    if (!agency) {
      agency = await Agency.create({
        name: 'Bengaluru Metropolitan Transport Corporation',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        contactEmail: 'contact@bmtc.karnataka.gov.in',
        active: true,
      });
      console.log('Created Bengaluru agency:', agency._id);
    }

    // Seed stations
    console.log('Seeding Bengaluru stations...');
    const createdStations = [];
    for (const stationData of BENGALURU_STATIONS) {
      const existingStation = await Station.findOne({ stationCode: stationData.stationCode });
      if (!existingStation) {
        const station = await Station.create({
          ...stationData,
          agencyId: agency._id,
        });
        createdStations.push(station);
        console.log(`Created station: ${stationData.stationName}`);
      } else {
        createdStations.push(existingStation);
        console.log(`Station already exists: ${stationData.stationName}`);
      }
    }

    // Seed routes
    console.log('Seeding Bengaluru routes...');
    for (const routeData of BENGALURU_ROUTES) {
      const existingRoute = await Route.findOne({ routeNumber: routeData.routeNumber });
      if (!existingRoute) {
        // Find origin and destination stations
        const originStation = createdStations.find(s => s.stationName === routeData.originStation);
        const destStation = createdStations.find(s => s.stationName === routeData.destinationStation);

        const stops = [];
        if (originStation) {
          stops.push({
            stationId: originStation._id,
            stationName: originStation.stationName,
            sequence: 1,
          });
        }
        if (destStation) {
          stops.push({
            stationId: destStation._id,
            stationName: destStation.stationName,
            sequence: 2,
          });
        }

        await Route.create({
          ...routeData,
          agencyId: agency._id,
          stops,
        });
        console.log(`Created route: ${routeData.routeName}`);
      } else {
        console.log(`Route already exists: ${routeData.routeName}`);
      }
    }

    console.log('✅ Bengaluru data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Bengaluru data:', error);
    process.exit(1);
  }
}

seedBengaluruData();
