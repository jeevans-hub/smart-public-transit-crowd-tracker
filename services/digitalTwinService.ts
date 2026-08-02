/**
 * Digital Twin Service
 * 
 * Service layer for digital twin operations.
 * Uses existing MongoDB models and follows the same pattern as other services.
 */

import City, { ICityDocument } from '@/models/City';
import TransitRegion, { ITransitRegionDocument } from '@/models/TransitRegion';
import ControlCenter, { IControlCenterDocument } from '@/models/ControlCenter';
import SystemHealth, { ISystemHealthDocument } from '@/models/SystemHealth';
import type {
  CreateCityDTO,
  UpdateCityDTO,
  CreateTransitRegionDTO,
  UpdateTransitRegionDTO,
  CreateControlCenterDTO,
  UpdateControlCenterDTO,
  DigitalTwinState,
  DigitalTwinFilters,
  DigitalTwinSearch,
  CityComparisonData,
  SimulationParameters,
  SimulationState,
  AIInsight,
  ResourceRecommendation,
  ReportConfig,
  ReportData,
} from '@/types/digitalTwin';
import { digitalTwinEngine } from '@/utils/digitalTwinEngine';
import { cityAggregator } from '@/utils/cityAggregator';
import { resourceAllocator } from '@/utils/resourceAllocator';
import { cityHealthCalculator } from '@/utils/cityHealthCalculator';
import { networkAnalyzer } from '@/utils/networkAnalyzer';
import { simulationEngine } from '@/utils/simulationEngine';
import { capacityPlanner } from '@/utils/capacityPlanner';

/**
 * Digital Twin Service
 */
