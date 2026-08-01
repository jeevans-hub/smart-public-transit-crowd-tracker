import { NextRequest, NextResponse } from 'next/server';
import { operationsService } from '@/services/operationsService';
import { OperationsFilters } from '@/types/operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters: OperationsFilters = body.filters || {
      dateRange: {
        range: 'LAST_7_DAYS',
      },
    };

    const result = await operationsService.getOperationsOverview(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in operations API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const filters: OperationsFilters = {
      dateRange: {
        range: 'LAST_7_DAYS',
      },
    };

    const result = await operationsService.getOperationsOverview(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in operations API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}