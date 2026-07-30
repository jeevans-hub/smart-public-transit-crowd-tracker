import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getLiveVehicleById, updateLiveVehicle, deleteLiveVehicle, toLiveVehicleResponse } from '@/services/liveVehicleService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const vehicle = await getLiveVehicleById(id);
    
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: toLiveVehicleResponse(vehicle) 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { 
      latitude, 
      longitude, 
      speed, 
      heading, 
      currentPassengers, 
      currentStation, 
      nextStation, 
      status 
    } = body;
    
    const vehicle = await updateLiveVehicle(id, {
      latitude,
      longitude,
      speed,
      heading,
      currentPassengers,
      currentStation,
      nextStation,
      status,
    });
    
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: toLiveVehicleResponse(vehicle) 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update vehicle' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const vehicle = await deleteLiveVehicle(id);
    
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: toLiveVehicleResponse(vehicle) 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
