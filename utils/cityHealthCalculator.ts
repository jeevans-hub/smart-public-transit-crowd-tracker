/**
 * City Health Calculator
 * 
 * Calculates overall Smart City Health Score including:
 * - Overall Transit Health Score
 * - Passenger Flow Index
 * - Fleet Availability
 * - Operational Efficiency
 * - AI Prediction Accuracy
 * - System Reliability
 * - Incident Severity Index
 * - Resource Utilization
 * - Infrastructure Health
 */

import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import Station from '@/models/Station';
import Route from '@/models/Route';
import Vehicle from '@/models/Vehicle';
import SystemHealth, { ISystemHealthDocument } from '@/models/SystemHealth';
import { calculateAverageOccupancy, calculateCrowdDistribution } from './crowdCalculator';
import { FleetHealthCalculator } from './fleetHealthCalculator';
import { calculateKPIMetrics } from './kpiCalculator';

export interface CityHealthMetrics {
  overallHealthScore: number;
  passengerFlowIndex: number;
  fleetAvailability: number;
  operationalEfficiency: number;
  predictionAccuracy: number;
  systemReliability: number;
  incidentSeverityIndex: number;
  resourceUtilization: number;
  infrastructureHealth: number;
}

/**
 * City Health Calculator
 * Calculates comprehensive health metrics for a city
 */
export class CityHealthCalculator {
  /**
   * Calculate complete city health
   */
  public async calculateCityHealth(cityId: string): Promise<ISystemHealthDocument | null> {
    const [
      passengerFlowIndex,
      fleetAvailability,
      operationalEfficiency,
      predictionAccuracy,
      systemReliability,
      incidentSeverityIndex,
      resourceUtilization,
      infrastructureHealth,
      details,
    ] = await Promise.all([
      this.calculatePassengerFlowIndex(cityId),
      this.calculateFleetAvailability(cityId),
      this.calculateOperationalEfficiency(cityId),
      this.calculatePredictionAccuracy(cityId),
      this.calculateSystemReliability(cityId),
      this.calculateIncidentSeverityIndex(cityId),
      this.calculateResourceUtilization(cityId),
      this.calculateInfrastructureHealth(cityId),
      this.calculateDetails(cityId),
    ]);

    // Calculate overall health score (weighted average)
    const overallHealthScore = this.calculateOverallHealthScore({
      passengerFlowIndex,
      fleetAvailability,
      operationalEfficiency,
      predictionAccuracy,
      systemReliability,
      incidentSeverityIndex: 100 - incidentSeverityIndex, // Invert severity
      resourceUtilization,
      infrastructureHealth,
    });

    // Create or update system health record
    const systemHealth = await SystemHealth.findOneAndUpdate(
      { cityId },
      {
        cityId,
        timestamp: new Date(),
        overallHealthScore,
        passengerFlowIndex,
        fleetAvailability,
        operationalEfficiency,
        predictionAccuracy,
        systemReliability,
        incidentSeverityIndex,
        resourceUtilization,
        infrastructureHealth,
        details,
      },
      { upsert: true, new: true }
    );

    return systemHealth;
  }

  /**
   * Calculate passenger flow index
   */
  private async calculatePassengerFlowIndex(cityId: string): Promise<number> {
    const reports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);
    
    if (reports.length === 0) return 0;

    // Calculate based on passenger flow patterns
    const totalPassengers = reports.reduce((sum, r) => sum + r.passengerCount, 0);
    const averagePassengers = totalPassengers / reports.length;
    const flowVariability = this.calculateVariability(reports.map(r => r.passengerCount));

    // Higher score for consistent, optimal flow
    const flowScore = Math.min(100, (averagePassengers / 100) * 100);
    const consistencyScore = Math.max(0, 100 - flowVariability);

