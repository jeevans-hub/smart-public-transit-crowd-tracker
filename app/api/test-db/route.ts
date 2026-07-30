import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CrowdReport from '@/models/CrowdReport';
import Station from '@/models/Station';
import Route from '@/models/Route';
import Agency from '@/models/Agency';
import { createCrowdReport } from '@/services/crowdService';

export async function GET() {
  try {
    await connectDB();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      status: 'connected',
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
        status: 'disconnected',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectDB();
    
    // Create test agency
    const agency = await Agency.findOneAndUpdate(
      { name: 'Test Transit Agency' },
      {
        name: 'Test Transit Agency',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        contactEmail: 'test@transit.com',
        active: true,
      },
      { upsert: true, returnDocument: 'after' }
    );
    
    // Create test stations
    const stations = [
      { stationName: 'Central Station', stationCode: 'CS001', latitude: 40.7128, longitude: -74.0060, address: '123 Main St', agencyId: agency._id },
      { stationName: 'North Terminal', stationCode: 'NT002', latitude: 40.7589, longitude: -73.9851, address: '456 North Ave', agencyId: agency._id },
      { stationName: 'South Hub', stationCode: 'SH003', latitude: 40.6892, longitude: -74.0445, address: '789 South Blvd', agencyId: agency._id },
      { stationName: 'East Junction', stationCode: 'EJ004', latitude: 40.7484, longitude: -73.9857, address: '321 East St', agencyId: agency._id },
      { stationName: 'West Point', stationCode: 'WP005', latitude: 40.7831, longitude: -73.9712, address: '654 West Rd', agencyId: agency._id },
    ];
    
    const createdStations = [];
    for (const station of stations) {
      const created = await Station.findOneAndUpdate(
        { stationCode: station.stationCode },
        { ...station, active: true },
        { upsert: true, returnDocument: 'after' }
      );
      createdStations.push(created);
    }
    
    // Create test routes
    const routes = [
      { routeNumber: 'A001', routeName: 'Route A', transportType: 'BUS', originStation: 'Central Station', destinationStation: 'North Terminal', agencyId: agency._id },
      { routeNumber: 'B002', routeName: 'Route B', transportType: 'BUS', originStation: 'South Hub', destinationStation: 'East Junction', agencyId: agency._id },
      { routeNumber: 'C003', routeName: 'Route C', transportType: 'METRO', originStation: 'West Point', destinationStation: 'Central Station', agencyId: agency._id },
    ];
    
    const createdRoutes = [];
    for (const route of routes) {
      const created = await Route.findOneAndUpdate(
        { routeNumber: route.routeNumber },
        { ...route, active: true },
        { upsert: true, returnDocument: 'after' }
      );
      createdRoutes.push(created);
    }
    
    // Create test crowd reports
    const crowdLevels = ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'FULL'] as const;
    const reportSources = ['USER', 'STAFF', 'SYSTEM'] as const;
    
    // Clear existing reports
    await CrowdReport.deleteMany({});
    
    // Create 50 test reports spread across time
    const reports = [];
    for (let i = 0; i < 50; i++) {
      const station = createdStations[Math.floor(Math.random() * createdStations.length)];
      const route = createdRoutes[Math.floor(Math.random() * createdRoutes.length)];
      const vehicleId = `Bus-${100 + Math.floor(Math.random() * 500)}`;
      const vehicleCapacity = 50;
      const passengerCount = Math.floor(Math.random() * vehicleCapacity); // Ensure passengerCount <= capacity
      const crowdLevel = crowdLevels[Math.floor(Math.random() * crowdLevels.length)];
      const reportSource = reportSources[Math.floor(Math.random() * reportSources.length)];
      
      const report = await createCrowdReport({
        vehicleId,
        routeId: route._id.toString(),
        stationId: station._id.toString(),
        reportedBy: 'test-user',
        crowdLevel,
        passengerCount,
        vehicleCapacity,
        reportSource,
      });
      
      // Vary the timestamp
      const hoursAgo = Math.floor(Math.random() * 24);
      report.createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      report.updatedAt = report.createdAt;
      await report.save();
      
      reports.push(report);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully',
      data: {
        agency: agency.name,
        stations: createdStations.length,
        routes: createdRoutes.length,
        reports: reports.length,
      },
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed test data',
      },
      { status: 500 }
    );
  }
}
