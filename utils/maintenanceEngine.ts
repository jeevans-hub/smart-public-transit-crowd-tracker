import { ILiveVehicleDocument } from '@/types/vehicle';
import { ICrowdReportDocument } from '@/types/crowd';
import { IPredictionDocument } from '@/types/prediction';
import { MaintenancePrediction, MaintenanceRiskLevel, MaintenancePriority } from '@/types/operations';
import { calculateMean, calculateMax } from './statistics';
import { calculateOccupancyPercentage } from './crowdCalculator';

/**
 * Predictive Maintenance Engine
 * Estimates maintenance risk based on vehicle operational data
 */
export class MaintenanceEngine {
  
  /**
   * Calculate maintenance risk for a vehicle
   */
  static calculateMaintenanceRisk(
    vehicle: ILiveVehicleDocument,
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): MaintenancePrediction {
    const vehicleReports = reports.filter(r => r.vehicleId === vehicle.vehicleId);
    const vehiclePredictions = predictions.filter(p => p.stationId === vehicle.currentStation);
    
    // Calculate factors
    const vehicleAge = this.estimateVehicleAge(vehicle);
    const operatingHours = this.estimateOperatingHours(vehicle, vehicleReports);
    const utilizationRate = this.calculateUtilizationRate(vehicle, vehicleReports);
    const averageSpeed = this.calculateAverageSpeed(vehicle, vehicleReports);
    const offlineFrequency = this.calculateOfflineFrequency(vehicle);
    const historicalDelay = this.calculateHistoricalDelay(vehicle, vehiclePredictions);
    const passengerLoad = this.calculatePassengerLoad(vehicle, vehicleReports);
    
    // Calculate risk percentage
    const riskPercentage = this.calculateRiskPercentage({
      vehicleAge,
      operatingHours,
      utilizationRate,
      averageSpeed,
      offlineFrequency,
      historicalDelay,
      passengerLoad,
    });
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskPercentage);
    
    // Determine priority
    const priority = this.determinePriority(riskLevel, riskPercentage);
    
    // Estimate days remaining
    const estimatedDaysRemaining = this.estimateDaysRemaining(riskPercentage, operatingHours);
    
    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(riskLevel, utilizationRate, vehicleAge);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(vehicleReports.length, vehiclePredictions.length);
    
