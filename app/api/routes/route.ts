import { NextRequest, NextResponse } from 'next/server';
import { routeService } from '../../../services/routeService';
import { CreateRouteDTO } from '../../../types/route';

export async function GET() {
  try {
    const routes = await routeService.getAll();
    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
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
