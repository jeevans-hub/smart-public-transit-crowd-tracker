/**
 * Digital Twin Types
 * 
 * Type definitions for the Smart City Digital Twin Platform
 * including cities, regions, control centers, and system health
 */

import { ICrowdReportDocument } from './crowd';
import { ILiveVehicleDocument } from './vehicle';
import { IPredictionDocument } from './prediction';

// City Types
export interface City {
  _id: string;
  cityName: string;
  cityCode: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  population: number;
  area: number;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCityDTO {
  cityName: string;
  cityCode: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  population: number;
  area: number;
  description?: string;
  active?: boolean;
}

export interface UpdateCityDTO {
  cityName?: string;
  cityCode?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  area?: number;
  description?: string;
  active?: boolean;
}

// Transit Region Types
export interface TransitRegion {
  _id: string;
  cityId: string;
  regionName: string;
  regionCode: string;
  regionType: 'downtown' | 'suburban' | 'rural' | 'industrial' | 'airport' | 'university';
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransitRegionDTO {
  cityId: string;
  regionName: string;
  regionCode: string;
  regionType: 'downtown' | 'suburban' | 'rural' | 'industrial' | 'airport' | 'university';
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description?: string;
  active?: boolean;
}

export interface UpdateTransitRegionDTO {
  cityId?: string;
  regionName?: string;
  regionCode?: string;
  regionType?: 'downtown' | 'suburban' | 'rural' | 'industrial' | 'airport' | 'university';
  boundaries?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description?: string;
  active?: boolean;
}

// Control Center Types
export interface ControlCenter {
  _id: string;
  cityId: string;
  centerName: string;
  centerCode: string;
  centerType: 'main' | 'regional' | 'depot' | 'emergency';
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  regionIds: string[];
  agencyIds: string[];
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateControlCenterDTO {
  cityId: string;
  centerName: string;
  centerCode: string;
  centerType: 'main' | 'regional' | 'depot' | 'emergency';
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  regionIds: string[];
  agencyIds: string[];
  description?: string;
  active?: boolean;
}

export interface UpdateControlCenterDTO {
  cityId?: string;
  centerName?: string;
  centerCode?: string;
  centerType?: 'main' | 'regional' | 'depot' | 'emergency';
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  regionIds?: string[];
  agencyIds?: string[];
  description?: string;
  active?: boolean;
}

// System Health Types
export interface SystemHealth {
  _id: string;
  cityId: string;
  timestamp: Date;
  overallHealthScore: number;
  passengerFlowIndex: number;
  fleetAvailability: number;
  operationalEfficiency: number;
  predictionAccuracy: number;
  systemReliability: number;
  incidentSeverityIndex: number;
  resourceUtilization: number;
  infrastructureHealth: number;
  details: {
    totalStations: number;
    activeStations: number;
    totalVehicles: number;
    activeVehicles: number;
    totalRoutes: number;
    activeRoutes: number;
    totalIncidents: number;
    activeIncidents: number;
    averageDelay: number;
    averageOccupancy: number;
    averageSpeed: number;
  };
  createdAt: Date;
}

export interface CreateSystemHealthDTO {
  cityId: string;
  overallHealthScore: number;
  passengerFlowIndex: number;
  fleetAvailability: number;
  operationalEfficiency: number;
  predictionAccuracy: number;
  systemReliability: number;
  incidentSeverityIndex: number;
  resourceUtilization: number;
  infrastructureHealth: number;
  details: {
    totalStations: number;
    activeStations: number;
    totalVehicles: number;
    activeVehicles: number;
    totalRoutes: number;
    activeRoutes: number;
    totalIncidents: number;
    activeIncidents: number;
    averageDelay: number;
    averageOccupancy: number;
    averageSpeed: number;
  };
}

// Digital Twin State
export interface DigitalTwinState {
  selectedCity: City | null;
  selectedRegion: TransitRegion | null;
  selectedControlCenter: ControlCenter | null;
  cities: City[];
  regions: TransitRegion[];
  controlCenters: ControlCenter[];
  systemHealth: SystemHealth | null;
  networkGraph: NetworkNode[];
  fleetDistribution: FleetDistribution;
  cityComparison: CityComparisonData[];
  simulation: SimulationState | null;
  aiInsights: AIInsight[];
  recommendations: ResourceRecommendation[];
}

// Network Graph Types
export interface NetworkNode {
  id: string;
  type: 'station' | 'vehicle' | 'route' | 'controlCenter' | 'depot';
  name: string;
  position: { x: number; y: number };
  data: {
    occupancy?: number;
    status?: string;
    connections?: number;
    passengerFlow?: number;
  };
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: 'route' | 'connection' | 'dependency';
  weight: number;
  data: {
    passengerFlow?: number;
    distance?: number;
    travelTime?: number;
  };
}

// Fleet Distribution
export interface FleetDistribution {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  maintenanceVehicles: number;
  byRegion: {
    regionId: string;
    regionName: string;
    count: number;
    percentage: number;
  }[];
  byControlCenter: {
    centerId: string;
    centerName: string;
    count: number;
    percentage: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

// City Comparison
export interface CityComparisonData {
  cityId: string;
  cityName: string;
  passengerVolume: number;
  fleetSize: number;
  averageOccupancy: number;
  averageDelay: number;
  predictionAccuracy: number;
  incidents: number;
  fleetHealth: number;
  operationalEfficiency: number;
  averageSpeed: number;
  systemAvailability: number;
  healthScore: number;
}

// Simulation
export interface SimulationState {
  id: string;
  type: 'passengerSurge' | 'vehicleBreakdown' | 'stationClosure' | 'emergencyIncident' | 'weatherImpact' | 'routeDiversion' | 'fleetExpansion' | 'peakHour';
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  parameters: SimulationParameters;
  results: SimulationResults;
}

export interface SimulationParameters {
  scenario: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  affectedEntities: {
    stations?: string[];
    vehicles?: string[];
    routes?: string[];
    regions?: string[];
  };
  customParams?: Record<string, any>;
}

export interface SimulationResults {
  predictedCrowd: number[];
  vehicleImpact: {
    affectedVehicles: number;
    delayedVehicles: number;
    reroutedVehicles: number;
  };
  routeImpact: {
    affectedRoutes: number;
    delayedRoutes: number;
    alternativeRoutes: number;
  };
  delay: {
    averageDelay: number;
    maxDelay: number;
    totalDelay: number;
  };
  recommendations: string[];
  timestamp: Date;
}

// AI Insights
export interface AIInsight {
  id: string;
  type: 'risk' | 'capacity' | 'infrastructure' | 'fleet' | 'passenger' | 'emergency' | 'budget' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  affectedEntities: {
    type: 'city' | 'region' | 'station' | 'route' | 'vehicle';
    id: string;
    name: string;
  }[];
  metrics: {
    current: number;
    predicted: number;
    threshold: number;
  };
  validUntil: Date;
  createdAt: Date;
}

// Resource Recommendations
export interface ResourceRecommendation {
  id: string;
  type: 'vehicleRedistribution' | 'fleetDeployment' | 'routeBalancing' | 'emergencyAllocation' | 'maintenanceScheduling' | 'driverAllocation' | 'passengerRedistribution';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reason: string;
  action: string;
  estimatedImpact: {
    improvement: number;
    metric: string;
    timeframe: string;
  };
  affectedEntities: {
    type: 'city' | 'region' | 'station' | 'route' | 'vehicle' | 'controlCenter';
    id: string;
    name: string;
  }[];
  resources: {
    type: string;
    quantity: number;
    currentLocation: string;
    targetLocation: string;
  }[];
  cost: number;
  confidence: number;
  validUntil: Date;
  createdAt: Date;
}

// Digital Twin Filters
export interface DigitalTwinFilters {
  cityId?: string;
  regionId?: string;
  controlCenterId?: string;
  stationId?: string;
  vehicleId?: string;
  routeId?: string;
  incidentId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  healthScoreRange?: {
    min: number;
    max: number;
  };
}

// Digital Twin Search
export interface DigitalTwinSearch {
  query: string;
  type?: 'city' | 'region' | 'station' | 'vehicle' | 'route' | 'incident' | 'controlCenter';
  filters?: DigitalTwinFilters;
}

// Report Types
export interface ReportConfig {
  type: 'smartCity' | 'executive' | 'regional' | 'fleet' | 'infrastructure' | 'digitalTwin';
  format: 'pdf' | 'excel' | 'csv';
  cityId?: string;
  regionId?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeSections: string[];
  customFields?: Record<string, any>;
}

export interface ReportData {
  id: string;
  type: string;
  format: string;
  generatedAt: Date;
  data: any;
  metadata: {
    cityId?: string;
    regionId?: string;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}
