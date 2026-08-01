import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import { ICrowdReportDocument } from '@/types/crowd';
import { ILiveVehicleDocument } from '@/types/vehicle';
import { IPredictionDocument } from '@/types/prediction';
import {
  AnalyticsFilters,
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
  AnalyticsOverview,
} from '@/types/analytics';
import { AnalyticsEngine } from '@/utils/analyticsEngine';
import { calculateKPIMetrics } from '@/utils/kpiCalculator';

/**
 * Get all data needed for analytics
 */
async function getAnalyticsData(filters: AnalyticsFilters) {
  const crowdReports = await CrowdReport.find().sort({ createdAt: -1 }).limit(10000);
  const vehicles = await LiveVehicle.find();
  const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);
  
  const filteredReports = AnalyticsEngine.filterReports(crowdReports, filters);
  const filteredVehicles = AnalyticsEngine.filterVehicles(vehicles, filters);
  const filteredPredictions = filters.predictionWindow
    ? predictions.filter(p => p.predictionWindow === filters.predictionWindow)
    : predictions;
  
  return {
    reports: filteredReports,
    vehicles: filteredVehicles,
    predictions: filteredPredictions,
    allReports: crowdReports,
    allVehicles: vehicles,
    allPredictions: predictions,
  };
}

/**
 * Get KPI metrics
 */
export async function getKPIMetrics(filters: AnalyticsFilters): Promise<KPIMetrics> {
  const { reports, vehicles, predictions } = await getAnalyticsData(filters);
  return calculateKPIMetrics(reports, vehicles, predictions);
}

/**
 * Get passenger trend
 */
export async function getPassengerTrend(
  filters: AnalyticsFilters,
  groupBy: 'hour' | 'day' | 'week' = 'day'
): Promise<PassengerTrend[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generatePassengerTrend(reports, groupBy);
}

/**
 * Get occupancy trend
 */
export async function getOccupancyTrend(
  filters: AnalyticsFilters,
  groupBy: 'hour' | 'day' = 'hour'
): Promise<OccupancyTrend[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateOccupancyTrend(reports, groupBy);
}

/**
 * Get vehicle trend
 */
export async function getVehicleTrend(
  filters: AnalyticsFilters,
  groupBy: 'hour' | 'day' = 'hour'
): Promise<VehicleTrend[]> {
  const { reports, vehicles } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateVehicleTrend(vehicles, reports, groupBy);
}

/**
 * Get prediction trend
 */
export async function getPredictionTrend(
  filters: AnalyticsFilters,
  groupBy: 'hour' | 'day' = 'hour'
): Promise<PredictionTrend[]> {
  const { predictions } = await getAnalyticsData(filters);
  return AnalyticsEngine.generatePredictionTrend(predictions, groupBy);
}

/**
 * Get alert trend
 */
export async function getAlertTrend(
  filters: AnalyticsFilters,
  groupBy: 'hour' | 'day' = 'hour'
): Promise<AlertTrend[]> {
  const { predictions } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateAlertTrend(predictions, groupBy);
}

/**
 * Get heatmap data
 */
export async function getHeatmapData(filters: AnalyticsFilters): Promise<HeatmapData[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateHeatmapData(reports);
}

/**
 * Get station analytics
 */
export async function getStationAnalytics(filters: AnalyticsFilters): Promise<StationAnalytics[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateStationAnalytics(reports);
}

/**
 * Get route analytics
 */
export async function getRouteAnalytics(filters: AnalyticsFilters): Promise<RouteAnalytics[]> {
  const { reports, vehicles } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateRouteAnalytics(reports, vehicles);
}

/**
 * Get vehicle analytics
 */
export async function getVehicleAnalytics(filters: AnalyticsFilters): Promise<VehicleAnalytics[]> {
  const { reports, vehicles } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateVehicleAnalytics(vehicles, reports);
}

/**
 * Get route performance
 */
export async function getRoutePerformance(filters: AnalyticsFilters): Promise<RoutePerformance[]> {
  const { reports, vehicles } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateRoutePerformance(reports, vehicles);
}

/**
 * Get vehicle utilization
 */
export async function getVehicleUtilization(filters: AnalyticsFilters): Promise<VehicleUtilization[]> {
  const { reports, vehicles } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateVehicleUtilization(vehicles, reports);
}

/**
 * Get peak hour analysis
 */
export async function getPeakHourAnalysis(filters: AnalyticsFilters): Promise<PeakHourAnalysis[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generatePeakHourAnalysis(reports);
}

/**
 * Get demand forecast
 */
export async function getDemandForecast(
  filters: AnalyticsFilters,
  daysAhead: number = 7
): Promise<DemandForecast[]> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateDemandForecast(reports, daysAhead);
}

/**
 * Get AI recommendations
 */
export async function getAIRecommendations(filters: AnalyticsFilters): Promise<AIRecommendation[]> {
  const { reports, vehicles, predictions } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateAIRecommendations(reports, vehicles, predictions);
}

/**
 * Get historical analytics
 */
export async function getHistoricalAnalytics(filters: AnalyticsFilters): Promise<HistoricalAnalytics> {
  const { reports } = await getAnalyticsData(filters);
  return AnalyticsEngine.generateHistoricalAnalytics(reports, filters.dateRange);
}

/**
 * Get complete analytics overview
 */
