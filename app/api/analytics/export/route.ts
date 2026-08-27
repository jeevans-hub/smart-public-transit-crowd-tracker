import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsFilters, ExportOptions } from '@/types/analytics';
import { getAnalyticsOverview } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, options } = body;

    if (!filters || !options) {
      return NextResponse.json(
        { success: false, error: 'Filters and options are required' },
        { status: 400 }
      );
    }

    // Get the analytics data
    const data = await getAnalyticsOverview(filters);

    // Generate report based on format
    let reportContent: string;
    let contentType: string;
    let filename: string;

    switch (options.format) {
      case 'CSV':
        reportContent = generateCSV(data, options);
        contentType = 'text/csv';
        filename = `analytics-report-${Date.now()}.csv`;
        break;
      case 'EXCEL':
        reportContent = generateCSV(data, options); // Excel can read CSV
        contentType = 'text/csv';
        filename = `analytics-report-${Date.now()}.csv`;
        break;
      case 'PDF':
        // For PDF, we'll generate a simple text-based report
        // In production, use a PDF library like jsPDF or puppeteer
        reportContent = generateTextReport(data, options);
        contentType = 'text/plain';
        filename = `analytics-report-${Date.now()}.txt`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid format' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: reportContent,
      contentType,
      filename,
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any, options: ExportOptions): string {
  const rows: string[] = [];

  // Add header
  rows.push('Analytics Report Export');
  rows.push(`Date Range: ${options.dateRange.range}`);
  rows.push(`Generated: ${new Date().toISOString()}`);
  rows.push('');

  // Add KPI section if included
  if (options.sections.includes('KPI') && data.kpi) {
    rows.push('KPI METRICS');
    rows.push('Metric,Value');
    rows.push(`Total Passengers,${data.kpi.totalPassengers || 0}`);
    rows.push(`Average Occupancy,${data.kpi.averageOccupancy || 0}%`);
    rows.push(`Total Vehicles,${data.kpi.totalVehicles || 0}`);
    rows.push(`On-Time Performance,${data.kpi.onTimePerformance || 0}%`);
    rows.push(`Incidents,${data.kpi.incidents || 0}`);
    rows.push('');
  }

  // Add Trends section if included
  if (options.sections.includes('TRENDS') && data.passengerTrend) {
    rows.push('PASSENGER TREND');
    rows.push('Time,Count');
    data.passengerTrend.forEach((item: any) => {
      const time = item.timestamp || item.date || 'Unknown';
      rows.push(`${time},${item.count || 0}`);
    });
    rows.push('');
  }

  // Add Stations section if included
  if (options.sections.includes('STATIONS') && data.topStations) {
    rows.push('TOP STATIONS');
    rows.push('Station,Passengers,Occupancy');
    data.topStations.forEach((station: any) => {
      rows.push(`${station.name},${station.passengers || 0},${station.occupancy || 0}%`);
    });
    rows.push('');
  }

  // Add Routes section if included
  if (options.sections.includes('ROUTES') && data.topRoutes) {
    rows.push('TOP ROUTES');
    rows.push('Route,Passengers,Performance');
    data.topRoutes.forEach((route: any) => {
      rows.push(`${route.name},${route.passengers || 0},${route.performance || 0}%`);
    });
    rows.push('');
  }

  // Add Vehicles section if included
  if (options.sections.includes('VEHICLES') && data.topVehicles) {
    rows.push('TOP VEHICLES');
    rows.push('Vehicle,Utilization,Status');
    data.topVehicles.forEach((vehicle: any) => {
      rows.push(`${vehicle.name},${vehicle.utilization || 0}%,${vehicle.status || 'Unknown'}`);
    });
    rows.push('');
  }

  // Add Recommendations section if included
  if (options.sections.includes('RECOMMENDATIONS') && data.recommendations) {
    rows.push('AI RECOMMENDATIONS');
    rows.push('Recommendation,Priority,Impact');
    data.recommendations.forEach((rec: any) => {
      rows.push(`${rec.recommendation},${rec.priority || 'Medium'},${rec.impact || 'High'}`);
    });
    rows.push('');
  }

  return rows.join('\n');
}

function generateTextReport(data: any, options: ExportOptions): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('ANALYTICS REPORT');
  lines.push('='.repeat(60));
  lines.push(`Date Range: ${options.dateRange.range}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Add KPI section if included
  if (options.sections.includes('KPI') && data.kpi) {
    lines.push('-'.repeat(40));
    lines.push('KPI METRICS');
    lines.push('-'.repeat(40));
    lines.push(`Total Passengers: ${data.kpi.totalPassengers || 0}`);
    lines.push(`Average Occupancy: ${data.kpi.averageOccupancy || 0}%`);
    lines.push(`Total Vehicles: ${data.kpi.totalVehicles || 0}`);
    lines.push(`On-Time Performance: ${data.kpi.onTimePerformance || 0}%`);
    lines.push(`Incidents: ${data.kpi.incidents || 0}`);
    lines.push('');
  }

  // Add Trends section if included
  if (options.sections.includes('TRENDS') && data.passengerTrend) {
    lines.push('-'.repeat(40));
    lines.push('PASSENGER TREND');
    lines.push('-'.repeat(40));
    data.passengerTrend.forEach((item: any) => {
      const time = item.timestamp || item.date || 'Unknown';
      lines.push(`${time}: ${item.count || 0} passengers`);
    });
    lines.push('');
  }

  // Add Stations section if included
  if (options.sections.includes('STATIONS') && data.topStations) {
    lines.push('-'.repeat(40));
    lines.push('TOP STATIONS');
    lines.push('-'.repeat(40));
    data.topStations.forEach((station: any) => {
      lines.push(`${station.name}: ${station.passengers || 0} passengers, ${station.occupancy || 0}% occupancy`);
    });
    lines.push('');
  }

  // Add Routes section if included
  if (options.sections.includes('ROUTES') && data.topRoutes) {
    lines.push('-'.repeat(40));
    lines.push('TOP ROUTES');
    lines.push('-'.repeat(40));
    data.topRoutes.forEach((route: any) => {
      lines.push(`${route.name}: ${route.passengers || 0} passengers, ${route.performance || 0}% performance`);
    });
    lines.push('');
  }

  // Add Vehicles section if included
  if (options.sections.includes('VEHICLES') && data.topVehicles) {
    lines.push('-'.repeat(40));
    lines.push('TOP VEHICLES');
    lines.push('-'.repeat(40));
    data.topVehicles.forEach((vehicle: any) => {
      lines.push(`${vehicle.name}: ${vehicle.utilization || 0}% utilization, ${vehicle.status || 'Unknown'}`);
    });
    lines.push('');
  }

  // Add Recommendations section if included
  if (options.sections.includes('RECOMMENDATIONS') && data.recommendations) {
    lines.push('-'.repeat(40));
    lines.push('AI RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    data.recommendations.forEach((rec: any) => {
      lines.push(`[${rec.priority || 'Medium'}] ${rec.recommendation} (Impact: ${rec.impact || 'High'})`);
    });
    lines.push('');
  }

  lines.push('='.repeat(60));
  lines.push('END OF REPORT');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

function generatePDFData(data: any, options: ExportOptions): any {
  return {
    title: 'Analytics Report',
    dateRange: options.dateRange.range,
    generatedAt: new Date().toISOString(),
    sections: options.sections,
    includeCharts: options.includeCharts,
    includeRawData: options.includeRawData,
    data: data,
  };
}
