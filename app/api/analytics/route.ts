import { NextRequest, NextResponse } from 'next/server';
import {
  AnalyticsFilters,
  AnalyticsOverview,
  KPIMetrics,
  PassengerTrend,
  OccupancyTrend,
  VehicleTrend,
  PredictionTrend,
  AlertTrend,
  HeatmapData,
  StationAnalytics,
  RouteAnalytics,
  VehicleAnalytics,
  RoutePerformance,
  VehicleUtilization,
  PeakHourAnalysis,
  DemandForecast,
  AIRecommendation,
  HistoricalAnalytics,
} from '@/types/analytics';
import {
  getAnalyticsOverview,
  getKPIMetrics,
  getPassengerTrend,
  getOccupancyTrend,
  getVehicleTrend,
  getPredictionTrend,
  getAlertTrend,
  getHeatmapData,
  getStationAnalytics,
  getRouteAnalytics,
  getVehicleAnalytics,
  getRoutePerformance,
  getVehicleUtilization,
  getPeakHourAnalysis,
  getDemandForecast,
  getAIRecommendations,
  getHistoricalAnalytics,
  getMostEfficientRoute,
  getLeastEfficientRoute,
  getMostCrowdedRoute,
  getLeastCrowdedRoute,
  getMostUtilizedVehicle,
  getLeastUtilizedVehicle,
  getTopBusiestStations,
  getTopLeastBusyStations,
  getOfflineVehicles,
  getAverageOperatingHours,
  searchStations,
  searchVehicles,
  searchRoutes,
} from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, action, daysAhead, query } = body;

    if (!filters) {
      return NextResponse.json(
        { success: false, error: 'Filters are required' },
        { status: 400 }
      );
    }

    // Main analytics overview
    if (!action || action === 'overview') {
      const data = await getAnalyticsOverview(filters);
      return NextResponse.json({ success: true, data });
    }

    // Specific data endpoints
    switch (action) {
      case 'kpi':
        const kpi: KPIMetrics = await getKPIMetrics(filters);
        return NextResponse.json({ success: true, data: kpi });

      case 'trends':
        const [passengerTrend, occupancyTrend, vehicleTrend, predictionTrend, alertTrend] =
          await Promise.all([
            getPassengerTrend(filters, 'day'),
            getOccupancyTrend(filters, 'hour'),
            getVehicleTrend(filters, 'hour'),
            getPredictionTrend(filters, 'hour'),
            getAlertTrend(filters, 'hour'),
          ]);
        return NextResponse.json({
          success: true,
          data: { passengerTrend, occupancyTrend, vehicleTrend, predictionTrend, alertTrend },
        });

      case 'heatmap':
        const heatmap: HeatmapData[] = await getHeatmapData(filters);
        return NextResponse.json({ success: true, data: heatmap });

      case 'stations':
        const stations: StationAnalytics[] = await getStationAnalytics(filters);
        return NextResponse.json({ success: true, data: stations });

      case 'routes':
        const routes: RouteAnalytics[] = await getRouteAnalytics(filters);
        return NextResponse.json({ success: true, data: routes });

      case 'vehicles':
        const vehicles: VehicleAnalytics[] = await getVehicleAnalytics(filters);
        return NextResponse.json({ success: true, data: vehicles });

      case 'route-performance':
        const routePerformance: RoutePerformance[] = await getRoutePerformance(filters);
        return NextResponse.json({ success: true, data: routePerformance });

      case 'vehicle-utilization':
        const vehicleUtilization: VehicleUtilization[] = await getVehicleUtilization(filters);
        return NextResponse.json({ success: true, data: vehicleUtilization });

      case 'peak-hours':
        const peakHours: PeakHourAnalysis[] = await getPeakHourAnalysis(filters);
        return NextResponse.json({ success: true, data: peakHours });

      case 'forecast':
        const forecast: DemandForecast[] = await getDemandForecast(filters, daysAhead || 7);
        return NextResponse.json({ success: true, data: forecast });

      case 'recommendations':
        const recommendations: AIRecommendation[] = await getAIRecommendations(filters);
        return NextResponse.json({ success: true, data: recommendations });

      case 'historical':
        const historical: HistoricalAnalytics = await getHistoricalAnalytics(filters);
        return NextResponse.json({ success: true, data: historical });

      case 'most-efficient-route':
        const mostEfficient = await getMostEfficientRoute(filters);
        return NextResponse.json({ success: true, data: mostEfficient });

      case 'least-efficient-route':
        const leastEfficient = await getLeastEfficientRoute(filters);
        return NextResponse.json({ success: true, data: leastEfficient });

      case 'most-crowded-route':
        const mostCrowded = await getMostCrowdedRoute(filters);
        return NextResponse.json({ success: true, data: mostCrowded });

      case 'least-crowded-route':
        const leastCrowded = await getLeastCrowdedRoute(filters);
        return NextResponse.json({ success: true, data: leastCrowded });

      case 'most-utilized-vehicle':
        const mostUtilized = await getMostUtilizedVehicle(filters);
        return NextResponse.json({ success: true, data: mostUtilized });

      case 'least-utilized-vehicle':
        const leastUtilized = await getLeastUtilizedVehicle(filters);
        return NextResponse.json({ success: true, data: leastUtilized });

      case 'top-busiest-stations':
        const busiestStations = await getTopBusiestStations(filters);
        return NextResponse.json({ success: true, data: busiestStations });

      case 'top-least-busy-stations':
        const leastBusyStations = await getTopLeastBusyStations(filters);
        return NextResponse.json({ success: true, data: leastBusyStations });

      case 'offline-vehicles':
        const offlineVehicles = await getOfflineVehicles(filters);
        return NextResponse.json({ success: true, data: offlineVehicles });

      case 'average-operating-hours':
        const avgOperatingHours = await getAverageOperatingHours(filters);
        return NextResponse.json({ success: true, data: avgOperatingHours });

      case 'search-stations':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required for search' }, { status: 400 });
        }
        const searchStationsResult = await searchStations(query, filters);
        return NextResponse.json({ success: true, data: searchStationsResult });

      case 'search-vehicles':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required for search' }, { status: 400 });
        }
        const searchVehiclesResult = await searchVehicles(query, filters);
        return NextResponse.json({ success: true, data: searchVehiclesResult });

      case 'search-routes':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required for search' }, { status: 400 });
        }
        const searchRoutesResult = await searchRoutes(query, filters);
        return NextResponse.json({ success: true, data: searchRoutesResult });

      case 'implement-recommendation':
        if (!body.id) {
          return NextResponse.json({ success: false, error: 'Recommendation ID is required' }, { status: 400 });
        }
        // In a real implementation, this would:
        // 1. Get the recommendation details
        // 2. Execute the recommended action (dispatch vehicles, update frequency, etc.)
        // 3. Log the implementation
        // 4. Update recommendation status in database
        return NextResponse.json({ 
          success: true, 
          message: 'Recommendation implemented successfully',
          implementedAt: new Date().toISOString()
        });

      case 'dismiss-recommendation':
        if (!body.id) {
          return NextResponse.json({ success: false, error: 'Recommendation ID is required' }, { status: 400 });
        }
        // In a real implementation, this would:
        // 1. Update recommendation status to DISCLOSED in database
        // 2. Log the dismissal
        return NextResponse.json({ 
          success: true, 
          message: 'Recommendation dismissed successfully',
          dismissedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'overview';
    const stationId = searchParams.get('stationId');
    const routeId = searchParams.get('routeId');
    const vehicleId = searchParams.get('vehicleId');
    const range = (searchParams.get('range') as any) || 'LAST_7_DAYS';
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');
    const query = searchParams.get('query');

    const filters: AnalyticsFilters = {
      dateRange: { range },
      stationId: stationId || undefined,
      routeId: routeId || undefined,
      vehicleId: vehicleId || undefined,
    };

    switch (action) {
      case 'overview':
        const data = await getAnalyticsOverview(filters);
        return NextResponse.json({ success: true, data });

      case 'kpi':
        const kpi = await getKPIMetrics(filters);
        return NextResponse.json({ success: true, data: kpi });

      case 'trends':
        const [passengerTrend, occupancyTrend, vehicleTrend, predictionTrend, alertTrend] =
          await Promise.all([
            getPassengerTrend(filters, 'day'),
            getOccupancyTrend(filters, 'hour'),
            getVehicleTrend(filters, 'hour'),
            getPredictionTrend(filters, 'hour'),
            getAlertTrend(filters, 'hour'),
          ]);
        return NextResponse.json({
          success: true,
          data: { passengerTrend, occupancyTrend, vehicleTrend, predictionTrend, alertTrend },
        });

      case 'heatmap':
        const heatmap = await getHeatmapData(filters);
        return NextResponse.json({ success: true, data: heatmap });

      case 'stations':
        const stations = await getStationAnalytics(filters);
        return NextResponse.json({ success: true, data: stations });

      case 'routes':
        const routes = await getRouteAnalytics(filters);
        return NextResponse.json({ success: true, data: routes });

      case 'vehicles':
        const vehicles = await getVehicleAnalytics(filters);
        return NextResponse.json({ success: true, data: vehicles });

      case 'peak-hours':
        const peakHours = await getPeakHourAnalysis(filters);
        return NextResponse.json({ success: true, data: peakHours });

      case 'forecast':
        const forecast = await getDemandForecast(filters, daysAhead);
        return NextResponse.json({ success: true, data: forecast });

      case 'recommendations':
        const recommendations = await getAIRecommendations(filters);
        return NextResponse.json({ success: true, data: recommendations });

      case 'search-stations':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
        }
        const searchStationsResult = await searchStations(query, filters);
        return NextResponse.json({ success: true, data: searchStationsResult });

      case 'search-vehicles':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
        }
        const searchVehiclesResult = await searchVehicles(query, filters);
        return NextResponse.json({ success: true, data: searchVehiclesResult });

      case 'search-routes':
        if (!query) {
          return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
        }
        const searchRoutesResult = await searchRoutes(query, filters);
        return NextResponse.json({ success: true, data: searchRoutesResult });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
