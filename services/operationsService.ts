import CrowdReport from '@/models/CrowdReport';
import LiveVehicle from '@/models/LiveVehicle';
import PredictionHistory from '@/models/PredictionHistory';
import MaintenancePrediction from '@/models/MaintenancePrediction';
import { OperationsFilters, OperationsOverview, OperationsResponse } from '@/types/operations';
import { MaintenanceEngine } from '@/utils/maintenanceEngine';
import { FleetHealthCalculator } from '@/utils/fleetHealthCalculator';
import { RouteOptimizer } from '@/utils/routeOptimizer';
import { DelayPredictor } from '@/utils/delayPredictor';
import { CostCalculator } from '@/utils/costCalculator';
import { OperationsRecommendationEngine } from '@/utils/operationsRecommendationEngine';
import { AnalyticsEngine } from '@/utils/analyticsEngine';

// Helper functions
async function saveMaintenancePredictions(predictions: any[]): Promise<void> {
  try {
    const vehicleIds = predictions.map(p => p.vehicleId);
    await MaintenancePrediction.deleteMany({ vehicleId: { $in: vehicleIds } });
    await MaintenancePrediction.insertMany(predictions);
  } catch (error) {
    console.error('Error saving maintenance predictions:', error);
  }
}

function generateMaintenanceSchedule(predictions: any[]): any[] {
  const schedule = [];
  
  const urgentPredictions = predictions.filter(p => p.priority === 'EMERGENCY' || p.priority === 'URGENT');
  const scheduledPredictions = predictions.filter(p => p.priority === 'SCHEDULED');
  
  for (const prediction of urgentPredictions) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (prediction.priority === 'EMERGENCY' ? 1 : 7));
    
    schedule.push({
      vehicleId: prediction.vehicleId,
      vehicleNumber: prediction.vehicleNumber,
      scheduledDate,
      maintenanceType: getMaintenanceType(prediction.riskLevel),
      priority: prediction.priority,
      estimatedDuration: getEstimatedDuration(prediction.riskLevel),
      status: 'SCHEDULED',
    });
  }
  
  for (const prediction of scheduledPredictions.slice(0, 10)) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + prediction.estimatedDaysRemaining);
    
    schedule.push({
      vehicleId: prediction.vehicleId,
      vehicleNumber: prediction.vehicleNumber,
      scheduledDate,
      maintenanceType: getMaintenanceType(prediction.riskLevel),
      priority: prediction.priority,
      estimatedDuration: getEstimatedDuration(prediction.riskLevel),
      status: 'SCHEDULED',
    });
  }
  
  return schedule.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
}

function getMaintenanceType(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'Full Inspection & Repair';
    case 'HIGH':
      return 'Comprehensive Maintenance';
    case 'MEDIUM':
      return 'Scheduled Service';
    case 'LOW':
      return 'Routine Check';
    default:
      return 'General Inspection';
  }
}

function getEstimatedDuration(riskLevel: string): number {
  switch (riskLevel) {
    case 'CRITICAL':
      return 48;
    case 'HIGH':
      return 24;
    case 'MEDIUM':
      return 8;
    case 'LOW':
      return 4;
    default:
      return 2;
  }
}

