/**
 * Resource Allocator
 * 
 * Automatically recommends vehicle redistribution, fleet deployment,
 * route balancing, emergency resource allocation, maintenance scheduling,
 * driver allocation, and passenger redistribution using existing analytics
 * and AI prediction engines.
 */

import LiveVehicle from '@/models/LiveVehicle';
import Vehicle from '@/models/Vehicle';
import Station from '@/models/Station';
import CrowdReport from '@/models/CrowdReport';
import PredictionHistory from '@/models/PredictionHistory';
import ControlCenter from '@/models/ControlCenter';
import TransitRegion from '@/models/TransitRegion';
import { FleetDistribution, ResourceRecommendation } from '@/types/digitalTwin';
import { AnalyticsEngine } from './analyticsEngine';
import { generateRecommendations } from './recommendationEngine';

/**
 * Resource Allocator
 * Generates dynamic resource recommendations using existing engines
 */
export class ResourceAllocator {
  /**
   * Calculate fleet distribution across regions and control centers
   */
  public async calculateFleetDistribution(cityId: string): Promise<FleetDistribution> {
    const vehicles = await LiveVehicle.find();
    const allVehicles = await Vehicle.find();
    const controlCenters = await ControlCenter.find({ cityId, active: true });
    const regions = await TransitRegion.find({ cityId, active: true });

    const totalVehicles = allVehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
    const inactiveVehicles = vehicles.filter(v => v.status === 'OFFLINE').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'DELAYED').length;

    // Distribution by region
    const byRegion = regions.map(region => {
      const regionVehicles = vehicles.filter(v => 
        v.latitude >= region.boundaries.south &&
        v.latitude <= region.boundaries.north &&
        v.longitude >= region.boundaries.west &&
        v.longitude <= region.boundaries.east
      );
      const count = regionVehicles.length;
      const percentage = totalVehicles > 0 ? (count / totalVehicles) * 100 : 0;

      return {
        regionId: region._id.toString(),
        regionName: region.regionName,
        count,
        percentage,
      };
    });

    // Distribution by control center
    const byControlCenter = controlCenters.map(center => {
      const centerVehicles = vehicles.filter(v => 
        v.latitude >= center.latitude - 0.05 &&
        v.latitude <= center.latitude + 0.05 &&
        v.longitude >= center.longitude - 0.05 &&
        v.longitude <= center.longitude + 0.05
      );
      const count = centerVehicles.length;
      const percentage = totalVehicles > 0 ? (count / totalVehicles) * 100 : 0;

      return {
        centerId: center._id.toString(),
        centerName: center.centerName,
        count,
        percentage,
      };
    });

    // Distribution by type
    const byType = [
      { type: 'bus', count: 0, percentage: 0 },
      { type: 'metro', count: 0, percentage: 0 },
      { type: 'train', count: 0, percentage: 0 },
    ];

