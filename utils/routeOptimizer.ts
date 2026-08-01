import { ICrowdReportDocument } from '@/types/crowd';
import { ILiveVehicleDocument } from '@/types/vehicle';
import { IPredictionDocument } from '@/types/prediction';
import { RouteOptimizationAnalysis } from '@/types/operations';
import { calculateMean, calculateMax } from './statistics';

/**
 * Route Optimization Engine
 * Analyzes route performance and recommends optimizations
 */
export class RouteOptimizer {
  
  /**
   * Analyze a route and provide optimization recommendations
   */
  static analyzeRoute(
    routeId: string,
    routeName: string,
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): RouteOptimizationAnalysis {
    const routeVehicles = vehicles.filter(v => v.route === routeId);
    const routeReports = reports.filter(r => r.routeId === routeId);
    const routePredictions = predictions.filter(p => {
      const report = routeReports.find(r => r.stationId === p.stationId);
      return report !== undefined;
    });
    
    const currentVehicles = routeVehicles.length;
    const averageOccupancy = this.calculateAverageOccupancy(routeReports);
    const peakOccupancy = this.calculatePeakOccupancy(routeReports);
    const averageSpeed = this.calculateAverageSpeed(routeVehicles);
    const congestionLevel = this.determineCongestionLevel(averageOccupancy, peakOccupancy);
    
    const { recommendedVehicles, recommendation, expectedBenefit, confidence } = 
      this.generateRecommendation(
        currentVehicles,
        averageOccupancy,
        peakOccupancy,
        congestionLevel,
        routeReports.length
      );
    
    return {
      routeId,
      routeName,
      currentVehicles,
      recommendedVehicles,
      averageOccupancy: Math.round(averageOccupancy),
      peakOccupancy: Math.round(peakOccupancy),
      averageSpeed: Math.round(averageSpeed),
      congestionLevel,
      recommendation,
      expectedBenefit,
      confidence,
    };
  }
  
  /**
   * Calculate average occupancy for a route
   */
  private static calculateAverageOccupancy(reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 0;
    const occupancies = reports.map(r => r.occupancyPercentage);
    return calculateMean(occupancies);
  }
  
  /**
   * Calculate peak occupancy for a route
   */
  private static calculatePeakOccupancy(reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 0;
    const occupancies = reports.map(r => r.occupancyPercentage);
    return calculateMax(occupancies);
  }
  
  /**
   * Calculate average speed for route vehicles
   */
  private static calculateAverageSpeed(vehicles: ILiveVehicleDocument[]): number {
    if (vehicles.length === 0) return 0;
    const speeds = vehicles.map(v => v.speed);
    return calculateMean(speeds);
  }
  
