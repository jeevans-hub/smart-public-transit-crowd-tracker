export type DateRange = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';

export interface DateRangeFilter {
  range: DateRange;
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRangeFilter;
  stationId?: string;
  routeId?: string;
  vehicleId?: string;
  status?: string;
  predictionWindow?: '15' | '30' | '60';
}

export interface KPIMetrics {
  totalStations: number;
  totalVehicles: number;
  passengersToday: number;
  passengersThisWeek: number;
  passengersThisMonth: number;
  averageCrowd: number;
  averagePredictionAccuracy: number;
  criticalAlerts: number;
  averageVehicleSpeed: number;
  averageOccupancy: number;
  averageDelay: number;
  systemAvailability: number;
}

export interface TrendData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface PassengerTrend {
  date: Date;
  count: number;
  occupancy: number;
}

export interface OccupancyTrend {
  timestamp: Date;
  occupancy: number;
  stationId?: string;
  routeId?: string;
}

export interface VehicleTrend {
  timestamp: Date;
  activeVehicles: number;
  averageSpeed: number;
  averageOccupancy: number;
}

export interface PredictionTrend {
  timestamp: Date;
  accuracy: number;
  confidence: number;
  riskLevel: string;
}

export interface AlertTrend {
  timestamp: Date;
  count: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface HeatmapData {
  stationId: string;
  stationName: string;
  hour: number;
  dayOfWeek: number;
  occupancy: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface StationAnalytics {
  stationId: string;
  stationName: string;
  averageOccupancy: number;
  maxOccupancy: number;
  minOccupancy: number;
  totalReports: number;
  averageWaitingPassengers: number;
  peakHour: number;
  peakDay: string;
  rank: number;
}

export interface RouteAnalytics {
  routeId: string;
  routeName: string;
  averageOccupancy: number;
  maxOccupancy: number;
  minOccupancy: number;
  totalReports: number;
  efficiency: number;
  averageSpeed: number;
  averageDelay: number;
  rank: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleNumber: string;
  routeId: string;
  averageOccupancy: number;
  maxOccupancy: number;
  totalTrips: number;
  operatingHours: number;
  averageSpeed: number;
  utilizationRate: number;
  status: string;
  rank: number;
}

export interface RoutePerformance {
  routeId: string;
  routeName: string;
  efficiency: number;
  onTimeRate: number;
  averageDelay: number;
  passengerSatisfaction: number;
  costEfficiency: number;
}

export interface VehicleUtilization {
  vehicleId: string;
  vehicleNumber: string;
  utilizationRate: number;
  operatingHours: number;
  idleTime: number;
  tripsCompleted: number;
  averageOccupancy: number;
}

export interface PeakHourAnalysis {
  hour: number;
  dayOfWeek: string;
  averageOccupancy: number;
  passengerCount: number;
  vehicleCount: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DemandForecast {
  date: Date;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  recommendedActions: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'DISPATCH' | 'FREQUENCY' | 'REDUCE_SERVICE' | 'CONGESTION' | 'OPTIMIZATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  targetId?: string;
  targetName?: string;
  expectedImpact: string;
  confidence: number;
  generatedAt: Date;
  status: 'PENDING' | 'IMPLEMENTED' | 'DISMISSED';
}

export interface ExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV';
  dateRange: DateRangeFilter;
  includeCharts: boolean;
  includeRawData: boolean;
  sections: ExportSection[];
}

export type ExportSection = 
  | 'OVERVIEW'
  | 'KPI'
  | 'TRENDS'
  | 'STATIONS'
  | 'ROUTES'
  | 'VEHICLES'
  | 'PEAK_HOURS'
  | 'RECOMMENDATIONS';

export interface AnalyticsOverview {
  kpi: KPIMetrics;
  passengerTrend: PassengerTrend[];
  occupancyTrend: OccupancyTrend[];
  vehicleTrend: VehicleTrend[];
  predictionTrend: PredictionTrend[];
  alertTrend: AlertTrend[];
  topStations: StationAnalytics[];
  topRoutes: RouteAnalytics[];
  topVehicles: VehicleAnalytics[];
  recommendations: AIRecommendation[];
}

export interface HistoricalAnalytics {
  period: DateRange;
  startDate: Date;
  endDate: Date;
  totalReports: number;
  averageOccupancy: number;
  maxOccupancy: number;
  minOccupancy: number;
  peakHour: number;
  peakDay: string;
  totalPassengers: number;
  uniqueStations: number;
  uniqueRoutes: number;
  uniqueVehicles: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data?: AnalyticsOverview;
  error?: string;
}