    return {
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      byRegion,
      byControlCenter,
      byType,
    };
  }

  /**
   * Generate resource recommendations
   */
  public async generateRecommendations(cityId: string): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    // Get existing analytics and predictions
    const crowdReports = await CrowdReport.find().sort({ createdAt: -1 }).limit(1000);
    const predictions = await PredictionHistory.find().sort({ createdAt: -1 }).limit(1000);
    const vehicles = await LiveVehicle.find();

    // Generate vehicle redistribution recommendations
    const vehicleRecs = await this.generateVehicleRedistribution(crowdReports, vehicles);
    recommendations.push(...vehicleRecs);

    // Generate fleet deployment recommendations
    const fleetRecs = await this.generateFleetDeployment(predictions, vehicles);
    recommendations.push(...fleetRecs);

    // Generate route balancing recommendations
    const routeRecs = await this.generateRouteBalancing(crowdReports);
    recommendations.push(...routeRecs);

    // Generate emergency allocation recommendations
    const emergencyRecs = await this.generateEmergencyAllocation(predictions);
    recommendations.push(...emergencyRecs);

    // Generate maintenance scheduling recommendations
    const maintenanceRecs = await this.generateMaintenanceScheduling(vehicles);
    recommendations.push(...maintenanceRecs);

    return recommendations;
  }

  /**
   * Generate vehicle redistribution recommendations
   */
  private async generateVehicleRedistribution(
    crowdReports: any[],
    vehicles: any[]
  ): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    // Use existing analytics engine to identify crowded stations
    const crowdedStations = AnalyticsEngine.generateStationAnalytics(crowdReports)
      .filter(station => station.averageOccupancy > 80)
      .slice(0, 5);

    for (const station of crowdedStations) {
      const availableVehicles = vehicles.filter(v => (v.status === 'MOVING' || v.status === 'STOPPED') && (v.currentPassengers / v.capacity) * 100 < 50);
      
      if (availableVehicles.length > 0) {
        recommendations.push({
          id: `vehicle-redist-${station.stationId}-${Date.now()}`,
          type: 'vehicleRedistribution',
          priority: station.averageOccupancy > 90 ? 'high' : 'medium',
          title: `Redistribute vehicles to ${station.stationName}`,
          description: `Station occupancy at ${station.averageOccupancy.toFixed(1)}% requires additional vehicles`,
          reason: 'High passenger density detected',
          action: 'Deploy available vehicles to reduce overcrowding',
          estimatedImpact: {
            improvement: 15,
            metric: 'occupancy',
            timeframe: '30 minutes',
          },
          affectedEntities: [
            {
              type: 'station',
              id: station.stationId,
              name: station.stationName,
            },
          ],
          resources: availableVehicles.slice(0, 3).map(v => ({
            type: 'vehicle',
            quantity: 1,
            currentLocation: v.currentLocation || 'unknown',
            targetLocation: station.stationName,
          })),
          cost: 0,
          confidence: 0.85,
          validUntil: new Date(Date.now() + 3600000), // 1 hour
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate fleet deployment recommendations
   */
  private async generateFleetDeployment(
    predictions: any[],
    vehicles: any[]
  ): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    // Identify high-demand periods from predictions
    const highDemandPredictions = predictions
      .filter(p => p.predictedOccupancy > 85)
      .slice(0, 5);

    for (const prediction of highDemandPredictions) {
      const activeFleet = vehicles.filter(v => v.status === 'MOVING' || v.status === 'STOPPED').length;
      const requiredFleet = Math.ceil(activeFleet * 1.2); // 20% more

      if (activeFleet < requiredFleet) {
        recommendations.push({
          id: `fleet-deploy-${prediction._id}-${Date.now()}`,
          type: 'fleetDeployment',
          priority: prediction.predictedOccupancy > 95 ? 'critical' : 'high',
          title: 'Deploy additional fleet for high demand',
          description: `Predicted occupancy of ${prediction.predictedOccupancy.toFixed(1)}% requires additional fleet`,
          reason: 'AI prediction indicates high passenger demand',
          action: `Deploy ${requiredFleet - activeFleet} additional vehicles`,
          estimatedImpact: {
            improvement: 20,
            metric: 'capacity',
            timeframe: '1 hour',
          },
          affectedEntities: [
            {
              type: 'route',
              id: prediction.routeId?.toString() || 'unknown',
              name: prediction.routeName || 'Unknown Route',
            },
          ],
          resources: [
            {
              type: 'vehicle',
              quantity: requiredFleet - activeFleet,
              currentLocation: 'depot',
              targetLocation: prediction.routeName || 'high-demand area',
            },
          ],
          cost: (requiredFleet - activeFleet) * 500, // Estimated cost
          confidence: prediction.confidence || 0.8,
          validUntil: new Date(prediction.predictionTime || Date.now() + 7200000),
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate route balancing recommendations
   */
  private async generateRouteBalancing(crowdReports: any[]): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    const routeAnalytics = AnalyticsEngine.generateRouteAnalytics(crowdReports, []);
    
    // Identify imbalanced routes
    const imbalancedRoutes = routeAnalytics.filter(route => 
      route.averageOccupancy > 85 || route.averageOccupancy < 30
    );

    for (const route of imbalancedRoutes) {
      if (route.averageOccupancy > 85) {
        recommendations.push({
          id: `route-balance-${route.routeId}-${Date.now()}`,
          type: 'routeBalancing',
          priority: 'medium',
          title: `Balance route ${route.routeName}`,
          description: `Route occupancy at ${route.averageOccupancy.toFixed(1)}% exceeds optimal range`,
          reason: 'Route imbalance detected',
          action: 'Increase frequency or add alternative routes',
          estimatedImpact: {
            improvement: 10,
            metric: 'occupancy',
            timeframe: '2 hours',
          },
          affectedEntities: [
            {
              type: 'route',
              id: route.routeId,
              name: route.routeName,
            },
          ],
          resources: [],
          cost: 0,
          confidence: 0.75,
          validUntil: new Date(Date.now() + 7200000),
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate emergency allocation recommendations
   */
  private async generateEmergencyAllocation(predictions: any[]): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    const criticalPredictions = predictions.filter(p => 
      p.riskLevel === 'critical' || p.riskLevel === 'high'
    );

    for (const prediction of criticalPredictions) {
      recommendations.push({
        id: `emergency-${prediction._id}-${Date.now()}`,
        type: 'emergencyAllocation',
        priority: 'critical',
        title: 'Emergency resource allocation required',
        description: `Critical risk level detected: ${prediction.riskLevel}`,
        reason: prediction.reason || 'High-risk prediction',
        action: 'Deploy emergency response teams and resources',
        estimatedImpact: {
          improvement: 50,
          metric: 'response_time',
          timeframe: '15 minutes',
        },
        affectedEntities: [
          {
            type: prediction.entityType || 'station',
            id: prediction.entityId?.toString() || 'unknown',
            name: prediction.entityName || 'Unknown Entity',
          },
        ],
        resources: [
          {
            type: 'emergency_team',
            quantity: 1,
            currentLocation: 'nearest_control_center',
            targetLocation: prediction.entityName || 'affected_area',
          },
        ],
        cost: 1000,
        confidence: 0.9,
        validUntil: new Date(Date.now() + 1800000),
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Generate maintenance scheduling recommendations
   */
  private async generateMaintenanceScheduling(vehicles: any[]): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    const maintenanceVehicles = vehicles.filter(v => 
      v.status === 'DELAYED'
    );

    for (const vehicle of maintenanceVehicles) {
      recommendations.push({
        id: `maintenance-${vehicle._id}-${Date.now()}`,
        type: 'maintenanceScheduling',
        priority: vehicle.healthScore < 40 ? 'high' : 'medium',
        title: `Schedule maintenance for vehicle ${vehicle.vehicleNumber}`,
        description: `Vehicle health score at ${vehicle.healthScore} requires maintenance`,
        reason: 'Low vehicle health score detected',
        action: 'Schedule immediate maintenance and inspection',
        estimatedImpact: {
          improvement: 30,
          metric: 'reliability',
          timeframe: '24 hours',
        },
        affectedEntities: [
          {
            type: 'vehicle',
            id: vehicle._id.toString(),
            name: vehicle.vehicleNumber,
          },
        ],
        resources: [
          {
            type: 'maintenance_team',
            quantity: 1,
            currentLocation: 'maintenance_depot',
            targetLocation: vehicle.currentLocation || 'depot',
          },
        ],
        cost: 2000,
        confidence: 0.8,
        validUntil: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });
    }

    return recommendations;
  }
}

export const resourceAllocator = new ResourceAllocator();
