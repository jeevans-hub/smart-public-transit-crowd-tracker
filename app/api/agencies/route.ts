import { NextRequest, NextResponse } from 'next/server';
import { agencyService } from '../../../services/agencyService';
import { CreateAgencyDTO } from '../../../types/agency';

export async function GET() {
  try {
    const agencies = await agencyService.getAll();
    return NextResponse.json({ success: true, data: agencies });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgencyDTO = await request.json();
    const agency = await agencyService.create(body);
    return NextResponse.json({ success: true, data: agency }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create agency' },
      { status: 400 }
    );
  }
}
