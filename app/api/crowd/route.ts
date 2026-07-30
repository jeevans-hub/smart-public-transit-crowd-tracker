import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { createCrowdReport, getRecentReports, getCrowdStatistics, toCrowdReportResponse } from '@/services/crowdService';
import { verifyToken } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const stats = searchParams.get('stats') === 'true';
    
    if (stats) {
      const statistics = await getCrowdStatistics();
      return NextResponse.json({ success: true, data: statistics });
    }
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const reports = await getRecentReports(limit);
    
    return NextResponse.json({ 
      success: true, 
      data: reports.map(toCrowdReportResponse) 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch crowd reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { vehicleId, routeId, stationId, crowdLevel, passengerCount, vehicleCapacity, reportSource } = body;
    
    if (!vehicleId || !routeId || !stationId || !crowdLevel || passengerCount === undefined || !vehicleCapacity || !reportSource) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (passengerCount < 0 || vehicleCapacity < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid passenger count or vehicle capacity' },
        { status: 400 }
      );
    }
    
    if (passengerCount > vehicleCapacity) {
      return NextResponse.json(
        { success: false, error: 'Passenger count cannot exceed vehicle capacity' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const report = await createCrowdReport({
      vehicleId,
      routeId,
      stationId,
      reportedBy: decoded.userId,
      crowdLevel,
      passengerCount,
      vehicleCapacity,
      reportSource,
    });
    
    return NextResponse.json({ 
      success: true, 
      data: toCrowdReportResponse(report) 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create crowd report' },
      { status: 400 }
    );
  }
}