    return {
      vehicleId: vehicle.vehicleId,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      riskLevel,
      riskPercentage,
      priority,
      estimatedDaysRemaining,
      recommendedAction,
      factors: {
        vehicleAge,
        operatingHours,
        utilizationRate,
        averageSpeed,
        offlineFrequency,
        historicalDelay,
        passengerLoad,
      },
      confidence,
      generatedAt: new Date(),
    };
  }
  
  /**
   * Estimate vehicle age (in years)
   */
  private static estimateVehicleAge(vehicle: ILiveVehicleDocument): number {
    // Estimate based on vehicle number pattern or use a default
    // In production, this would come from vehicle registration date
    const vehicleYear = parseInt(vehicle.vehicleNumber.slice(-4)) || 2020;
    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - vehicleYear);
  }
  
  /**
   * Estimate operating hours based on activity
   */
  private static estimateOperatingHours(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 0;
    
    const firstReport = reports[0];
    const lastReport = reports[reports.length - 1];
    const daysActive = (lastReport.createdAt.getTime() - firstReport.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Assume 8 hours of operation per active day
    return Math.round(daysActive * 8);
  }
  
  /**
   * Calculate utilization rate
   */
  private static calculateUtilizationRate(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 0;
    
    const occupancies = reports.map(r => r.occupancyPercentage);
    const avgOccupancy = calculateMean(occupancies);
    
    return Math.round(avgOccupancy);
  }
  
  /**
   * Calculate average speed
   */
  private static calculateAverageSpeed(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return vehicle.speed;
    
    return vehicle.speed;
  }
  
  /**
   * Calculate offline frequency (percentage of time offline)
   */
  private static calculateOfflineFrequency(vehicle: ILiveVehicleDocument): number {
    // In production, this would be calculated from historical status changes
    // For now, use current status as proxy
    return vehicle.status === 'OFFLINE' ? 100 : 0;
  }
  
  /**
   * Calculate historical delay based on predictions
   */
  private static calculateHistoricalDelay(vehicle: ILiveVehicleDocument, predictions: IPredictionDocument[]): number {
    if (predictions.length === 0) return 0;
    
    const delayedPredictions = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL');
    return (delayedPredictions.length / predictions.length) * 100;
  }
  
  /**
   * Calculate passenger load
   */
  private static calculatePassengerLoad(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) {
      return calculateOccupancyPercentage(vehicle.currentPassengers, vehicle.capacity);
    }
    
    const recentReports = reports.slice(-10);
    const occupancies = recentReports.map(r => r.occupancyPercentage);
    return calculateMean(occupancies);
  }
  
  /**
   * Calculate overall risk percentage from factors
   */
  private static calculateRiskPercentage(factors: {
    vehicleAge: number;
    operatingHours: number;
    utilizationRate: number;
    averageSpeed: number;
    offlineFrequency: number;
    historicalDelay: number;
    passengerLoad: number;
  }): number {
    let risk = 0;
    
    // Vehicle age contribution (max 20%)
    risk += Math.min(20, factors.vehicleAge * 2);
    
    // Operating hours contribution (max 25%)
    risk += Math.min(25, factors.operatingHours / 100);
    
    // High utilization increases risk (max 15%)
    if (factors.utilizationRate > 80) {
      risk += 15;
    } else if (factors.utilizationRate > 60) {
      risk += 10;
    }
    
    // Low speed indicates potential issues (max 10%)
    if (factors.averageSpeed < 10) {
      risk += 10;
    } else if (factors.averageSpeed < 20) {
      risk += 5;
    }
    
    // Offline frequency (max 15%)
    risk += factors.offlineFrequency * 0.15;
    
    // Historical delay (max 10%)
    risk += factors.historicalDelay * 0.1;
    
    // High passenger load (max 5%)
    if (factors.passengerLoad > 90) {
      risk += 5;
    }
    
    return Math.min(100, Math.round(risk));
  }
  
  /**
   * Determine risk level from percentage
   */
  private static determineRiskLevel(riskPercentage: number): MaintenanceRiskLevel {
    if (riskPercentage >= 75) return 'CRITICAL';
    if (riskPercentage >= 50) return 'HIGH';
    if (riskPercentage >= 25) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Determine maintenance priority
   */
  private static determinePriority(riskLevel: MaintenanceRiskLevel, riskPercentage: number): MaintenancePriority {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'EMERGENCY';
      case 'HIGH':
        return 'URGENT';
      case 'MEDIUM':
        return 'SCHEDULED';
      case 'LOW':
        return 'ROUTINE';
      default:
        return 'ROUTINE';
    }
  }
  
  /**
   * Estimate days remaining before maintenance required
   */
  private static estimateDaysRemaining(riskPercentage: number, operatingHours: number): number {
    if (riskPercentage >= 75) return Math.max(1, 7 - Math.floor(riskPercentage / 10));
    if (riskPercentage >= 50) return Math.max(7, 30 - Math.floor(riskPercentage / 5));
    if (riskPercentage >= 25) return Math.max(30, 90 - Math.floor(riskPercentage / 3));
    return Math.max(90, 180 - Math.floor(riskPercentage / 2));
  }
  
  /**
   * Generate recommended action
   */
  private static generateRecommendedAction(
    riskLevel: MaintenanceRiskLevel,
    utilizationRate: number,
    vehicleAge: number
  ): string {
    switch (riskLevel) {
      case 'CRITICAL':
        return 'Immediate inspection required. Remove from service until maintenance is completed.';
      case 'HIGH':
        return 'Schedule maintenance within 7 days. Monitor closely for performance degradation.';
      case 'MEDIUM':
        return 'Schedule maintenance within 30 days. Continue normal operations with increased monitoring.';
      case 'LOW':
        return 'Routine maintenance recommended at next scheduled service interval.';
      default:
        return 'Continue normal operations with regular monitoring.';
    }
  }
  
  /**
   * Calculate confidence in prediction
   */
  private static calculateConfidence(reportCount: number, predictionCount: number): number {
    const dataScore = Math.min(50, reportCount * 2);
    const predictionScore = Math.min(30, predictionCount * 3);
    const baseScore = 20;
    
    return Math.min(100, dataScore + predictionScore + baseScore);
  }
  
  /**
   * Batch calculate maintenance risks for multiple vehicles
   */
  static calculateBatchMaintenanceRisks(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): MaintenancePrediction[] {
    return vehicles.map(vehicle => 
      this.calculateMaintenanceRisk(vehicle, reports, predictions)
    );
  }
}