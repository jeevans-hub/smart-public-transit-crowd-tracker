/**
 * Capacity Planner
 * 
 * Helps with capacity planning and infrastructure recommendations
 * using existing analytics and prediction engines.
 */

import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import Station from '@/models/Station';
import Route from '@/models/Route';
import Vehicle from '@/models/Vehicle';
import { AnalyticsEngine } from './analyticsEngine';
import { PredictionEngine } from './predictionEngine';

export interface CapacityRecommendation {
  type: 'station' | 'route' | 'fleet' | 'infrastructure';
  entityId: string;
  entityName: string;
  currentCapacity: number;
  projectedDemand: number;
  capacityGap: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  timeframe: string;
}

/**
 * Capacity Planner
 * Generates capacity planning recommendations
 */
export class CapacityPlanner {
  /**
   * Generate capacity recommendations for a city
   */
  public async generateCapacityRecommendations(cityId: string): Promise<CapacityRecommendation[]> {
    const recommendations: CapacityRecommendation[] = [];

    // Get historical data
    const crowdReports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);
    const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);
    const vehicles = await LiveVehicle.find();
    const stations = await Station.find({ active: true });
    const routes = await Route.find({ active: true });

    // Generate station capacity recommendations
    const stationRecs = await this.generateStationRecommendations(stations, crowdReports, predictions);
    recommendations.push(...stationRecs);

    // Generate route capacity recommendations
    const routeRecs = await this.generateRouteRecommendations(routes, crowdReports, predictions);
    recommendations.push(...routeRecs);

    // Generate fleet capacity recommendations
    const fleetRecs = await this.generateFleetRecommendations(vehicles, crowdReports, predictions);
    recommendations.push(...fleetRecs);

    // Generate infrastructure recommendations
    const infraRecs = await this.generateInfrastructureRecommendations(stations, routes, vehicles);
    recommendations.push(...infraRecs);

    return recommendations;
  }

  /**
   * Generate station capacity recommendations
   */
  private async generateStationRecommendations(
    stations: any[],
    crowdReports: any[],
    predictions: any[]
  ): Promise<CapacityRecommendation[]> {
    const recommendations: CapacityRecommendation[] = [];

    const stationAnalytics = AnalyticsEngine.generateStationAnalytics(crowdReports);

    for (const station of stationAnalytics) {
      const stationData = stations.find(s => s._id.toString() === station.stationId);
      if (!stationData) continue;

      const currentCapacity = stationData.platformCount || 1;
      const projectedDemand = Math.round(station.averageOccupancy * 1.2); // 20% growth projection
      const capacityGap = projectedDemand - currentCapacity;

      if (capacityGap > 0) {
        const priority = this.determinePriority(capacityGap, currentCapacity);
        const estimatedCost = capacityGap * 1000000; // $1M per platform
        const timeframe = this.determineTimeframe(priority);

        recommendations.push({
          type: 'station',
          entityId: station.stationId,
          entityName: station.stationName,
          currentCapacity,
          projectedDemand,
          capacityGap,
          recommendation: `Add ${capacityGap} platform(s) to ${station.stationName}`,
          priority,
          estimatedCost,
          timeframe,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate route capacity recommendations
   */
  private async generateRouteRecommendations(
    routes: any[],
    crowdReports: any[],
    predictions: any[]
  ): Promise<CapacityRecommendation[]> {
    const recommendations: CapacityRecommendation[] = [];

    const routeAnalytics = AnalyticsEngine.generateRouteAnalytics(crowdReports, []);

    for (const route of routeAnalytics) {
      const routeData = routes.find(r => r._id.toString() === route.routeId);
      if (!routeData) continue;

      const currentCapacity = routeData.vehicleCount || 1;
      const projectedDemand = Math.round(route.averageOccupancy * 1.15); // 15% growth projection
      const capacityGap = Math.ceil((projectedDemand - currentCapacity) / 10);

      if (capacityGap > 0) {
        const priority = this.determinePriority(capacityGap, currentCapacity);
        const estimatedCost = capacityGap * 500000; // $500K per vehicle
        const timeframe = this.determineTimeframe(priority);

        recommendations.push({
          type: 'route',
          entityId: route.routeId,
          entityName: route.routeName,
          currentCapacity,
          projectedDemand,
          capacityGap,
          recommendation: `Add ${capacityGap} vehicle(s) to ${route.routeName}`,
          priority,
          estimatedCost,
          timeframe,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate fleet capacity recommendations
   */
  private async generateFleetRecommendations(
    vehicles: any[],
    crowdReports: any[],
    predictions: any[]
  ): Promise<CapacityRecommendation[]> {
    const recommendations: CapacityRecommendation[] = [];

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

    const projectedDemand = Math.round(activeVehicles * 1.1); // 10% growth projection
    const capacityGap = projectedDemand - activeVehicles;

    if (capacityGap > 0) {
      const priority = this.determinePriority(capacityGap, totalVehicles);
      const estimatedCost = capacityGap * 200000; // $200K per vehicle
      const timeframe = this.determineTimeframe(priority);

      recommendations.push({
        type: 'fleet',
        entityId: 'fleet',
        entityName: 'Overall Fleet',
        currentCapacity: activeVehicles,
        projectedDemand,
        capacityGap,
        recommendation: `Add ${capacityGap} vehicle(s) to the fleet`,
        priority,
        estimatedCost,
        timeframe,
      });
    }

    // Maintenance capacity recommendation
    if (maintenanceVehicles > totalVehicles * 0.2) {
      recommendations.push({
        type: 'infrastructure',
        entityId: 'maintenance',
        entityName: 'Maintenance Facilities',
        currentCapacity: totalVehicles * 0.2,
        projectedDemand: maintenanceVehicles,
        capacityGap: Math.ceil(maintenanceVehicles - totalVehicles * 0.2),
        recommendation: 'Expand maintenance facilities to handle increased demand',
        priority: 'medium',
        estimatedCost: 2000000,
        timeframe: '6-12 months',
      });
    }

    return recommendations;
  }

  /**
   * Generate infrastructure recommendations
   */
  private async generateInfrastructureRecommendations(
    stations: any[],
    routes: any[],
    vehicles: any[]
  ): Promise<CapacityRecommendation[]> {
    const recommendations: CapacityRecommendation[] = [];

    // Depot capacity
    const totalVehicles = vehicles.length;
    const depotCapacity = Math.ceil(totalVehicles * 1.3); // 30% buffer
    const currentDepotCapacity = Math.ceil(totalVehicles * 1.1);
    const depotGap = depotCapacity - currentDepotCapacity;

    if (depotGap > 0) {
      recommendations.push({
        type: 'infrastructure',
        entityId: 'depot',
        entityName: 'Vehicle Depots',
        currentCapacity: currentDepotCapacity,
        projectedDemand: depotCapacity,
        capacityGap: depotGap,
        recommendation: `Expand depot capacity by ${depotGap} vehicles`,
        priority: 'medium',
        estimatedCost: depotGap * 50000,
        timeframe: '12-18 months',
      });
    }

    // Control center capacity
    const stationCount = stations.length;
    const recommendedControlCenters = Math.ceil(stationCount / 50);
    const currentControlCenters = Math.ceil(stationCount / 60);
    const controlCenterGap = recommendedControlCenters - currentControlCenters;

    if (controlCenterGap > 0) {
      recommendations.push({
        type: 'infrastructure',
        entityId: 'controlcenter',
        entityName: 'Control Centers',
        currentCapacity: currentControlCenters,
        projectedDemand: recommendedControlCenters,
        capacityGap: controlCenterGap,
        recommendation: `Establish ${controlCenterGap} new control center(s)`,
        priority: 'low',
        estimatedCost: controlCenterGap * 5000000,
        timeframe: '18-24 months',
      });
    }

    return recommendations;
  }

  /**
   * Determine priority based on gap and current capacity
   */
  private determinePriority(gap: number, current: number): 'low' | 'medium' | 'high' | 'critical' {
    const percentage = (gap / current) * 100;

    if (percentage > 50) return 'critical';
    if (percentage > 30) return 'high';
    if (percentage > 15) return 'medium';
    return 'low';
  }

  /**
   * Determine timeframe based on priority
   */
  private determineTimeframe(priority: string): string {
    switch (priority) {
      case 'critical':
        return '3-6 months';
      case 'high':
        return '6-12 months';
      case 'medium':
        return '12-18 months';
      case 'low':
        return '18-24 months';
      default:
        return '12-18 months';
    }
  }

  /**
   * Get capacity utilization report
   */
  public async getCapacityUtilizationReport(cityId: string): Promise<any> {
    const crowdReports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);
    const vehicles = await LiveVehicle.find();
    const stations = await Station.find({ active: true });
    const routes = await Route.find({ active: true });

    const stationAnalytics = AnalyticsEngine.generateStationAnalytics(crowdReports);
    const routeAnalytics = AnalyticsEngine.generateRouteAnalytics(crowdReports, vehicles);

    const totalStationCapacity = stations.reduce((sum, s) => sum + (s.platformCount || 1), 0);
    const averageStationUtilization = stationAnalytics.length > 0
      ? stationAnalytics.reduce((sum, s) => sum + s.averageOccupancy, 0) / stationAnalytics.length
      : 0;

    const totalRouteCapacity = routes.reduce((sum, r) => sum + (r.vehicleCount || 1), 0);
    const averageRouteUtilization = routeAnalytics.length > 0
      ? routeAnalytics.reduce((sum, r) => sum + r.averageOccupancy, 0) / routeAnalytics.length
      : 0;

    const totalFleetCapacity = vehicles.length;
    const activeFleetCapacity = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const fleetUtilization = totalFleetCapacity > 0 ? (activeFleetCapacity / totalFleetCapacity) * 100 : 0;

    return {
      stations: {
        totalCapacity: totalStationCapacity,
        averageUtilization: averageStationUtilization,
        criticalStations: stationAnalytics.filter(s => s.averageOccupancy > 90).length,
      },
      routes: {
        totalCapacity: totalRouteCapacity,
        averageUtilization: averageRouteUtilization,
        criticalRoutes: routeAnalytics.filter(r => r.averageOccupancy > 90).length,
      },
      fleet: {
        totalCapacity: totalFleetCapacity,
        activeCapacity: activeFleetCapacity,
        utilization: fleetUtilization,
      },
      overall: {
        averageUtilization: (averageStationUtilization + averageRouteUtilization + fleetUtilization) / 3,
      },
    };
  }
}

export const capacityPlanner = new CapacityPlanner();
