import { ILiveVehicleDocument } from '@/types/vehicle';
import { MaintenancePrediction, MaintenanceRiskLevel } from '@/types/operations';
import { calculateMean } from './statistics';

/**
 * Fleet Health Calculator
 * Calculates overall fleet health metrics and individual vehicle health
 */
export class FleetHealthCalculator {
  
  /**
   * Calculate fleet health metrics
   */
  static calculateFleetHealth(
    vehicles: ILiveVehicleDocument[],
    maintenancePredictions: MaintenancePrediction[]
  ): {
    fleetHealthScore: number;
    healthyVehicles: number;
    maintenanceRequired: number;
    criticalVehicles: number;
    offlineVehicles: number;
    operationalAvailability: number;
    totalVehicles: number;
  } {
    const totalVehicles = vehicles.length;
    if (totalVehicles === 0) {
      return {
        fleetHealthScore: 0,
        healthyVehicles: 0,
        maintenanceRequired: 0,
        criticalVehicles: 0,
        offlineVehicles: 0,
        operationalAvailability: 0,
        totalVehicles: 0,
      };
    }
    
    const offlineVehicles = vehicles.filter(v => v.status === 'OFFLINE').length;
    const onlineVehicles = totalVehicles - offlineVehicles;
    
    // Count vehicles by maintenance risk
    const criticalVehicles = maintenancePredictions.filter(p => p.riskLevel === 'CRITICAL').length;
    const highRiskVehicles = maintenancePredictions.filter(p => p.riskLevel === 'HIGH').length;
    const maintenanceRequired = criticalVehicles + highRiskVehicles;
    const healthyVehicles = totalVehicles - maintenanceRequired - offlineVehicles;
    
    // Calculate operational availability
    const operationalAvailability = totalVehicles > 0 
      ? ((onlineVehicles - criticalVehicles) / totalVehicles) * 100 
      : 0;
    
    // Calculate fleet health score
    const fleetHealthScore = this.calculateFleetHealthScore(
      healthyVehicles,
      maintenanceRequired,
      criticalVehicles,
      offlineVehicles,
      totalVehicles
    );
    
    return {
      fleetHealthScore: Math.round(fleetHealthScore),
      healthyVehicles,
      maintenanceRequired,
      criticalVehicles,
      offlineVehicles,
      operationalAvailability: Math.round(operationalAvailability),
      totalVehicles,
    };
  }
  
