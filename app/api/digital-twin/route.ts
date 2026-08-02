import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/digital-twin
 * Get digital twin data with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');
    const type = searchParams.get('type'); // state, health, network, comparison, recommendations

    if (!cityId && type !== 'comparison') {
      return NextResponse.json(
        { success: false, error: 'cityId is required (except for comparison)' },
        { status: 400 }
      );
    }

    let data;
    switch (type) {
      case 'state':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getDigitalTwinState(cityId);
        break;

      case 'health':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getCityHealth(cityId);
        break;

      case 'healthTrend':
        if (!cityId) throw new Error('cityId required');
        const days = parseInt(searchParams.get('days') || '7');
        data = await digitalTwinService.getCityHealthTrend(cityId, days);
        break;

      case 'network':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getNetworkGraph(cityId);
        break;

      case 'networkStats':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getNetworkStatistics(cityId);
        break;

      case 'connectivity':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getConnectivityAnalysis(cityId);
        break;

      case 'fleet':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getFleetDistribution(cityId);
        break;

      case 'recommendations':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getResourceRecommendations(cityId);
        break;

      case 'comparison':
        data = await digitalTwinService.getCityComparison();
        break;

      case 'capacity':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getCapacityRecommendations(cityId);
        break;

      case 'capacityReport':
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getCapacityUtilizationReport(cityId);
        break;

      default:
        if (!cityId) throw new Error('cityId required');
        data = await digitalTwinService.getDigitalTwinState(cityId);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch digital twin data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/digital-twin
 * Create digital twin entities or start simulations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let result;
    switch (action) {
      case 'createCity':
        result = await digitalTwinService.createCity(data);
        return NextResponse.json({ success: true, data: result }, { status: 201 });

      case 'createRegion':
        result = await digitalTwinService.createRegion(data);
        return NextResponse.json({ success: true, data: result }, { status: 201 });

      case 'createControlCenter':
        result = await digitalTwinService.createControlCenter(data);
        return NextResponse.json({ success: true, data: result }, { status: 201 });

      case 'startSimulation':
        result = await digitalTwinService.startSimulation(data);
        return NextResponse.json({ success: true, data: result }, { status: 201 });

      case 'generateReport':
        result = await digitalTwinService.generateReport(data);
        return NextResponse.json({ success: true, data: result }, { status: 201 });

      case 'search':
        result = await digitalTwinService.search(data);
        return NextResponse.json({ success: true, data: result });

      case 'refresh':
        if (!data.cityId) throw new Error('cityId required');
        result = await digitalTwinService.refreshDigitalTwinState(data.cityId);
        return NextResponse.json({ success: true, data: result });

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process digital twin request' },
      { status: 400 }
    );
  }
}
