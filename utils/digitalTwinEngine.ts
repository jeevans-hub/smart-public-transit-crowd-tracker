/**
 * Digital Twin Engine
 * 
 * Core engine that combines all existing modules into a synchronized virtual model.
 * Reuses crowd monitoring, vehicle tracking, AI predictions, operations intelligence,
 * incident management, and analytics modules.
 */

import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import Station from '@/models/Station';
import Route from '@/models/Route';
import Vehicle from '@/models/Vehicle';
import City from '@/models/City';
import TransitRegion from '@/models/TransitRegion';
import ControlCenter from '@/models/ControlCenter';
import SystemHealth from '@/models/SystemHealth';
import { DigitalTwinState, NetworkNode, NetworkEdge, FleetDistribution } from '@/types/digitalTwin';
import { cityHealthCalculator } from './cityHealthCalculator';
import { networkAnalyzer } from './networkAnalyzer';
import { resourceAllocator } from './resourceAllocator';
import { cityAggregator } from './cityAggregator';

/**
 * Digital Twin Engine
 * Synchronizes all data into a unified virtual model
 */
export class DigitalTwinEngine {
  private static instance: DigitalTwinEngine;
  private state: Map<string, DigitalTwinState> = new Map();
  private updateCallbacks: Map<string, Set<Function>> = new Map();

  private constructor() {}

  public static getInstance(): DigitalTwinEngine {
    if (!DigitalTwinEngine.instance) {
      DigitalTwinEngine.instance = new DigitalTwinEngine();
    }
    return DigitalTwinEngine.instance;
  }

  /**
   * Initialize digital twin for a city
   */
  public async initializeCity(cityId: string): Promise<DigitalTwinState> {
    const city = await City.findById(cityId);
    if (!city) {
      throw new Error('City not found');
    }

    const state = await this.buildDigitalTwinState(cityId);
    this.state.set(cityId, state);
    return state;
  }

  /**
   * Build complete digital twin state for a city
   */
  private async buildDigitalTwinState(cityId: string): Promise<DigitalTwinState> {
    const [
      city,
      regions,
      controlCenters,
      systemHealth,
      networkGraph,
      fleetDistribution,
    ] = await Promise.all([
      City.findById(cityId),
      TransitRegion.find({ cityId, active: true }),
      ControlCenter.find({ cityId, active: true }),
      SystemHealth.findOne({ cityId }).sort({ timestamp: -1 }),
      networkAnalyzer.buildNetworkGraph(cityId),
      resourceAllocator.calculateFleetDistribution(cityId),
    ]);

    return {
      selectedCity: city,
      selectedRegion: null,
      selectedControlCenter: null,
      cities: await City.find({ active: true }),
      regions,
      controlCenters,
      systemHealth,
      networkGraph,
      fleetDistribution,
      cityComparison: await this.buildCityComparison(),
      simulation: null,
      aiInsights: [],
      recommendations: [],
    };
  }

  /**
   * Update digital twin state when data changes
   */
  public async updateState(cityId: string, updateType: string): Promise<void> {
    const currentState = this.state.get(cityId);
    if (!currentState) return;

    switch (updateType) {
      case 'crowd':
        await this.updateCrowdData(cityId);
        break;
      case 'vehicle':
        await this.updateVehicleData(cityId);
        break;
      case 'prediction':
        await this.updatePredictionData(cityId);
        break;
      case 'incident':
        await this.updateIncidentData(cityId);
        break;
      case 'analytics':
        await this.updateAnalyticsData(cityId);
        break;
      case 'system':
        await this.updateSystemHealth(cityId);
        break;
      default:
        await this.refreshCity(cityId);
    }

    this.notifyListeners(cityId);
  }

  /**
   * Update crowd data in digital twin
   */
  private async updateCrowdData(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    // Rebuild network graph with updated crowd data
    state.networkGraph = await networkAnalyzer.buildNetworkGraph(cityId);
    
    // Recalculate system health
    const healthDoc = await cityHealthCalculator.calculateCityHealth(cityId);
    state.systemHealth = healthDoc ? {
      _id: healthDoc._id.toString(),
      cityId: healthDoc.cityId.toString(),
      timestamp: healthDoc.timestamp,
      overallHealthScore: healthDoc.overallHealthScore,
      passengerFlowIndex: healthDoc.passengerFlowIndex,
      fleetAvailability: healthDoc.fleetAvailability,
      operationalEfficiency: healthDoc.operationalEfficiency,
      predictionAccuracy: healthDoc.predictionAccuracy,
      systemReliability: healthDoc.systemReliability,
      incidentSeverityIndex: healthDoc.incidentSeverityIndex,
      resourceUtilization: healthDoc.resourceUtilization,
      infrastructureHealth: healthDoc.infrastructureHealth,
      details: healthDoc.details,
      createdAt: healthDoc.createdAt,
    } : null;
  }

  /**
   * Update vehicle data in digital twin
   */
  private async updateVehicleData(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    // Update fleet distribution
    state.fleetDistribution = await resourceAllocator.calculateFleetDistribution(cityId);
    
    // Update network graph
    state.networkGraph = await networkAnalyzer.buildNetworkGraph(cityId);
    
    // Recalculate system health
    const healthDoc = await cityHealthCalculator.calculateCityHealth(cityId);
    state.systemHealth = healthDoc ? {
      _id: healthDoc._id.toString(),
      cityId: healthDoc.cityId.toString(),
      timestamp: healthDoc.timestamp,
      overallHealthScore: healthDoc.overallHealthScore,
      passengerFlowIndex: healthDoc.passengerFlowIndex,
      fleetAvailability: healthDoc.fleetAvailability,
      operationalEfficiency: healthDoc.operationalEfficiency,
      predictionAccuracy: healthDoc.predictionAccuracy,
      systemReliability: healthDoc.systemReliability,
      incidentSeverityIndex: healthDoc.incidentSeverityIndex,
      resourceUtilization: healthDoc.resourceUtilization,
      infrastructureHealth: healthDoc.infrastructureHealth,
      details: healthDoc.details,
      createdAt: healthDoc.createdAt,
    } : null;
  }

