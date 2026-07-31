import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectDB from '../lib/mongodb';
import Station from '../models/Station';

async function checkStations() {
  await connectDB();
  const stations = await Station.find({}).limit(15);
  console.log('Stations in database:');
  stations.forEach(s => {
    console.log(`${s.stationName}: lat=${s.latitude}, lng=${s.longitude}`);
  });
  process.exit(0);
}

checkStations().catch(console.error);
