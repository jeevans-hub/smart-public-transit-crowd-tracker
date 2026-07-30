import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getVehicleOccupancy } from '@/services/crowdService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    await connectDB();
    const { vehicleId } = await params;
    
    const occupancy = await getVehicleOccupancy(vehicleId);
    
    return NextResponse.json({ success: true, data: occupancy });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch vehicle occupancy' },
      { status: 500 }
    );
  }
}
