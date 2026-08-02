/**
 * Simulation Engine
 * 
 * Allows simulation of various scenarios:
 * - Passenger Surge
 * - Vehicle Breakdown
 * - Station Closure
 * - Emergency Incident
 * - Weather Impact
 * - Route Diversion
 * - Fleet Expansion
 * - Peak Hour
 * 
 * Reuses the existing prediction engine for simulations.
 */

import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import Station from '@/models/Station';
import Route from '@/models/Route';
import { SimulationState, SimulationParameters, SimulationResults } from '@/types/digitalTwin';
import { calculateOccupancyPercentage, calculateCrowdLevel } from './crowdCalculator';

/**
 * Simulation Engine
 * Runs what-if scenarios and predicts outcomes
 */
export class SimulationEngine {
  private activeSimulations: Map<string, SimulationState> = new Map();

  /**
   * Start a simulation
   */
  public async startSimulation(parameters: SimulationParameters): Promise<SimulationState> {
    const simulationId = `sim-${Date.now()}`;
    
    const simulation: SimulationState = {
      id: simulationId,
      type: parameters.scenario as any,
      status: 'running',
      startTime: new Date(),
      parameters,
      results: await this.runSimulation(parameters),
    };

    this.activeSimulations.set(simulationId, simulation);
    return simulation;
  }

  /**
   * Run simulation based on parameters
   */
  private async runSimulation(parameters: SimulationParameters): Promise<SimulationResults> {
    switch (parameters.scenario) {
      case 'passengerSurge':
        return await this.simulatePassengerSurge(parameters);
      case 'vehicleBreakdown':
        return await this.simulateVehicleBreakdown(parameters);
      case 'stationClosure':
        return await this.simulateStationClosure(parameters);
      case 'emergencyIncident':
        return await this.simulateEmergencyIncident(parameters);
      case 'weatherImpact':
        return await this.simulateWeatherImpact(parameters);
      case 'routeDiversion':
        return await this.simulateRouteDiversion(parameters);
      case 'fleetExpansion':
        return await this.simulateFleetExpansion(parameters);
      case 'peakHour':
        return await this.simulatePeakHour(parameters);
      default:
        throw new Error(`Unknown simulation scenario: ${parameters.scenario}`);
    }
  }

  /**
   * Simulate passenger surge
   */
  private async simulatePassengerSurge(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const affectedStations = parameters.affectedEntities?.stations || [];

    // Get current crowd data
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);