  /**
   * Calculate overall fleet health score (0-100)
   */
  private static calculateFleetHealthScore(
    healthyVehicles: number,
    maintenanceRequired: number,
    criticalVehicles: number,
    offlineVehicles: number,
    totalVehicles: number
  ): number {
    if (totalVehicles === 0) return 0;
    
    const healthyRatio = healthyVehicles / totalVehicles;
    const maintenanceRatio = maintenanceRequired / totalVehicles;
    const criticalRatio = criticalVehicles / totalVehicles;
    const offlineRatio = offlineVehicles / totalVehicles;
    
    // Base score from healthy vehicles
    let score = healthyRatio * 100;
    
    // Penalty for maintenance required
    score -= maintenanceRatio * 30;
    
    // Higher penalty for critical vehicles
    score -= criticalRatio * 40;
    
    // Penalty for offline vehicles
    score -= offlineRatio * 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate individual vehicle health score
   */
  static calculateVehicleHealth(
    vehicle: ILiveVehicleDocument,
    maintenancePrediction: MaintenancePrediction
  ): number {
    let healthScore = 100;
    
    // Deduct based on maintenance risk
    healthScore -= maintenancePrediction.riskPercentage * 0.5;
    
    // Deduct based on status
    if (vehicle.status === 'OFFLINE') {
      healthScore -= 30;
    } else if (vehicle.status === 'DELAYED') {
      healthScore -= 15;
    }
    
    // Deduct based on utilization (too high or too low)
    const utilization = (vehicle.currentPassengers / vehicle.capacity) * 100;
    if (utilization > 90) {
      healthScore -= 10;
    } else if (utilization < 20) {
      healthScore -= 5;
    }
    
    return Math.max(0, Math.round(healthScore));
  }
  
  /**
   * Calculate vehicle health data for all vehicles
   */
  static calculateVehicleHealthData(
    vehicles: ILiveVehicleDocument[],
    maintenancePredictions: MaintenancePrediction[]
  ): Array<{
    vehicleId: string;
    vehicleNumber: string;
    vehicleType: string;
    route: string;
    status: string;
    healthScore: number;
    maintenanceRisk: MaintenanceRiskLevel;
    utilizationRate: number;
    operatingHours: number;
  }> {
    return vehicles.map(vehicle => {
      const prediction = maintenancePredictions.find(p => p.vehicleId === vehicle.vehicleId);
      const healthScore = prediction 
        ? this.calculateVehicleHealth(vehicle, prediction)
        : this.calculateVehicleHealthWithoutPrediction(vehicle);
      
      const utilizationRate = (vehicle.currentPassengers / vehicle.capacity) * 100;
      
      return {
        vehicleId: vehicle.vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        route: vehicle.route,
        status: vehicle.status,
        healthScore,
        maintenanceRisk: (prediction?.riskLevel || 'LOW') as MaintenanceRiskLevel,
        utilizationRate: Math.round(utilizationRate),
        operatingHours: prediction?.factors.operatingHours || 0,
      };
    });
  }
  
  /**
   * Calculate vehicle health without maintenance prediction
   */
  private static calculateVehicleHealthWithoutPrediction(vehicle: ILiveVehicleDocument): number {
    let healthScore = 100;
    
    if (vehicle.status === 'OFFLINE') {
      healthScore -= 30;
    } else if (vehicle.status === 'DELAYED') {
      healthScore -= 15;
    }
    
    const utilization = (vehicle.currentPassengers / vehicle.capacity) * 100;
    if (utilization > 90) {
      healthScore -= 10;
    }
    
    return Math.max(0, healthScore);
  }
  
  /**
   * Calculate fleet efficiency trend
   */
  static calculateFleetEfficiencyTrend(
    vehicles: ILiveVehicleDocument[],
    reports: Array<{ occupancyPercentage: number; createdAt: Date }>
  ): Array<{
    date: Date;
    efficiency: number;
    utilization: number;
    onTimeRate: number;
    costPerPassenger: number;
  }> {
    const now = new Date();
    const trendData = [];
    
    // Generate data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Get reports for this day
      const dayReports = reports.filter(r => 
        r.createdAt >= date && r.createdAt < nextDate
      );
      
      if (dayReports.length > 0) {
        const utilization = calculateMean(dayReports.map(r => r.occupancyPercentage));
        const onTimeVehicles = vehicles.filter(v => v.status !== 'DELAYED').length;
        const onTimeRate = vehicles.length > 0 ? (onTimeVehicles / vehicles.length) * 100 : 100;
        
        // Efficiency combines utilization and on-time rate
        const efficiency = (utilization * 0.6 + onTimeRate * 0.4);
        
        // Calculate cost per passenger (simplified estimation)
        const passengerCount = dayReports.reduce((sum, r) => sum + (r as any).passengerCount || 0, 0);
        const costPerPassenger = passengerCount > 0 ? (50 / passengerCount) * 100 : 0;
        
        trendData.push({
          date,
          efficiency: Math.round(efficiency),
          utilization: Math.round(utilization),
          onTimeRate: Math.round(onTimeRate),
          costPerPassenger: Math.round(costPerPassenger * 100) / 100,
        });
      }
    }
    
    return trendData;
  }
  
  /**
   * Identify vehicles requiring immediate attention
   */
  static identifyCriticalVehicles(
    vehicles: ILiveVehicleDocument[],
    maintenancePredictions: MaintenancePrediction[]
  ): ILiveVehicleDocument[] {
    const criticalVehicleIds = maintenancePredictions
      .filter(p => p.riskLevel === 'CRITICAL')
      .map(p => p.vehicleId);
    
    return vehicles.filter(v => 
      criticalVehicleIds.includes(v.vehicleId) || v.status === 'OFFLINE'
    );
  }
  
  /**
   * Calculate average fleet age
   */
  static calculateAverageFleetAge(vehicles: ILiveVehicleDocument[]): number {
    if (vehicles.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    const ages = vehicles.map(v => {
      const vehicleYear = parseInt(v.vehicleNumber.slice(-4)) || 2020;
      return Math.max(0, currentYear - vehicleYear);
    });
    
    return calculateMean(ages);
  }
}