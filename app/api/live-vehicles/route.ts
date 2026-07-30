import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAllLiveVehicles, createLiveVehicle, getLiveVehicleStatistics, toLiveVehicleResponse, simulateVehicleMovement } from '@/services/liveVehicleService';
import { ILiveVehicleFilters, ILiveVehicleSort } from '@/types/vehicle';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const stats = searchParams.get('stats') === 'true';
    const simulate = searchParams.get('simulate') === 'true';
    
    if (stats) {
      const statistics = await getLiveVehicleStatistics();
      return NextResponse.json({ success: true, data: statistics });
    }
    
    if (simulate) {
      await simulateVehicleMovement();
      const result = await getAllLiveVehicles();
      return NextResponse.json({ 
        success: true, 
        data: result.vehicles.map(toLiveVehicleResponse),
        simulated: true 
      });
    }
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any || undefined;
    const route = searchParams.get('route') || undefined;
    const vehicleType = searchParams.get('vehicleType') || undefined;
    const sortField = searchParams.get('sort') as any || 'lastUpdated';
    const sortOrder = (searchParams.get('order') as any) || 'desc';
    
    const filters: ILiveVehicleFilters = {
      search,
      status,
      route,
      vehicleType,
    };
    
    const sort: ILiveVehicleSort = {
      field: sortField,
      order: sortOrder,
    };
    
    const result = await getAllLiveVehicles(filters, sort, page, limit);
    
    return NextResponse.json({ 
      success: true, 
      data: result.vehicles.map(toLiveVehicleResponse),
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch live vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      vehicleId, 
      vehicleNumber, 
      vehicleType, 
      route, 
      driverName, 
      currentStation, 
      nextStation, 
      latitude, 
      longitude, 
      speed, 
      heading, 
      capacity, 
      currentPassengers 
    } = body;
    
    if (!vehicleId || !vehicleNumber || !vehicleType || !route || !latitude || !longitude || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const vehicle = await createLiveVehicle({
      vehicleId,
      vehicleNumber,
      vehicleType,
      route,
      driverName,
      currentStation,
      nextStation,
      latitude,
      longitude,
      speed,
      heading,
      capacity,
      currentPassengers,
    });
    
    return NextResponse.json({ 
      success: true, 
      data: toLiveVehicleResponse(vehicle) 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create live vehicle' },
      { status: 400 }
    );
  }
}
