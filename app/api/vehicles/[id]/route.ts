import { NextRequest, NextResponse } from 'next/server';
import { vehicleService } from '../../../../services/vehicleService';
import { UpdateVehicleDTO } from '../../../../types/vehicle';
import { socketServer } from '../../../../server/socket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await vehicleService.getById(id);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: vehicle });
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
    const { id } = await params;
    const body: UpdateVehicleDTO = await request.json();
    const vehicle = await vehicleService.update(id, body);
    
    // Broadcast vehicle update via socket
    if (socketServer.isActive() && vehicle) {
      socketServer.broadcastVehicleUpdated(vehicle);
      
      // Also broadcast status change if status was updated
      if (body.status !== undefined) {
        socketServer.broadcastVehicleStatus(vehicle);
      }
    }
    
    return NextResponse.json({ success: true, data: vehicle });
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
    const { id } = await params;
    const deleted = await vehicleService.delete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    // Broadcast vehicle deletion via socket
    if (socketServer.isActive()) {
      socketServer.broadcastVehicleDeleted(id);
    }
    
    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
