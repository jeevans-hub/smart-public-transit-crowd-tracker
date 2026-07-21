import { NextRequest, NextResponse } from 'next/server';
import { stationService } from '../../../services/stationService';
import { CreateStationDTO } from '../../../types/station';

export async function GET() {
  try {
    const stations = await stationService.getAll();
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
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