export const operationsService = {
  /**
   * Get complete operations overview
   */
  async getOperationsOverview(filters: OperationsFilters): Promise<OperationsResponse> {
    try {
      // Fetch all required data
      const { startDate, endDate } = AnalyticsEngine.getDateRange(filters.dateRange);
      
      const [vehicles, reports, predictions] = await Promise.all([
        LiveVehicle.find({}).sort({ lastUpdated: -1 }),
        CrowdReport.find({
          createdAt: { $gte: startDate, $lte: endDate },
        }).sort({ createdAt: -1 }),
        PredictionHistory.find({
          generatedAt: { $gte: startDate, $lte: endDate },
        }).sort({ generatedAt: -1 }),
      ]);
      
      // Generate maintenance predictions
      const maintenancePredictions = MaintenanceEngine.calculateBatchMaintenanceRisks(
        vehicles as any[],
        reports as any[],
        predictions as any[]
      );
      
      // Save maintenance predictions to database
      await saveMaintenancePredictions(maintenancePredictions);
      
      // Calculate fleet health
      const fleetHealth = FleetHealthCalculator.calculateFleetHealth(
        vehicles as any[],
        maintenancePredictions
      );
      
      // Calculate vehicle health data
      const vehicleHealth = FleetHealthCalculator.calculateVehicleHealthData(
        vehicles as any[],
        maintenancePredictions
      );
      
      // Get unique routes from vehicles
      const uniqueRoutes = [...new Set(vehicles.map(v => v.route))];
      const routeData = uniqueRoutes.map(routeId => ({
        routeId,
        routeName: `Route ${routeId}`,
      }));
      
      // Analyze routes
      const routeOptimizations = RouteOptimizer.analyzeMultipleRoutes(
        routeData,
        vehicles as any[],
        reports as any[],
        predictions as any[]
      );
      
      // Predict delays
      const delayPredictions = DelayPredictor.predictBatchDelays(
        vehicles as any[],
        reports as any[],
        predictions as any[]
      );
      
      // Calculate cost analysis
      const costAnalysis = CostCalculator.calculateMultipleRouteCosts(
        routeData,
        vehicles as any[],
        reports as any[]
      );
      
      // Generate recommendations
      const recommendations = OperationsRecommendationEngine.generateRecommendations(
        vehicles as any[],
        reports as any[],
        predictions as any[],
        maintenancePredictions,
        routeOptimizations,
        delayPredictions,
        costAnalysis
      );
      
      // Generate operational insights
      const insights = OperationsRecommendationEngine.generateOperationalInsights(
        recommendations,
        vehicles as any[],
        reports as any[]
      );
      
      // Calculate fleet efficiency trend
      const fleetEfficiency = FleetHealthCalculator.calculateFleetEfficiencyTrend(
        vehicles as any[],
        reports as any[]
      );
      
      // Generate maintenance schedule
      const maintenanceSchedule = generateMaintenanceSchedule(maintenancePredictions);
      
      const overview: OperationsOverview = {
        fleetHealth,
        maintenancePredictions,
        vehicleHealth,
        routeOptimizations,
        delayPredictions,
        costAnalysis,
        recommendations,
        insights,
        fleetEfficiency,
        maintenanceSchedule,
      };
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      console.error('Error generating operations overview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
  
  /**
   * Get maintenance predictions by vehicle
   */
  async getMaintenanceByVehicle(vehicleId: string): Promise<any[]> {
    try {
      const predictions = await MaintenancePrediction.find({ vehicleId })
        .sort({ generatedAt: -1 })
        .limit(10);
      
      return predictions;
    } catch (error) {
      console.error('Error fetching maintenance predictions:', error);
      return [];
    }
  },
  
  /**
   * Get fleet health metrics only
   */
  async getFleetHealth(): Promise<any> {
    try {
      const vehicles = await LiveVehicle.find({});
      const predictions = await MaintenancePrediction.find({});
      
      return FleetHealthCalculator.calculateFleetHealth(
        vehicles as any[],
        predictions as any[]
      );
    } catch (error) {
      console.error('Error fetching fleet health:', error);
      return null;
    }
  },
  
  /**
   * Get route optimizations only
   */
  async getRouteOptimizations(): Promise<any[]> {
    try {
      const vehicles = await LiveVehicle.find({});
      const reports = await CrowdReport.find({}).sort({ createdAt: -1 }).limit(1000);
      const predictions = await PredictionHistory.find({}).sort({ generatedAt: -1 }).limit(500);
      
      const uniqueRoutes = [...new Set(vehicles.map(v => v.route))];
      const routeData = uniqueRoutes.map(routeId => ({
        routeId,
        routeName: `Route ${routeId}`,
      }));
      
      return RouteOptimizer.analyzeMultipleRoutes(
        routeData,
        vehicles as any[],
        reports as any[],
        predictions as any[]
      );
    } catch (error) {
      console.error('Error fetching route optimizations:', error);
      return [];
    }
  },
  
  /**
   * Get delay predictions only
   */
  async getDelayPredictions(): Promise<any[]> {
    try {
      const vehicles = await LiveVehicle.find({});
      const reports = await CrowdReport.find({}).sort({ createdAt: -1 }).limit(500);
      const predictions = await PredictionHistory.find({}).sort({ generatedAt: -1 }).limit(250);
      
      return DelayPredictor.predictBatchDelays(
        vehicles as any[],
        reports as any[],
        predictions as any[]
      );
    } catch (error) {
      console.error('Error fetching delay predictions:', error);
      return [];
    }
  },
  
  /**
   * Get cost analysis only
   */
  async getCostAnalysis(): Promise<any[]> {
    try {
      const vehicles = await LiveVehicle.find({});
      const reports = await CrowdReport.find({}).sort({ createdAt: -1 }).limit(1000);
      
      const uniqueRoutes = [...new Set(vehicles.map(v => v.route))];
      const routeData = uniqueRoutes.map(routeId => ({
        routeId,
        routeName: `Route ${routeId}`,
      }));
      
      return CostCalculator.calculateMultipleRouteCosts(
        routeData,
        vehicles as any[],
        reports as any[]
      );
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      return [];
    }
  },
  
  /**
   * Get recommendations only
   */
  async getRecommendations(): Promise<any[]> {
    try {
      const overview = await this.getOperationsOverview({
        dateRange: {
          range: 'LAST_7_DAYS',
        },
      });
      
      return overview.data?.recommendations || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },
};