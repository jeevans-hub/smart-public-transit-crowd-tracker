import { DateRange as AnalyticsDateRange, DateRangeFilter } from './analytics';

export type DateRange = AnalyticsDateRange;

export type MaintenanceRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenancePriority = 'ROUTINE' | 'SCHEDULED' | 'URGENT' | 'EMERGENCY';
export type MaintenanceStatus = 'NONE' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export interface MaintenancePrediction {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  riskLevel: MaintenanceRiskLevel;
  riskPercentage: number;
  priority: MaintenancePriority;
  estimatedDaysRemaining: number;
  recommendedAction: string;
  factors: {
    vehicleAge: number;
    operatingHours: number;
    utilizationRate: number;
    averageSpeed: number;
    offlineFrequency: number;
    historicalDelay: number;
    passengerLoad: number;
  };
  confidence: number;
  generatedAt: Date;
}

export interface FleetHealthMetrics {
  fleetHealthScore: number;
  healthyVehicles: number;
  maintenanceRequired: number;
  criticalVehicles: number;
  offlineVehicles: number;
  operationalAvailability: number;
  totalVehicles: number;
}

export interface VehicleHealthData {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  route: string;
  status: string;
  healthScore: number;
  maintenanceRisk: MaintenanceRiskLevel;
  utilizationRate: number;
  operatingHours: number;
  lastMaintenanceDate?: Date;
  predictedMaintenanceDate?: Date;
}

export interface RouteOptimizationAnalysis {
  routeId: string;
  routeName: string;
  currentVehicles: number;
  recommendedVehicles: number;
  averageOccupancy: number;
  peakOccupancy: number;
  averageSpeed: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  expectedBenefit: string;
  confidence: number;
}

export interface DelayPrediction {
  vehicleId: string;
  vehicleNumber: string;
  route: string;
  currentStation?: string;
  nextStation?: string;
  predictedDelay: number;
  delayProbability: number;
  delayRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: {
    trafficRisk: number;
    stationCongestion: number;
    weatherImpact: number;
    historicalDelay: number;
  };
  confidence: number;
  estimatedArrivalTime: Date;
}

export interface CostAnalysis {
  routeId: string;
  routeName: string;
  costPerRoute: number;
  costPerPassenger: number;
  vehicleUtilizationCost: number;
  idleCost: number;
  fuelEfficiencyEstimate: number;
  operatingEfficiency: number;
  totalCost: number;
  passengerCount: number;
}

export interface OperationsRecommendation {
  id: string;
  type: 'DISPATCH' | 'MAINTENANCE' | 'REDISTRIBUTION' | 'FREQUENCY' | 'ROUTE_CHANGE' | 'OPTIMIZATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  description: string;
  reason: string;
  confidence: number;
  expectedBenefit: string;
  targetId?: string;
  targetName?: string;
  generatedAt: Date;
  status: 'PENDING' | 'IMPLEMENTED' | 'DISMISSED';
}

export interface OperationalInsights {
  totalRecommendations: number;
  urgentActions: number;
  scheduledMaintenance: number;
  fleetEfficiency: number;
  onTimePerformance: number;
  costEfficiency: number;
  peakHours: {
    hour: number;
    averageOccupancy: number;
  }[];
  bottlenecks: string[];
}

export interface OperationsFilters {
  dateRange: DateRangeFilter;
  vehicleId?: string;
  routeId?: string;
  stationId?: string;
  riskLevel?: MaintenanceRiskLevel;
  maintenanceStatus?: MaintenanceStatus;
  delayStatus?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface FleetEfficiencyData {
  date: Date;
  efficiency: number;
  utilization: number;
  onTimeRate: number;
  costPerPassenger: number;
}

export interface MaintenanceSchedule {
  vehicleId: string;
  vehicleNumber: string;
  scheduledDate: Date;
  maintenanceType: string;
  priority: MaintenancePriority;
  estimatedDuration: number;
  status: MaintenanceStatus;
}

export interface OperationsOverview {
  fleetHealth: FleetHealthMetrics;
  maintenancePredictions: MaintenancePrediction[];
  vehicleHealth: VehicleHealthData[];
  routeOptimizations: RouteOptimizationAnalysis[];
  delayPredictions: DelayPrediction[];
  costAnalysis: CostAnalysis[];
  recommendations: OperationsRecommendation[];
  insights: OperationalInsights;
  fleetEfficiency: FleetEfficiencyData[];
  maintenanceSchedule: MaintenanceSchedule[];
}

export interface OperationsResponse {
  success: boolean;
  data?: OperationsOverview;
  error?: string;
}

export interface ExportOperationsOptions {
  format: 'PDF' | 'EXCEL' | 'CSV';
  dateRange: DateRangeFilter;
  includeMaintenance: boolean;
  includeRecommendations: boolean;
  includeCostAnalysis: boolean;
  includeFleetHealth: boolean;
}