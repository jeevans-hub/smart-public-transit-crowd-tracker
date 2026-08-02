/**
 * City Aggregator
 * 
 * Aggregates data from existing modules (crowd monitoring, vehicle tracking,
 * predictions, analytics, operations) for digital twin visualization.
 */

import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import Station from '@/models/Station';
import Route from '@/models/Route';
import Vehicle from '@/models/Vehicle';
import Agency from '@/models/Agency';
import { cityHealthCalculator } from './cityHealthCalculator';

export interface CityAggregatedData {
  cityId: string;
  totalPassengers: number;
  totalVehicles: number;
  activeVehicles: number;
  totalStations: number;
  activeStations: number;
  totalRoutes: number;
  activeRoutes: number;
  totalAgencies: number;
  averageOccupancy: number;
  averageDelay: number;
  totalPredictions: number;
  highRiskPredictions: number;
  systemHealthScore: number;
}

/**
 * City Aggregator
 * Aggregates data from all existing modules for a city
 */
export class CityAggregator {
  /**
   * Aggregate complete city data
   */
  public async aggregateCityData(cityId: string): Promise<CityAggregatedData> {
    const [
      crowdData,
      vehicleData,
      stationData,
      routeData,
      agencyData,
      predictionData,
      systemHealth,
    ] = await Promise.all([
      this.aggregateCrowdData(cityId),
      this.aggregateVehicleData(cityId),
      this.aggregateStationData(cityId),
      this.aggregateRouteData(cityId),
      this.aggregateAgencyData(cityId),
      this.aggregatePredictionData(cityId),
      cityHealthCalculator.calculateCityHealth(cityId),
    ]);

    return {
      cityId,
      totalPassengers: crowdData.totalPassengers,
      totalVehicles: vehicleData.totalVehicles,
      activeVehicles: vehicleData.activeVehicles,
      totalStations: stationData.totalStations,
      activeStations: stationData.activeStations,
      totalRoutes: routeData.totalRoutes,
      activeRoutes: routeData.activeRoutes,
      totalAgencies: agencyData.totalAgencies,
      averageOccupancy: crowdData.averageOccupancy,
      averageDelay: vehicleData.averageDelay,
      totalPredictions: predictionData.totalPredictions,
      highRiskPredictions: predictionData.highRiskPredictions,
      systemHealthScore: systemHealth?.overallHealthScore || 0,
    };
  }

  /**
   * Aggregate crowd data
   */
  private async aggregateCrowdData(cityId: string) {
    const reports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);

    const totalPassengers = reports.reduce((sum, report) => sum + report.passengerCount, 0);
    const averageOccupancy = reports.length > 0
      ? reports.reduce((sum, report) => sum + report.occupancyPercentage, 0) / reports.length
      : 0;

    return {
      totalPassengers,
      averageOccupancy,
    };
  }

  /**
   * Aggregate vehicle data
   */
  private async aggregateVehicleData(cityId: string) {
    const vehicles = await LiveVehicle.find();
    const allVehicles = await Vehicle.find();

    const totalVehicles = allVehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const averageDelay = vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.status === 'DELAYED' ? 5 : 0), 0) / vehicles.length
      : 0;

    return {
      totalVehicles,
      activeVehicles,
      averageDelay,
    };
  }

  /**
   * Aggregate station data
   */
  private async aggregateStationData(cityId: string) {
    const stations = await Station.find({ active: true });
    const allStations = await Station.find();

    return {
      totalStations: allStations.length,
      activeStations: stations.length,
    };
  }

  /**
   * Aggregate route data
   */
  private async aggregateRouteData(cityId: string) {
    const routes = await Route.find({ active: true });
    const allRoutes = await Route.find();

    return {
      totalRoutes: allRoutes.length,
      activeRoutes: routes.length,
    };
  }

  /**
   * Aggregate agency data
   */
  private async aggregateAgencyData(cityId: string) {
    const agencies = await Agency.find({ active: true });

    return {
      totalAgencies: agencies.length,
    };
  }

  /**
   * Aggregate prediction data
   */
  private async aggregatePredictionData(cityId: string) {
    const predictions = await PredictionHistory.find()
      .sort({ createdAt: -1 })
      .limit(1000);

    const totalPredictions = predictions.length;
    const highRiskPredictions = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL').length;

    return {
      totalPredictions,
      highRiskPredictions,
    };
  }

  /**
   * Aggregate regional data for a city
   */
  public async aggregateRegionalData(cityId: string, regionId: string) {
    // This would filter data by region
    // For now, return city-level data
    return this.aggregateCityData(cityId);
  }

  /**
   * Aggregate control center data
   */
  public async aggregateControlCenterData(controlCenterId: string) {
    // This would aggregate data specific to a control center
    // For now, return empty data
    return {
      controlCenterId,
      totalVehicles: 0,
      activeVehicles: 0,
      totalStations: 0,
      activeStations: 0,
    };
  }
}

export const cityAggregator = new CityAggregator();
