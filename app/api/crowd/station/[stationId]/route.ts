import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getStationOccupancy } from '@/services/crowdService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stationId: string }> }
) {
  try {
    await connectDB();
    const { stationId } = await params;
    
    const occupancy = await getStationOccupancy(stationId);
    
    return NextResponse.json({ success: true, data: occupancy });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch station occupancy' },
      { status: 500 }
    );
  }
}
