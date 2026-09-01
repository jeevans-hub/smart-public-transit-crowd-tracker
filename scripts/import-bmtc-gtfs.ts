import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import { BmtcGtfsRoute, BmtcGtfsStop, BmtcGtfsTrip } from '../models/BmtcGtfs';
import { normalizeGtfsStatic } from '../services/transit/gtfs/gtfsNormalizer';
import { loadGtfsStatic } from '../services/transit/gtfs/gtfsStaticLoader';

dotenv.config({ path: '.env.local' });

async function importGtfs() {
  const source = process.argv[2] || process.env.BMTC_GTFS_STATIC_URL;
  if (!source) throw new Error('Set BMTC_GTFS_STATIC_URL or pass a local .zip path');
  const files = await loadGtfsStatic(source, {
    timeoutMs: Number(process.env.BMTC_REQUEST_TIMEOUT_MS || 10_000),
    headers: process.env.BMTC_API_KEY
      ? { [process.env.BMTC_API_KEY_HEADER || 'x-api-key']: process.env.BMTC_API_KEY }
      : undefined,
  });
  const normalized = normalizeGtfsStatic(files);
  await connectDB();

  if (normalized.stops.length) {
    await BmtcGtfsStop.bulkWrite(normalized.stops.map((stop) => ({
      updateOne: {
        filter: { stopId: stop.stopId },
        update: { $set: {
          ...stop,
          lastUpdated: new Date(stop.lastUpdated),
          location: { type: 'Point', coordinates: [stop.longitude, stop.latitude] },
        } },
        upsert: true,
      },
    })), { ordered: false });
  }
  if (normalized.routes.length) {
    await BmtcGtfsRoute.bulkWrite(normalized.routes.map((route) => ({
      updateOne: { filter: { routeId: route.routeId }, update: { $set: route }, upsert: true },
    })), { ordered: false });
  }
  if (normalized.trips.length) {
    await BmtcGtfsTrip.bulkWrite(normalized.trips.map((trip) => ({
      updateOne: { filter: { tripId: trip.tripId }, update: { $set: trip }, upsert: true },
    })), { ordered: false });
  }

  console.log(`Stops imported: ${normalized.stops.length}`);
  console.log(`Routes imported: ${normalized.routes.length}`);
  console.log(`Trips imported: ${normalized.trips.length}`);
}

importGtfs()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'GTFS import failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