    // Simulate increased passenger count
    const predictedCrowd = currentReports.map(report => {
      const isAffected = affectedStations.includes(report.stationId?.toString());
      const multiplier = isAffected ? severityMultiplier : 1;
      return Math.round(report.passengerCount * multiplier);
    });

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.filter(v => 
      v.currentStation && affectedStations.includes(v.currentStation.toString())
    ).length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.5);
    const reroutedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.3);

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.filter(r => 
      r.stations?.some((s: any) => affectedStations.includes(s._id?.toString()))
    ).length;
    const delayedRoutes = Math.round(affectedRoutes * severityMultiplier * 0.4);
    const alternativeRoutes = Math.round(affectedRoutes * 0.2);

    // Calculate delays
    const averageDelay = 5 * severityMultiplier;
    const maxDelay = 15 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    // Generate recommendations
    const recommendations = [
      `Deploy ${Math.round(affectedVehicles * 0.3)} additional vehicles to affected stations`,
      'Increase service frequency on affected routes',
      'Activate contingency transport plans',
      'Notify passengers of delays',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate vehicle breakdown
   */
  private async simulateVehicleBreakdown(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const affectedVehicles = parameters.affectedEntities?.vehicles || [];

    const vehicles = await LiveVehicle.find();
    const breakdownCount = Math.round(affectedVehicles.length * severityMultiplier * 0.5);

    // Predict crowd impact
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => 
      Math.round(report.passengerCount * 1.1) // 10% increase due to reduced capacity
    );

    // Calculate vehicle impact
    const delayedVehicles = breakdownCount * 2;
    const reroutedVehicles = breakdownCount;

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.filter(r => 
      r.stations?.some((s: any) => affectedVehicles.includes(s._id?.toString()))
    ).length;
    const delayedRoutes = Math.round(affectedRoutes * severityMultiplier * 0.3);
    const alternativeRoutes = Math.round(affectedRoutes * 0.15);

    // Calculate delays
    const averageDelay = 8 * severityMultiplier;
    const maxDelay = 20 * severityMultiplier;
    const totalDelay = averageDelay * breakdownCount;

    const recommendations = [
      `Deploy ${breakdownCount} backup vehicles immediately`,
      'Reroute affected vehicles to minimize disruption',
      'Increase frequency on adjacent routes',
      'Notify maintenance teams for priority repairs',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles: breakdownCount,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate station closure
   */
  private async simulateStationClosure(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const affectedStations = parameters.affectedEntities?.stations || [];

    const stations = await Station.find({ _id: { $in: affectedStations } });
    const closedStations = stations.length;

    // Predict crowd redistribution
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => {
      const isAffected = affectedStations.includes(report.stationId?.toString());
      return isAffected ? 0 : Math.round(report.passengerCount * 1.2); // 20% increase at other stations
    });

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.filter(v => 
      v.currentStation && affectedStations.includes(v.currentStation.toString())
    ).length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.8);
    const reroutedVehicles = affectedVehicles;

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.filter(r => 
      r.stations?.some((s: any) => affectedStations.includes(s._id?.toString()))
    ).length;
    const delayedRoutes = affectedRoutes;
    const alternativeRoutes = Math.round(affectedRoutes * 0.3);

    // Calculate delays
    const averageDelay = 10 * severityMultiplier;
    const maxDelay = 25 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    const recommendations = [
      'Activate shuttle services between adjacent stations',
      'Increase frequency on alternate routes',
      'Provide real-time updates to passengers',
      'Coordinate with emergency services if needed',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate emergency incident
   */
  private async simulateEmergencyIncident(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const affectedEntities = parameters.affectedEntities;

    // Predict crowd impact
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => 
      Math.round(report.passengerCount * 0.7) // 30% reduction due to avoidance
    );

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.6);
    const reroutedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.4);

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.length;
    const delayedRoutes = Math.round(affectedRoutes * severityMultiplier * 0.5);
    const alternativeRoutes = Math.round(affectedRoutes * 0.25);

    // Calculate delays
    const averageDelay = 12 * severityMultiplier;
    const maxDelay = 30 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    const recommendations = [
      'Activate emergency response protocols',
      'Deploy emergency vehicles to affected area',
      'Coordinate with law enforcement and emergency services',
      'Implement route diversions immediately',
      'Provide continuous updates to passengers',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate weather impact
   */
  private async simulateWeatherImpact(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);

    // Predict crowd impact
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => 
      Math.round(report.passengerCount * (1 - severityMultiplier * 0.3)) // Up to 30% reduction
    );

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.4);
    const reroutedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.2);

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.length;
    const delayedRoutes = Math.round(affectedRoutes * severityMultiplier * 0.3);
    const alternativeRoutes = Math.round(affectedRoutes * 0.1);

    // Calculate delays
    const averageDelay = 6 * severityMultiplier;
    const maxDelay = 18 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    const recommendations = [
      'Reduce service frequency on exposed routes',
      'Increase maintenance inspections',
      'Provide weather-specific passenger notifications',
      'Prepare contingency routes for severe conditions',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate route diversion
   */
  private async simulateRouteDiversion(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const affectedRoutes = parameters.affectedEntities?.routes || [];

    // Predict crowd impact
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => {
      const isAffected = affectedRoutes.includes(report.routeId?.toString());
      return isAffected ? Math.round(report.passengerCount * 0.9) : report.passengerCount;
    });

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.filter(v => 
      v.route && affectedRoutes.includes(v.route.toString())
    ).length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.3);
    const reroutedVehicles = affectedVehicles;

    // Calculate route impact
    const routes = await Route.find();
    const delayedRoutes = Math.round(affectedRoutes.length * severityMultiplier * 0.2);
    const alternativeRoutes = affectedRoutes.length;

    // Calculate delays
    const averageDelay = 4 * severityMultiplier;
    const maxDelay = 12 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    const recommendations = [
      'Update route information in real-time',
      'Provide clear diversion signage',
      'Increase staff at diversion points',
      'Monitor diversion impact continuously',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes: affectedRoutes.length,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate fleet expansion
   */
  private async simulateFleetExpansion(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);
    const expansionCount = parameters.customParams?.expansionCount || 10;

    // Predict crowd impact (improved capacity)
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => 
      Math.round(report.passengerCount * 1.15) // 15% increase in capacity
    );

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = expansionCount;
    const delayedVehicles = 0;
    const reroutedVehicles = 0;

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.length;
    const delayedRoutes = 0;
    const alternativeRoutes = Math.round(routes.length * 0.1);

    // Calculate delays (reduced)
    const averageDelay = -2 * severityMultiplier; // Negative = improvement
    const maxDelay = 0;
    const totalDelay = averageDelay * expansionCount;

    const recommendations = [
      `Deploy ${expansionCount} new vehicles across high-demand routes`,
      'Train new drivers and maintenance staff',
      'Update schedules to accommodate new capacity',
      'Monitor utilization metrics for optimization',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay: Math.abs(averageDelay),
        maxDelay,
        totalDelay: Math.abs(totalDelay),
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Simulate peak hour
   */
  private async simulatePeakHour(parameters: SimulationParameters): Promise<SimulationResults> {
    const severityMultiplier = this.getSeverityMultiplier(parameters.severity);

    // Predict crowd impact
    const currentReports = await CrowdReport.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    const predictedCrowd = currentReports.map(report => 
      Math.round(report.passengerCount * 1.5) // 50% increase during peak
    );

    // Calculate vehicle impact
    const vehicles = await LiveVehicle.find();
    const affectedVehicles = vehicles.length;
    const delayedVehicles = Math.round(affectedVehicles * severityMultiplier * 0.25);
    const reroutedVehicles = Math.round(affectedVehicles * 0.1);

    // Calculate route impact
    const routes = await Route.find();
    const affectedRoutes = routes.length;
    const delayedRoutes = Math.round(affectedRoutes * severityMultiplier * 0.2);
    const alternativeRoutes = Math.round(routes.length * 0.05);

    // Calculate delays
    const averageDelay = 3 * severityMultiplier;
    const maxDelay = 10 * severityMultiplier;
    const totalDelay = averageDelay * affectedVehicles;

    const recommendations = [
      'Increase service frequency during peak hours',
      'Deploy extra vehicles on high-demand routes',
      'Optimize signal timing for transit priority',
      'Provide real-time crowding information',
    ];

    return {
      predictedCrowd,
      vehicleImpact: {
        affectedVehicles,
        delayedVehicles,
        reroutedVehicles,
      },
      routeImpact: {
        affectedRoutes,
        delayedRoutes,
        alternativeRoutes,
      },
      delay: {
        averageDelay,
        maxDelay,
        totalDelay,
      },
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Get severity multiplier
   */
  private getSeverityMultiplier(severity: string): number {
    switch (severity) {
      case 'low':
        return 1.0;
      case 'medium':
        return 1.5;
      case 'high':
        return 2.0;
      case 'critical':
        return 3.0;
      default:
        return 1.0;
    }
  }

  /**
   * Get simulation by ID
   */
  public getSimulation(simulationId: string): SimulationState | undefined {
    return this.activeSimulations.get(simulationId);
  }

  /**
   * Get all active simulations
   */
  public getActiveSimulations(): SimulationState[] {
    return Array.from(this.activeSimulations.values());
  }

  /**
   * Stop simulation
   */
  public stopSimulation(simulationId: string): void {
    const simulation = this.activeSimulations.get(simulationId);
    if (simulation) {
      simulation.status = 'completed';
      simulation.endTime = new Date();
    }
  }

  /**
   * Cleanup completed simulations
   */
  public cleanupSimulations(): void {
    const now = Date.now();
    this.activeSimulations.forEach((simulation, id) => {
      if (simulation.status === 'completed' && simulation.endTime) {
        const age = now - simulation.endTime.getTime();
        if (age > 3600000) { // 1 hour old
          this.activeSimulations.delete(id);
        }
      }
    });
  }
}

export const simulationEngine = new SimulationEngine();
