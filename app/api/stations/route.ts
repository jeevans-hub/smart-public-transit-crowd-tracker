import { NextRequest, NextResponse } from 'next/server';
import { stationService } from '../../../services/stationService';
import { CreateStationDTO } from '../../../types/station';

// Mock data for Bengaluru stations
const MOCK_STATIONS = [
  { _id: '1', stationName: 'Majestic', stationCode: 'BLR-MET-001', zone: 'Central', active: true },
  { _id: '2', stationName: 'Indiranagar', stationCode: 'BLR-MET-002', zone: 'East', active: true },
  { _id: '3', stationName: 'Vidhana Soudha', stationCode: 'BLR-MET-003', zone: 'Central', active: true },
  { _id: '4', stationName: 'MG Road', stationCode: 'BLR-MET-005', zone: 'Central', active: true },
  { _id: '5', stationName: 'Electronic City Bus Station', stationCode: 'BLR-BUS-003', zone: 'South', active: true },
  { _id: '6', stationName: 'Whitefield Bus Station', stationCode: 'BLR-BUS-004', zone: 'East', active: true },
  { _id: '7', stationName: 'Bangalore City Junction', stationCode: 'SBC', zone: 'Central', active: true },
  { _id: '8', stationName: 'Yeshwanthpur Junction', stationCode: 'YPR', zone: 'West', active: true },
];

export async function GET() {
  try {
    const stations = await stationService.getAll();
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    // MongoDB connection failed - use mock data
    console.log('[API Stations] MongoDB connection failed, using mock data');
    console.log('[API Stations] Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({ success: true, data: MOCK_STATIONS });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateStationDTO = await request.json();
    const station = await stationService.create(body);
    return NextResponse.json({ success: true, data: station }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create station' },
      { status: 400 }
    );
  }
}