  /**
   * Determine congestion level
   */
  private static determineCongestionLevel(
    averageOccupancy: number,
    peakOccupancy: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (peakOccupancy >= 90 || averageOccupancy >= 75) return 'CRITICAL';
    if (peakOccupancy >= 75 || averageOccupancy >= 60) return 'HIGH';
    if (peakOccupancy >= 50 || averageOccupancy >= 40) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Generate optimization recommendation
   */
  private static generateRecommendation(
    currentVehicles: number,
    averageOccupancy: number,
    peakOccupancy: number,
    congestionLevel: string,
    reportCount: number
  ): {
    recommendedVehicles: number;
    recommendation: string;
    expectedBenefit: string;
    confidence: number;
  } {
    let recommendedVehicles = currentVehicles;
    let recommendation = '';
    let expectedBenefit = '';
    let confidence = 70;
    
    // Adjust confidence based on data availability
    confidence = Math.min(95, 70 + Math.min(25, reportCount));
    
    if (congestionLevel === 'CRITICAL') {
      recommendedVehicles = currentVehicles + 1;
      recommendation = `Dispatch one additional vehicle to handle critical congestion. Current occupancy (${averageOccupancy.toFixed(0)}%) exceeds safe operating limits.`;
      expectedBenefit = 'Reduce peak occupancy by approximately 20-25% and improve passenger experience.';
    } else if (congestionLevel === 'HIGH') {
      if (peakOccupancy > 80 && averageOccupancy > 60) {
        recommendedVehicles = currentVehicles + 1;
        recommendation = `Add one vehicle during peak hours. High demand detected with peak occupancy at ${peakOccupancy.toFixed(0)}%.`;
        expectedBenefit = 'Reduce wait times by 15-20% during peak periods.';
      } else {
        recommendation = 'Consider increasing frequency during peak hours while maintaining current vehicle count.';
        expectedBenefit = 'Better distribution of capacity without additional operational costs.';
      }
    } else if (congestionLevel === 'MEDIUM') {
      if (averageOccupancy < 30 && currentVehicles > 1) {
        recommendedVehicles = currentVehicles - 1;
        recommendation = `Reduce vehicle count by one. Low utilization (${averageOccupancy.toFixed(0)}%) indicates excess capacity.`;
        expectedBenefit = 'Reduce operational costs by approximately 15-20% for this route.';
      } else {
        recommendation = 'Current vehicle allocation is optimal. Continue monitoring for demand changes.';
        expectedBenefit = 'Maintain current service levels with efficient resource utilization.';
      }
    } else {
      if (averageOccupancy < 20 && currentVehicles > 1) {
        recommendedVehicles = Math.max(1, currentVehicles - 1);
        recommendation = `Reduce vehicle count. Very low utilization (${averageOccupancy.toFixed(0)}%) suggests over-provisioning.`;
        expectedBenefit = 'Significant cost savings while maintaining adequate service.';
      } else {
        recommendation = 'Current operations are well-optimized. No changes recommended.';
        expectedBenefit = 'Continue current efficient operations.';
      }
    }
    
    return {
      recommendedVehicles: Math.max(1, recommendedVehicles),
      recommendation,
      expectedBenefit,
      confidence,
    };
  }
  
  /**
   * Analyze multiple routes
   */
  static analyzeMultipleRoutes(
    routes: Array<{ routeId: string; routeName: string }>,
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): RouteOptimizationAnalysis[] {
    return routes.map(route => 
      this.analyzeRoute(route.routeId, route.routeName, vehicles, reports, predictions)
    );
  }
  
  /**
   * Identify routes requiring immediate attention
   */
  static identifyCriticalRoutes(analyses: RouteOptimizationAnalysis[]): RouteOptimizationAnalysis[] {
    return analyses.filter(a => a.congestionLevel === 'CRITICAL' || a.congestionLevel === 'HIGH');
  }
  
  /**
   * Calculate route efficiency score
   */
  static calculateRouteEfficiencyScore(analysis: RouteOptimizationAnalysis): number {
    let score = 100;
    
    // Penalize high congestion
    if (analysis.congestionLevel === 'CRITICAL') score -= 30;
    else if (analysis.congestionLevel === 'HIGH') score -= 15;
    else if (analysis.congestionLevel === 'MEDIUM') score -= 5;
    
    // Penalize under-utilization
    if (analysis.averageOccupancy < 20) score -= 15;
    else if (analysis.averageOccupancy < 30) score -= 5;
    
    // Reward optimal vehicle allocation
    if (analysis.currentVehicles === analysis.recommendedVehicles) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate balanced distribution recommendation
   */
  static generateBalancedDistribution(
    analyses: RouteOptimizationAnalysis[]
  ): {
    fromRoute: string;
    toRoute: string;
    vehiclesToMove: number;
    reason: string;
  }[] {
    const recommendations: Array<{
      fromRoute: string;
      toRoute: string;
      vehiclesToMove: number;
      reason: string;
    }> = [];
    
    const underutilized = analyses.filter(a => a.averageOccupancy < 30 && a.currentVehicles > 1);
    const overcrowded = analyses.filter(a => a.congestionLevel === 'CRITICAL' || a.congestionLevel === 'HIGH');
    
    for (const crowded of overcrowded) {
      for (const under of underutilized) {
        if (under.currentVehicles > 1) {
          recommendations.push({
            fromRoute: under.routeId,
            toRoute: crowded.routeId,
            vehiclesToMove: 1,
            reason: `Redistribute vehicle from underutilized route ${under.routeName} (${under.averageOccupancy.toFixed(0)}% occupancy) to overcrowded route ${crowded.routeName} (${crowded.averageOccupancy.toFixed(0)}% occupancy).`,
          });
          under.currentVehicles--; // Decrement to avoid double counting
          crowded.currentVehicles++;
          break;
        }
      }
    }
    
    return recommendations;
  }
}