export const digitalTwinService = {
  // City Operations
  async createCity(data: CreateCityDTO): Promise<ICityDocument> {
    if (!data.cityName || !data.cityCode || !data.country || !data.timezone ||
        !data.latitude || !data.longitude || !data.population || !data.area) {
      throw new Error('Missing required fields');
    }

    if (data.latitude < -90 || data.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (data.longitude < -180 || data.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    const city = new City({
      cityName: data.cityName,
      cityCode: data.cityCode,
      country: data.country,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      population: data.population,
      area: data.area,
      description: data.description,
      active: data.active !== undefined ? data.active : true,
    });

    return await city.save();
  },

  async getAllCities(): Promise<ICityDocument[]> {
    return await City.find({}).sort({ cityName: 1 });
  },

  async getCityById(id: string): Promise<ICityDocument | null> {
    return await City.findById(id);
  },

  async updateCity(id: string, data: UpdateCityDTO): Promise<ICityDocument | null> {
    const city = await City.findById(id);
    if (!city) {
      throw new Error('City not found');
    }

    if (data.cityName !== undefined) city.cityName = data.cityName;
    if (data.cityCode !== undefined) city.cityCode = data.cityCode;
    if (data.country !== undefined) city.country = data.country;
    if (data.timezone !== undefined) city.timezone = data.timezone;
    if (data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      city.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      city.longitude = data.longitude;
    }
    if (data.population !== undefined) city.population = data.population;
    if (data.area !== undefined) city.area = data.area;
    if (data.description !== undefined) city.description = data.description;
    if (data.active !== undefined) city.active = data.active;

    return await city.save();
  },

  async deleteCity(id: string): Promise<boolean> {
    const result = await City.findByIdAndDelete(id);
    return !!result;
  },

  // Transit Region Operations
  async createRegion(data: CreateTransitRegionDTO): Promise<ITransitRegionDocument> {
    if (!data.cityId || !data.regionName || !data.regionCode || !data.regionType || !data.boundaries) {
      throw new Error('Missing required fields');
    }

    const region = new TransitRegion({
      cityId: data.cityId,
      regionName: data.regionName,
      regionCode: data.regionCode,
      regionType: data.regionType,
      boundaries: data.boundaries,
      description: data.description,
      active: data.active !== undefined ? data.active : true,
    });

    return await region.save();
  },

  async getAllRegions(): Promise<ITransitRegionDocument[]> {
    return await TransitRegion.find({}).sort({ regionName: 1 });
  },

  async getRegionsByCity(cityId: string): Promise<ITransitRegionDocument[]> {
    return await TransitRegion.find({ cityId }).sort({ regionName: 1 });
  },

  async getRegionById(id: string): Promise<ITransitRegionDocument | null> {
    return await TransitRegion.findById(id);
  },

  async updateRegion(id: string, data: UpdateTransitRegionDTO): Promise<ITransitRegionDocument | null> {
    const region = await TransitRegion.findById(id);
    if (!region) {
      throw new Error('Region not found');
    }

    if (data.cityId !== undefined) region.cityId = data.cityId;
    if (data.regionName !== undefined) region.regionName = data.regionName;
    if (data.regionCode !== undefined) region.regionCode = data.regionCode;
    if (data.regionType !== undefined) region.regionType = data.regionType;
    if (data.boundaries !== undefined) region.boundaries = data.boundaries;
    if (data.description !== undefined) region.description = data.description;
    if (data.active !== undefined) region.active = data.active;

    return await region.save();
  },

  async deleteRegion(id: string): Promise<boolean> {
    const result = await TransitRegion.findByIdAndDelete(id);
    return !!result;
  },

  // Control Center Operations
  async createControlCenter(data: CreateControlCenterDTO): Promise<IControlCenterDocument> {
    if (!data.cityId || !data.centerName || !data.centerCode || !data.centerType ||
        !data.address || !data.latitude || !data.longitude || !data.capacity) {
      throw new Error('Missing required fields');
    }

    const center = new ControlCenter({
      cityId: data.cityId,
      centerName: data.centerName,
      centerCode: data.centerCode,
      centerType: data.centerType,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      capacity: data.capacity,
      regionIds: data.regionIds || [],
      agencyIds: data.agencyIds || [],
      description: data.description,
      active: data.active !== undefined ? data.active : true,
    });

    return await center.save();
  },

  async getAllControlCenters(): Promise<IControlCenterDocument[]> {
    return await ControlCenter.find({}).sort({ centerName: 1 });
  },

  async getControlCentersByCity(cityId: string): Promise<IControlCenterDocument[]> {
    return await ControlCenter.find({ cityId }).sort({ centerName: 1 });
  },

  async getControlCenterById(id: string): Promise<IControlCenterDocument | null> {
    return await ControlCenter.findById(id);
  },

  async updateControlCenter(id: string, data: UpdateControlCenterDTO): Promise<IControlCenterDocument | null> {
    const center = await ControlCenter.findById(id);
    if (!center) {
      throw new Error('Control center not found');
    }

    if (data.cityId !== undefined) center.cityId = data.cityId;
    if (data.centerName !== undefined) center.centerName = data.centerName;
    if (data.centerCode !== undefined) center.centerCode = data.centerCode;
    if (data.centerType !== undefined) center.centerType = data.centerType;
    if (data.address !== undefined) center.address = data.address;
    if (data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      center.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      center.longitude = data.longitude;
    }
    if (data.capacity !== undefined) center.capacity = data.capacity;
    if (data.regionIds !== undefined) center.regionIds = data.regionIds;
    if (data.agencyIds !== undefined) center.agencyIds = data.agencyIds;
    if (data.description !== undefined) center.description = data.description;
    if (data.active !== undefined) center.active = data.active;

    return await center.save();
  },

  async deleteControlCenter(id: string): Promise<boolean> {
    const result = await ControlCenter.findByIdAndDelete(id);
    return !!result;
  },

  // Digital Twin State Operations
  async getDigitalTwinState(cityId: string): Promise<DigitalTwinState> {
    const state = digitalTwinEngine.getState(cityId);
    if (state) {
      return state;
    }
    return await digitalTwinEngine.initializeCity(cityId);
  },

  async refreshDigitalTwinState(cityId: string): Promise<DigitalTwinState> {
    return await digitalTwinEngine.initializeCity(cityId);
  },

  // City Health Operations
  async getCityHealth(cityId: string): Promise<ISystemHealthDocument | null> {
    return await cityHealthCalculator.calculateCityHealth(cityId);
  },

  async getCityHealthTrend(cityId: string, days: number = 7): Promise<any[]> {
    return await cityHealthCalculator.getHealthTrend(cityId, days);
  },

  // Network Analysis Operations
  async getNetworkGraph(cityId: string): Promise<any[]> {
    return await networkAnalyzer.buildNetworkGraph(cityId);
  },

  async getNetworkStatistics(cityId: string): Promise<any> {
    return await networkAnalyzer.getNetworkStatistics(cityId);
  },

  async getConnectivityAnalysis(cityId: string): Promise<any> {
    return await networkAnalyzer.getConnectivityAnalysis(cityId);
  },

  // Resource Optimization Operations
  async getFleetDistribution(cityId: string): Promise<any> {
    return await resourceAllocator.calculateFleetDistribution(cityId);
  },

  async getResourceRecommendations(cityId: string): Promise<ResourceRecommendation[]> {
    return await resourceAllocator.generateRecommendations(cityId);
  },

  // City Comparison Operations
  async getCityComparison(): Promise<CityComparisonData[]> {
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
  },

  // Simulation Operations
  async startSimulation(parameters: SimulationParameters): Promise<SimulationState> {
    return await simulationEngine.startSimulation(parameters);
  },

  async getSimulation(simulationId: string): Promise<SimulationState | undefined> {
    return simulationEngine.getSimulation(simulationId);
  },

  async getActiveSimulations(): Promise<SimulationState[]> {
    return simulationEngine.getActiveSimulations();
  },

  async stopSimulation(simulationId: string): Promise<void> {
    simulationEngine.stopSimulation(simulationId);
  },

  // Capacity Planning Operations
  async getCapacityRecommendations(cityId: string): Promise<any[]> {
    return await capacityPlanner.generateCapacityRecommendations(cityId);
  },

  async getCapacityUtilizationReport(cityId: string): Promise<any> {
    return await capacityPlanner.getCapacityUtilizationReport(cityId);
  },

  // Search Operations
  async search(query: DigitalTwinSearch): Promise<any[]> {
    const results: any[] = [];
    const searchQuery = query.query.toLowerCase();

    if (!query.type || query.type === 'city') {
      const cities = await City.find({
        $or: [
          { cityName: { $regex: searchQuery, $options: 'i' } },
          { cityCode: { $regex: searchQuery, $options: 'i' } },
        ],
      });
      results.push(...cities.map(c => ({ type: 'city', ...c.toObject() })));
    }

    if (!query.type || query.type === 'region') {
      const regions = await TransitRegion.find({
        $or: [
          { regionName: { $regex: searchQuery, $options: 'i' } },
          { regionCode: { $regex: searchQuery, $options: 'i' } },
        ],
      });
      results.push(...regions.map(r => ({ type: 'region', ...r.toObject() })));
    }

    if (!query.type || query.type === 'controlCenter') {
      const centers = await ControlCenter.find({
        $or: [
          { centerName: { $regex: searchQuery, $options: 'i' } },
          { centerCode: { $regex: searchQuery, $options: 'i' } },
        ],
      });
      results.push(...centers.map(c => ({ type: 'controlCenter', ...c.toObject() })));
    }

    return results;
  },

  // Report Operations
  async generateReport(config: ReportConfig): Promise<ReportData> {
    const reportId = `report-${Date.now()}`;
    const reportData = await getReportData(config, this);

    return {
      id: reportId,
      type: config.type,
      format: config.format,
      generatedAt: new Date(),
      data: reportData,
      metadata: {
        cityId: config.cityId,
        regionId: config.regionId,
        dateRange: config.dateRange,
      },
    };
  },
};

// Helper functions for report generation (can't be async methods in object literal)
async function getReportData(config: ReportConfig, service: any): Promise<any> {
  switch (config.type) {
    case 'smartCity':
      return await generateSmartCityReport(config, service);
    case 'executive':
      return await generateExecutiveReport(config, service);
    case 'regional':
      return await generateRegionalReport(config, service);
    case 'fleet':
      return await generateFleetReport(config, service);
    case 'infrastructure':
      return await generateInfrastructureReport(config, service);
    case 'digitalTwin':
      return await generateDigitalTwinReport(config, service);
    default:
      throw new Error(`Unknown report type: ${config.type}`);
  }
}

async function generateSmartCityReport(config: ReportConfig, service: any): Promise<any> {
  const cityId = config.cityId;
  if (!cityId) throw new Error('City ID required for smart city report');

  const [health, comparison, networkStats, capacityReport] = await Promise.all([
    service.getCityHealth(cityId),
    service.getCityComparison(),
    service.getNetworkStatistics(cityId),
    service.getCapacityUtilizationReport(cityId),
  ]);

  return {
    health,
    comparison,
    networkStats,
    capacityReport,
  };
}

async function generateExecutiveReport(config: ReportConfig, service: any): Promise<any> {
  const comparison = await service.getCityComparison();
  const cities = await City.find({ active: true });

  return {
    cities,
    comparison,
    summary: {
      totalCities: cities.length,
      averageHealthScore: comparison.reduce((sum: number, c: any) => sum + c.healthScore, 0) / comparison.length,
      totalPassengers: comparison.reduce((sum: number, c: any) => sum + c.passengerVolume, 0),
      totalFleet: comparison.reduce((sum: number, c: any) => sum + c.fleetSize, 0),
    },
  };
}

async function generateRegionalReport(config: ReportConfig, service: any): Promise<any> {
  const cityId = config.cityId;
  if (!cityId) throw new Error('City ID required for regional report');

  const regions = await service.getRegionsByCity(cityId);
  const health = await service.getCityHealth(cityId);

  return {
    regions,
    health,
  };
}

async function generateFleetReport(config: ReportConfig, service: any): Promise<any> {
  const cityId = config.cityId;
  if (!cityId) throw new Error('City ID required for fleet report');

  const fleetDistribution = await service.getFleetDistribution(cityId);
  const health = await service.getCityHealth(cityId);

  return {
    fleetDistribution,
    health,
  };
}

async function generateInfrastructureReport(config: ReportConfig, service: any): Promise<any> {
  const cityId = config.cityId;
  if (!cityId) throw new Error('City ID required for infrastructure report');

  const capacityReport = await service.getCapacityUtilizationReport(cityId);
  const networkStats = await service.getNetworkStatistics(cityId);

  return {
    capacityReport,
    networkStats,
  };
}

async function generateDigitalTwinReport(config: ReportConfig, service: any): Promise<any> {
  const cityId = config.cityId;
  if (!cityId) throw new Error('City ID required for digital twin report');

  const state = await service.getDigitalTwinState(cityId);
  const health = await service.getCityHealth(cityId);
  const recommendations = await service.getResourceRecommendations(cityId);

  return {
    state,
    health,
    recommendations,
  };
}
