import { NextRequest, NextResponse } from 'next/server';
import { routeService } from '../../../services/routeService';
import { CreateRouteDTO } from '../../../types/route';

// Mock data for Bengaluru routes
const MOCK_ROUTES = [
  { _id: '1', routeName: 'Purple Line - Majestic to Baiyappanahalli', routeNumber: 'MG-1', transportType: 'METRO', active: true },
  { _id: '2', routeName: 'Green Line - Majestic to Nagasandra', routeNumber: 'GW-1', transportType: 'METRO', active: true },
  { _id: '3', routeName: 'Vajra - Electronic City to Majestic', routeNumber: 'BMTC-500', transportType: 'BUS', active: true },
  { _id: '4', routeName: 'Big 10 - Shivajinagar to Whitefield', routeNumber: 'BMTC-201', transportType: 'BUS', active: true },
  { _id: '5', routeName: 'Chennai Express - Bangalore to Chennai', routeNumber: 'SBC-MAS', transportType: 'TRAIN', active: true },
  { _id: '6', routeName: 'Mysore Express - Bangalore to Mysore', routeNumber: 'SBC-MYS', transportType: 'TRAIN', active: true },
];

export async function GET() {
  try {
    const routes = await routeService.getAll();
    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    // MongoDB connection failed - use mock data
    console.log('[API Routes] MongoDB connection failed, using mock data');
    console.log('[API Routes] Error:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({ success: true, data: MOCK_ROUTES });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRouteDTO = await request.json();
    const route = await routeService.create(body);
    return NextResponse.json({ success: true, data: route }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create route' },
      { status: 400 }
    );
  }
}
