import { ILiveVehicleDocument } from '@/types/vehicle';
import { ICrowdReportDocument } from '@/types/crowd';
import { IPredictionDocument } from '@/types/prediction';
import { MaintenancePrediction } from '@/types/operations';
import { RouteOptimizationAnalysis } from '@/types/operations';
import { DelayPrediction } from '@/types/operations';
import { CostAnalysis } from '@/types/operations';
import { OperationsRecommendation } from '@/types/operations';
import { calculateMean } from './statistics';

/**
 * Operations Recommendation Engine
 * Generates actionable recommendations based on operational data
 */
export class OperationsRecommendationEngine {
  
  /**
   * Generate all operational recommendations
   */
  static generateRecommendations(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[],
    maintenancePredictions: MaintenancePrediction[],
    routeOptimizations: RouteOptimizationAnalysis[],
    delayPredictions: DelayPrediction[],
    costAnalyses: CostAnalysis[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    // Generate maintenance recommendations
    recommendations.push(...this.generateMaintenanceRecommendations(maintenancePredictions));
    
    // Generate dispatch recommendations
    recommendations.push(...this.generateDispatchRecommendations(routeOptimizations, reports));
    
    // Generate redistribution recommendations
    recommendations.push(...this.generateRedistributionRecommendations(routeOptimizations));
    
    // Generate frequency recommendations
    recommendations.push(...this.generateFrequencyRecommendations(reports, predictions));
    
    // Generate delay mitigation recommendations
    recommendations.push(...this.generateDelayRecommendations(delayPredictions));
    
    // Generate cost optimization recommendations
    recommendations.push(...this.generateCostRecommendations(costAnalyses, vehicles));
    
    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    
    return recommendations.slice(0, 20); // Limit to top 20 recommendations
  }
  
  /**
   * Generate maintenance recommendations
   */
  private static generateMaintenanceRecommendations(
    maintenancePredictions: MaintenancePrediction[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    const criticalVehicles = maintenancePredictions.filter(p => p.riskLevel === 'CRITICAL');
    const highRiskVehicles = maintenancePredictions.filter(p => p.riskLevel === 'HIGH');
    
    for (const prediction of criticalVehicles) {
      recommendations.push({
        id: `MAINT-${prediction.vehicleId}-${Date.now()}`,
        type: 'MAINTENANCE',
        priority: 'URGENT',
        title: `Immediate maintenance required for ${prediction.vehicleNumber}`,
        description: `Vehicle ${prediction.vehicleNumber} has critical maintenance risk (${prediction.riskPercentage}%).`,
        reason: `Risk factors: Age ${prediction.factors.vehicleAge} years, utilization ${prediction.factors.utilizationRate}%, operating hours ${prediction.factors.operatingHours}.`,
        confidence: prediction.confidence,
        expectedBenefit: 'Prevent vehicle breakdown and ensure passenger safety.',
        targetId: prediction.vehicleId,
        targetName: prediction.vehicleNumber,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    for (const prediction of highRiskVehicles.slice(0, 5)) {
      recommendations.push({
        id: `MAINT-${prediction.vehicleId}-${Date.now()}`,
        type: 'MAINTENANCE',
        priority: 'HIGH',
        title: `Schedule maintenance for ${prediction.vehicleNumber}`,
        description: `Vehicle ${prediction.vehicleNumber} requires maintenance within 7 days.`,
        reason: `High maintenance risk (${prediction.riskPercentage}%) detected. Estimated ${prediction.estimatedDaysRemaining} days until maintenance required.`,
        confidence: prediction.confidence,
        expectedBenefit: 'Avoid unexpected breakdowns and maintain service reliability.',
        targetId: prediction.vehicleId,
        targetName: prediction.vehicleNumber,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate dispatch recommendations
   */
  private static generateDispatchRecommendations(
    routeOptimizations: RouteOptimizationAnalysis[],
    reports: ICrowdReportDocument[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    const criticalRoutes = routeOptimizations.filter(r => r.congestionLevel === 'CRITICAL');
    
    for (const route of criticalRoutes) {
      if (route.recommendedVehicles > route.currentVehicles) {
        const additionalVehicles = route.recommendedVehicles - route.currentVehicles;
        const routeReports = reports.filter(r => r.routeId === route.routeId);
        const avgOccupancy = calculateMean(routeReports.map(r => r.occupancyPercentage));
        
        recommendations.push({
          id: `DISPATCH-${route.routeId}-${Date.now()}`,
          type: 'DISPATCH',
          priority: 'HIGH',
          title: `Dispatch ${additionalVehicles} additional vehicle(s) to Route ${route.routeName}`,
          description: `Route ${route.routeName} is experiencing critical congestion with ${avgOccupancy.toFixed(0)}% average occupancy.`,
          reason: `Current occupancy (${route.averageOccupancy}%) and peak occupancy (${route.peakOccupancy}%) exceed safe operating limits.`,
          confidence: route.confidence,
          expectedBenefit: route.expectedBenefit,
          targetId: route.routeId,
          targetName: route.routeName,
          generatedAt: new Date(),
          status: 'PENDING',
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Generate redistribution recommendations
   */
  private static generateRedistributionRecommendations(
    routeOptimizations: RouteOptimizationAnalysis[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    const underutilized = routeOptimizations.filter(r => r.averageOccupancy < 30 && r.currentVehicles > 1);
    const overcrowded = routeOptimizations.filter(r => r.congestionLevel === 'HIGH' || r.congestionLevel === 'CRITICAL');
    
    for (const crowded of overcrowded) {
      for (const under of underutilized) {
        if (under.currentVehicles > 1) {
          recommendations.push({
            id: `REDIS-${crowded.routeId}-${under.routeId}-${Date.now()}`,
            type: 'REDISTRIBUTION',
            priority: 'MEDIUM',
            title: `Redistribute vehicle from ${under.routeName} to ${crowded.routeName}`,
            description: `Move one vehicle from underutilized route to relieve congestion on overcrowded route.`,
            reason: `Route ${under.routeName} has low utilization (${under.averageOccupancy}%) while Route ${crowded.routeName} is overcrowded (${crowded.averageOccupancy}%).`,
            confidence: 75,
            expectedBenefit: 'Improve service balance without increasing total fleet size.',
            targetId: crowded.routeId,
            targetName: crowded.routeName,
            generatedAt: new Date(),
            status: 'PENDING',
          });
          under.currentVehicles--;
          break;
        }
      }
    }
    
    return recommendations;
  }
  
  /**
   * Generate frequency recommendations
   */
  private static generateFrequencyRecommendations(
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    // Analyze peak hour patterns
    const hourlyOccupancy: Record<number, number[]> = {};
    reports.forEach(report => {
      const hour = report.createdAt.getHours();
      if (!hourlyOccupancy[hour]) hourlyOccupancy[hour] = [];
      hourlyOccupancy[hour].push(report.occupancyPercentage);
    });
    
    Object.entries(hourlyOccupancy).forEach(([hour, occupancies]) => {
      const avgOccupancy = calculateMean(occupancies);
      const hourNum = parseInt(hour);
      
      if (avgOccupancy > 85 && (hourNum >= 7 && hourNum <= 9 || hourNum >= 17 && hourNum <= 19)) {
        recommendations.push({
          id: `FREQ-${hour}-${Date.now()}`,
          type: 'FREQUENCY',
          priority: 'MEDIUM',
          title: `Increase frequency during ${hourNum}:00 hour`,
          description: `High demand detected at ${hourNum}:00 with ${avgOccupancy.toFixed(0)}% average occupancy.`,
          reason: `Peak hour congestion exceeds 85% occupancy during this time period.`,
          confidence: 80,
          expectedBenefit: 'Reduce wait times and improve passenger experience during peak hours.',
          generatedAt: new Date(),
          status: 'PENDING',
        });
      } else if (avgOccupancy < 20 && (hourNum >= 10 && hourNum <= 16)) {
        recommendations.push({
          id: `FREQ-${hour}-${Date.now()}`,
          type: 'FREQUENCY',
          priority: 'LOW',
          title: `Consider reducing frequency during ${hourNum}:00 hour`,
          description: `Low demand detected at ${hourNum}:00 with ${avgOccupancy.toFixed(0)}% average occupancy.`,
          reason: `Off-peak period with very low utilization indicates potential over-servicing.`,
          confidence: 70,
          expectedBenefit: 'Reduce operational costs during low-demand periods.',
          generatedAt: new Date(),
          status: 'PENDING',
        });
      }
    });
    
    return recommendations.slice(0, 5);
  }
  
  /**
   * Generate delay mitigation recommendations
   */
  private static generateDelayRecommendations(
    delayPredictions: DelayPrediction[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    const highDelayRisk = delayPredictions.filter(p => p.delayRisk === 'HIGH');
    
    for (const prediction of highDelayRisk.slice(0, 5)) {
      let action = '';
      let reason = '';
      
      if (prediction.factors.trafficRisk > 50) {
        action = 'Consider alternative route to avoid traffic congestion.';
        reason = `High traffic risk (${prediction.factors.trafficRisk}%) predicted for current route.`;
      } else if (prediction.factors.stationCongestion > 50) {
        action = 'Adjust schedule to account for station congestion.';
        reason = `Station congestion (${prediction.factors.stationCongestion}%) may cause delays.`;
      } else {
        action = 'Monitor vehicle closely and prepare contingency plan.';
        reason = `Multiple factors contributing to delay risk: traffic ${prediction.factors.trafficRisk}%, congestion ${prediction.factors.stationCongestion}%.`;
      }
      
      recommendations.push({
        id: `DELAY-${prediction.vehicleId}-${Date.now()}`,
        type: 'ROUTE_CHANGE',
        priority: 'MEDIUM',
        title: `Mitigate delay risk for ${prediction.vehicleNumber}`,
        description: `Vehicle ${prediction.vehicleNumber} has high delay risk with ${prediction.predictedDelay} minutes predicted delay.`,
        reason,
        confidence: prediction.confidence,
        expectedBenefit: 'Minimize passenger delays and maintain schedule adherence.',
        targetId: prediction.vehicleId,
        targetName: prediction.vehicleNumber,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate cost optimization recommendations
   */
  private static generateCostRecommendations(
    costAnalyses: CostAnalysis[],
    vehicles: ILiveVehicleDocument[]
  ): OperationsRecommendation[] {
    const recommendations: OperationsRecommendation[] = [];
    
    const avgCostPerPassenger = costAnalyses.reduce((sum, a) => sum + a.costPerPassenger, 0) / costAnalyses.length;
    
    const inefficientRoutes = costAnalyses.filter(a => a.costPerPassenger > avgCostPerPassenger * 1.5);
    
    for (const analysis of inefficientRoutes) {
      recommendations.push({
        id: `COST-${analysis.routeId}-${Date.now()}`,
        type: 'OPTIMIZATION',
        priority: 'LOW',
        title: `Optimize costs for Route ${analysis.routeName}`,
        description: `Route ${analysis.routeName} has high cost per passenger (${analysis.costPerPassenger.toFixed(2)}) compared to fleet average (${avgCostPerPassenger.toFixed(2)}).`,
        reason: `High idle cost (${analysis.idleCost}) and low utilization cost efficiency detected.`,
        confidence: 65,
        expectedBenefit: 'Reduce operational costs by improving vehicle utilization and reducing idle time.',
        targetId: analysis.routeId,
        targetName: analysis.routeName,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    // Check for high idle costs across fleet
    const totalIdleCost = costAnalyses.reduce((sum, a) => sum + a.idleCost, 0);
    if (totalIdleCost > 1000) {
      recommendations.push({
        id: `COST-FLEET-${Date.now()}`,
        type: 'OPTIMIZATION',
        priority: 'MEDIUM',
        title: 'Reduce fleet idle time',
        description: `Fleet-wide idle cost of ${totalIdleCost} indicates significant optimization potential.`,
        reason: 'Multiple vehicles experiencing extended idle periods during operations.',
        confidence: 70,
        expectedBenefit: 'Reduce operational costs by 15-20% through better scheduling and route planning.',
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate operational insights summary
   */
  static generateOperationalInsights(
    recommendations: OperationsRecommendation[],
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[]
  ): {
    totalRecommendations: number;
    urgentActions: number;
    scheduledMaintenance: number;
    fleetEfficiency: number;
    onTimePerformance: number;
    costEfficiency: number;
    peakHours: Array<{ hour: number; averageOccupancy: number }>;
    bottlenecks: string[];
  } {
    const urgentActions = recommendations.filter(r => r.priority === 'URGENT' || r.priority === 'HIGH').length;
    const scheduledMaintenance = recommendations.filter(r => r.type === 'MAINTENANCE').length;
    
    const onTimeVehicles = vehicles.filter(v => v.status !== 'DELAYED').length;
    const onTimePerformance = vehicles.length > 0 ? (onTimeVehicles / vehicles.length) * 100 : 100;
    
    const avgOccupancy = calculateMean(reports.map(r => r.occupancyPercentage));
    const fleetEfficiency = avgOccupancy;
    
    const costEfficiency = 75; // Placeholder - would calculate from actual cost data
    
    // Calculate peak hours
    const hourlyOccupancy: Record<number, number[]> = {};
    reports.forEach(report => {
      const hour = report.createdAt.getHours();
      if (!hourlyOccupancy[hour]) hourlyOccupancy[hour] = [];
      hourlyOccupancy[hour].push(report.occupancyPercentage);
    });
    
    const peakHours = Object.entries(hourlyOccupancy)
      .map(([hour, occupancies]) => ({
        hour: parseInt(hour),
        averageOccupancy: calculateMean(occupancies),
      }))
      .sort((a, b) => b.averageOccupancy - a.averageOccupancy)
      .slice(0, 5);
    
    // Identify bottlenecks
    const bottlenecks = recommendations
      .filter(r => r.priority === 'URGENT' || r.priority === 'HIGH')
      .map(r => r.title)
      .slice(0, 5);
    
    return {
      totalRecommendations: recommendations.length,
      urgentActions,
      scheduledMaintenance,
      fleetEfficiency: Math.round(fleetEfficiency),
      onTimePerformance: Math.round(onTimePerformance),
      costEfficiency: Math.round(costEfficiency),
      peakHours,
      bottlenecks,
    };
  }
}