    return (flowScore + consistencyScore) / 2;
  }

  /**
   * Calculate fleet availability
   */
  private async calculateFleetAvailability(cityId: string): Promise<number> {
    const vehicles = await LiveVehicle.find();
    const allVehicles = await Vehicle.find();

    if (allVehicles.length === 0) return 0;

    const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const availability = (activeVehicles / allVehicles.length) * 100;

    return availability;
  }

  /**
   * Calculate operational efficiency
   */
  private async calculateOperationalEfficiency(cityId: string): Promise<number> {
    const vehicles = await LiveVehicle.find();
    const reports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);

    if (vehicles.length === 0) return 0;

    // Calculate based on on-time performance and route efficiency
    const onTimeVehicles = vehicles.filter(v => v.status !== 'DELAYED').length;
    const onTimeRate = (onTimeVehicles / vehicles.length) * 100;

    // Calculate route efficiency from crowd reports
    const averageOccupancy = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.occupancyPercentage, 0) / reports.length
      : 0;
    const occupancyEfficiency = averageOccupancy > 30 && averageOccupancy < 80 ? 100 : 
      averageOccupancy > 80 ? 70 : 50;

    return (onTimeRate + occupancyEfficiency) / 2;
  }

  /**
   * Calculate prediction accuracy
   */
  private async calculatePredictionAccuracy(cityId: string): Promise<number> {
    const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);

    if (predictions.length === 0) return 0;

    // Calculate average confidence from predictions
    const totalConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0), 0);
    const averageConfidence = totalConfidence / predictions.length;

    return averageConfidence * 100;
  }

  /**
   * Calculate system reliability
   */
  private async calculateSystemReliability(cityId: string): Promise<number> {
    const stations = await Station.find({ active: true });
    const allStations = await Station.find();
    const routes = await Route.find({ active: true });
    const allRoutes = await Route.find();

    if (allStations.length === 0) return 0;

    const stationReliability = (stations.length / allStations.length) * 100;
    const routeReliability = allRoutes.length > 0 ? (routes.length / allRoutes.length) * 100 : 100;

    return (stationReliability + routeReliability) / 2;
  }

  /**
   * Calculate incident severity index
   */
  private async calculateIncidentSeverityIndex(cityId: string): Promise<number> {
    const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);

    if (predictions.length === 0) return 0;

    // Calculate based on high-risk predictions
    const highRiskCount = predictions.filter(p => 
      p.risk === 'HIGH' || p.risk === 'CRITICAL'
    ).length;
    const severityIndex = (highRiskCount / predictions.length) * 100;

    return severityIndex;
  }

  /**
   * Calculate resource utilization
   */
  private async calculateResourceUtilization(cityId: string): Promise<number> {
    const vehicles = await LiveVehicle.find();
    const reports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);

    if (vehicles.length === 0) return 0;

    // Calculate vehicle utilization
    const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const vehicleUtilization = vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0;

    // Calculate capacity utilization
    const averageOccupancy = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.occupancyPercentage, 0) / reports.length
      : 0;

    return (vehicleUtilization + averageOccupancy) / 2;
  }

  /**
   * Calculate infrastructure health
   */
  private async calculateInfrastructureHealth(cityId: string): Promise<number> {
    const stations = await Station.find({ active: true });
    const allStations = await Station.find();

    if (allStations.length === 0) return 0;

    // Calculate based on active infrastructure
    const infrastructureHealth = (stations.length / allStations.length) * 100;

    return infrastructureHealth;
  }

  /**
   * Calculate detailed metrics
   */
  private async calculateDetails(cityId: string) {
    const stations = await Station.find();
    const activeStations = await Station.find({ active: true });
    const vehicles = await LiveVehicle.find();
    const allVehicles = await Vehicle.find();
    const routes = await Route.find();
    const activeRoutes = await Route.find({ active: true });
    const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);
    const reports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);

    const totalIncidents = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL').length;
    const activeIncidents = predictions.filter(p => 
      (p.risk === 'HIGH' || p.risk === 'CRITICAL') && 
      new Date(p.generatedAt) > new Date(Date.now() - 3600000)
    ).length;

    const averageDelay = vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.status === 'DELAYED' ? 5 : 0), 0) / vehicles.length
      : 0;

    const averageOccupancy = reports.length > 0
      ? reports.reduce((sum, r) => sum + r.occupancyPercentage, 0) / reports.length
      : 0;

    const averageSpeed = vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / vehicles.length
      : 0;

    return {
      totalStations: stations.length,
      activeStations: activeStations.length,
      totalVehicles: allVehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length,
      totalRoutes: routes.length,
      activeRoutes: activeRoutes.length,
      totalIncidents,
      activeIncidents,
      averageDelay,
      averageOccupancy,
      averageSpeed,
    };
  }

  /**
   * Calculate overall health score (weighted average)
   */
  private calculateOverallHealthScore(metrics: Omit<CityHealthMetrics, 'overallHealthScore'>): number {
    const weights = {
      passengerFlowIndex: 0.15,
      fleetAvailability: 0.15,
      operationalEfficiency: 0.20,
      predictionAccuracy: 0.10,
      systemReliability: 0.15,
      incidentSeverityIndex: 0.10,
      resourceUtilization: 0.10,
      infrastructureHealth: 0.05,
    };

    const weightedSum = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (metrics[key as keyof typeof metrics] * weight);
    }, 0);

    return Math.min(100, Math.max(0, weightedSum));
  }

  /**
   * Calculate variability (standard deviation)
   */
  private calculateVariability(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDifferences = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDifferences.reduce((sum, v) => sum + v, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return (standardDeviation / mean) * 100; // Coefficient of variation
  }

  /**
   * Get health trend for a city
   */
  public async getHealthTrend(cityId: string, days: number = 7): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const healthRecords = await SystemHealth.find({
      cityId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    return healthRecords.map(record => ({
      timestamp: record.timestamp,
      overallHealthScore: record.overallHealthScore,
      passengerFlowIndex: record.passengerFlowIndex,
      fleetAvailability: record.fleetAvailability,
      operationalEfficiency: record.operationalEfficiency,
    }));
  }
}

export const cityHealthCalculator = new CityHealthCalculator();
