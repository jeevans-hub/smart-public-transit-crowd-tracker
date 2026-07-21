import { NextRequest, NextResponse } from 'next/server';
import { vehicleService } from '../../../services/vehicleService';
import { CreateVehicleDTO } from '../../../types/vehicle';

export async function GET() {
  try {
    const vehicles = await vehicleService.getAll();
    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateVehicleDTO = await request.json();
    const vehicle = await vehicleService.create(body);
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create vehicle' },
      { status: 400 }
    );
  }
}