  /**
   * Update prediction data in digital twin
   */
  private async updatePredictionData(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    // Update AI insights based on new predictions
    state.aiInsights = await this.generateAIInsights(cityId);
    
    // Update recommendations
    state.recommendations = await resourceAllocator.generateRecommendations(cityId);
  }

  /**
   * Update incident data in digital twin
   */
  private async updateIncidentData(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    // Recalculate system health
    const healthDoc = await cityHealthCalculator.calculateCityHealth(cityId);
    state.systemHealth = healthDoc ? {
      _id: healthDoc._id.toString(),
      cityId: healthDoc.cityId.toString(),
      timestamp: healthDoc.timestamp,
      overallHealthScore: healthDoc.overallHealthScore,
      passengerFlowIndex: healthDoc.passengerFlowIndex,
      fleetAvailability: healthDoc.fleetAvailability,
      operationalEfficiency: healthDoc.operationalEfficiency,
      predictionAccuracy: healthDoc.predictionAccuracy,
      systemReliability: healthDoc.systemReliability,
      incidentSeverityIndex: healthDoc.incidentSeverityIndex,
      resourceUtilization: healthDoc.resourceUtilization,
      infrastructureHealth: healthDoc.infrastructureHealth,
      details: healthDoc.details,
      createdAt: healthDoc.createdAt,
    } : null;
    
    // Update recommendations
    state.recommendations = await resourceAllocator.generateRecommendations(cityId);
  }

  /**
   * Update analytics data in digital twin
   */
  private async updateAnalyticsData(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    // Update city comparison
    state.cityComparison = await this.buildCityComparison();
    
    // Update AI insights
    state.aiInsights = await this.generateAIInsights(cityId);
  }

  /**
   * Update system health
   */
  private async updateSystemHealth(cityId: string): Promise<void> {
    const state = this.state.get(cityId);
    if (!state) return;

    const healthDoc = await cityHealthCalculator.calculateCityHealth(cityId);
    state.systemHealth = healthDoc ? {
      _id: healthDoc._id.toString(),
      cityId: healthDoc.cityId.toString(),
      timestamp: healthDoc.timestamp,
      overallHealthScore: healthDoc.overallHealthScore,
      passengerFlowIndex: healthDoc.passengerFlowIndex,
      fleetAvailability: healthDoc.fleetAvailability,
      operationalEfficiency: healthDoc.operationalEfficiency,
      predictionAccuracy: healthDoc.predictionAccuracy,
      systemReliability: healthDoc.systemReliability,
      incidentSeverityIndex: healthDoc.incidentSeverityIndex,
      resourceUtilization: healthDoc.resourceUtilization,
      infrastructureHealth: healthDoc.infrastructureHealth,
      details: healthDoc.details,
      createdAt: healthDoc.createdAt,
    } : null;
  }

  /**
   * Refresh entire city state
   */
  private async refreshCity(cityId: string): Promise<void> {
    const state = await this.buildDigitalTwinState(cityId);
    this.state.set(cityId, state);
  }

  /**
   * Get current state for a city
   */
  public getState(cityId: string): DigitalTwinState | undefined {
    return this.state.get(cityId);
  }

  /**
   * Subscribe to state updates
   */
  public subscribe(cityId: string, callback: Function): () => void {
    if (!this.updateCallbacks.has(cityId)) {
      this.updateCallbacks.set(cityId, new Set());
    }
    this.updateCallbacks.get(cityId)!.add(callback);

    return () => {
      this.updateCallbacks.get(cityId)?.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(cityId: string): void {
    const callbacks = this.updateCallbacks.get(cityId);
    if (callbacks) {
      const state = this.state.get(cityId);
      callbacks.forEach(callback => callback(state));
    }
  }

  /**
   * Build city comparison data
   */
  private async buildCityComparison() {
    const cities = await City.find({ active: true });
    const comparison = [];

    for (const city of cities) {
      const health = await SystemHealth.findOne({ cityId: city._id }).sort({ timestamp: -1 });
      const aggregated = await cityAggregator.aggregateCityData(city._id.toString());

      comparison.push({
        cityId: city._id.toString(),
        cityName: city.cityName,
        passengerVolume: aggregated.totalPassengers || 0,
        fleetSize: aggregated.totalVehicles || 0,
        averageOccupancy: health?.details.averageOccupancy || 0,
        averageDelay: health?.details.averageDelay || 0,
        predictionAccuracy: health?.predictionAccuracy || 0,
        incidents: health?.details.totalIncidents || 0,
        fleetHealth: health?.fleetAvailability || 0,
        operationalEfficiency: health?.operationalEfficiency || 0,
        averageSpeed: health?.details.averageSpeed || 0,
        systemAvailability: health?.systemReliability || 0,
        healthScore: health?.overallHealthScore || 0,
      });
    }

    return comparison;
  }

  /**
   * Generate AI insights
   */
  private async generateAIInsights(cityId: string) {
    // This will reuse existing prediction and analytics engines
    // Placeholder for now - will be implemented in detail
    return [];
  }

  /**
   * Cleanup state for a city
   */
  public cleanupCity(cityId: string): void {
    this.state.delete(cityId);
    this.updateCallbacks.delete(cityId);
  }

  /**
   * Get all active cities
   */
  public async getActiveCities() {
    return City.find({ active: true });
  }
}

export const digitalTwinEngine = DigitalTwinEngine.getInstance();