export async function getAnalyticsOverview(filters: AnalyticsFilters): Promise<AnalyticsOverview> {
  const { reports, vehicles, predictions } = await getAnalyticsData(filters);
  
  const [
    kpi,
    passengerTrend,
    occupancyTrend,
    vehicleTrend,
    predictionTrend,
    alertTrend,
    topStations,
    topRoutes,
    topVehicles,
    recommendations,
  ] = await Promise.all([
    getKPIMetrics(filters),
    getPassengerTrend(filters, 'day'),
    getOccupancyTrend(filters, 'hour'),
    getVehicleTrend(filters, 'hour'),
    getPredictionTrend(filters, 'hour'),
    getAlertTrend(filters, 'hour'),
    getStationAnalytics(filters),
    getRouteAnalytics(filters),
    getVehicleAnalytics(filters),
    getAIRecommendations(filters),
  ]);
  
  return {
    kpi,
    passengerTrend,
    occupancyTrend,
    vehicleTrend,
    predictionTrend,
    alertTrend,
    topStations: topStations.slice(0, 10),
    topRoutes: topRoutes.slice(0, 10),
    topVehicles: topVehicles.slice(0, 10),
    recommendations,
  };
}

/**
 * Get most efficient route
 */
export async function getMostEfficientRoute(filters: AnalyticsFilters): Promise<RouteAnalytics | null> {
  const routes = await getRouteAnalytics(filters);
  return routes.length > 0 ? routes[0] : null;
}

/**
 * Get least efficient route
 */
export async function getLeastEfficientRoute(filters: AnalyticsFilters): Promise<RouteAnalytics | null> {
  const routes = await getRouteAnalytics(filters);
  return routes.length > 0 ? routes[routes.length - 1] : null;
}

/**
 * Get most crowded route
 */
export async function getMostCrowdedRoute(filters: AnalyticsFilters): Promise<RouteAnalytics | null> {
  const routes = await getRouteAnalytics(filters);
  return routes.length > 0 ? routes.sort((a, b) => b.averageOccupancy - a.averageOccupancy)[0] : null;
}

/**
 * Get least crowded route
 */
export async function getLeastCrowdedRoute(filters: AnalyticsFilters): Promise<RouteAnalytics | null> {
  const routes = await getRouteAnalytics(filters);
  return routes.length > 0 ? routes.sort((a, b) => a.averageOccupancy - b.averageOccupancy)[0] : null;
}

/**
 * Get most utilized vehicle
 */
export async function getMostUtilizedVehicle(filters: AnalyticsFilters): Promise<VehicleAnalytics | null> {
  const vehicles = await getVehicleAnalytics(filters);
  return vehicles.length > 0 ? vehicles[0] : null;
}

/**
 * Get least utilized vehicle
 */
export async function getLeastUtilizedVehicle(filters: AnalyticsFilters): Promise<VehicleAnalytics | null> {
  const vehicles = await getVehicleAnalytics(filters);
  return vehicles.length > 0 ? vehicles[vehicles.length - 1] : null;
}

/**
 * Get top 10 busiest stations
 */
export async function getTopBusiestStations(filters: AnalyticsFilters): Promise<StationAnalytics[]> {
  const stations = await getStationAnalytics(filters);
  return stations.slice(0, 10);
}

/**
 * Get top 10 least busy stations
 */
export async function getTopLeastBusyStations(filters: AnalyticsFilters): Promise<StationAnalytics[]> {
  const stations = await getStationAnalytics(filters);
  return stations.slice(-10).reverse();
}

/**
 * Get offline vehicles
 */
export async function getOfflineVehicles(filters: AnalyticsFilters): Promise<VehicleAnalytics[]> {
  const vehicles = await getVehicleAnalytics(filters);
  return vehicles.filter(v => v.status === 'OFFLINE');
}

/**
 * Get average operating hours
 */
export async function getAverageOperatingHours(filters: AnalyticsFilters): Promise<number> {
  const vehicles = await getVehicleAnalytics(filters);
  if (vehicles.length === 0) return 0;
  return vehicles.reduce((sum, v) => sum + v.operatingHours, 0) / vehicles.length;
}

/**
 * Search stations by name or ID
 */
export async function searchStations(query: string, filters: AnalyticsFilters): Promise<StationAnalytics[]> {
  const stations = await getStationAnalytics(filters);
  const lowerQuery = query.toLowerCase();
  return stations.filter(s => 
    s.stationId.toLowerCase().includes(lowerQuery) ||
    s.stationName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search vehicles by number or ID
 */
export async function searchVehicles(query: string, filters: AnalyticsFilters): Promise<VehicleAnalytics[]> {
  const vehicles = await getVehicleAnalytics(filters);
  const lowerQuery = query.toLowerCase();
  return vehicles.filter(v => 
    v.vehicleId.toLowerCase().includes(lowerQuery) ||
    v.vehicleNumber.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search routes by name or ID
 */
export async function searchRoutes(query: string, filters: AnalyticsFilters): Promise<RouteAnalytics[]> {
  const routes = await getRouteAnalytics(filters);
  const lowerQuery = query.toLowerCase();
  return routes.filter(r => 
    r.routeId.toLowerCase().includes(lowerQuery) ||
    r.routeName.toLowerCase().includes(lowerQuery)
  );
}
