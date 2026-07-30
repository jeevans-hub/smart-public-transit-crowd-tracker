import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getRouteOccupancy } from '@/services/crowdService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    await connectDB();
    const { routeId } = await params;
    
    const occupancy = await getRouteOccupancy(routeId);
    
    return NextResponse.json({ success: true, data: occupancy });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch route occupancy' },
      { status: 500 }
    );
  }
}
