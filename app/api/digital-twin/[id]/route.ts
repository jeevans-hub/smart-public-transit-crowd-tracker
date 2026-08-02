import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/digital-twin/[id]
 * Get specific digital twin entity by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // city, region, controlCenter, simulation

    let data;
    switch (type) {
      case 'city':
        data = await digitalTwinService.getCityById(id);
        if (!data) {
          return NextResponse.json({ success: false, error: 'City not found' }, { status: 404 });
        }
        break;

      case 'region':
        data = await digitalTwinService.getRegionById(id);
        if (!data) {
          return NextResponse.json({ success: false, error: 'Region not found' }, { status: 404 });
        }
        break;

      case 'controlCenter':
        data = await digitalTwinService.getControlCenterById(id);
        if (!data) {
          return NextResponse.json({ success: false, error: 'Control center not found' }, { status: 404 });
        }
        break;

      case 'simulation':
        data = await digitalTwinService.getSimulation(id);
        if (!data) {
          return NextResponse.json({ success: false, error: 'Simulation not found' }, { status: 404 });
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Type parameter required (city, region, controlCenter, simulation)' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch digital twin entity' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/digital-twin/[id]
 * Update digital twin entity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, ...data } = body;

    let result;
    switch (type) {
      case 'city':
        result = await digitalTwinService.updateCity(id, data);
        break;

      case 'region':
        result = await digitalTwinService.updateRegion(id, data);
        break;

      case 'controlCenter':
        result = await digitalTwinService.updateControlCenter(id, data);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Type parameter required (city, region, controlCenter)' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update digital twin entity' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/digital-twin/[id]
 * Delete digital twin entity
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // city, region, controlCenter, simulation

    let success;
    switch (type) {
      case 'city':
        success = await digitalTwinService.deleteCity(id);
        break;

      case 'region':
        success = await digitalTwinService.deleteRegion(id);
        break;

      case 'controlCenter':
        success = await digitalTwinService.deleteControlCenter(id);
        break;

      case 'simulation':
        await digitalTwinService.stopSimulation(id);
        success = true;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Type parameter required (city, region, controlCenter, simulation)' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: { deleted: success } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete digital twin entity' },
      { status: 500 }
    );
  }
}
