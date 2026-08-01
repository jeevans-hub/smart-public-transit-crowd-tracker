import { ICrowdReportDocument } from '@/types/crowd';
import { ILiveVehicleDocument } from '@/types/vehicle';
import { CostAnalysis } from '@/types/operations';
import { calculateMean } from './statistics';

/**
 * Cost Calculator
 * Calculates operational costs and efficiency metrics
 */
export class CostCalculator {
  
  // Cost constants (in local currency - would be configurable in production)
  private static readonly COST_PER_KM = 2.5;
  private static readonly COST_PER_HOUR = 50;
  private static readonly FUEL_COST_PER_LITER = 1.2;
  private static readonly AVERAGE_FUEL_CONSUMPTION = 0.4; // liters per km
  private static readonly MAINTENANCE_COST_PER_HOUR = 0.5;
  private static readonly DRIVER_COST_PER_HOUR = 25;
  
  /**
   * Calculate cost analysis for a route
   */
  static calculateRouteCost(
    routeId: string,
    routeName: string,
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[]
  ): CostAnalysis {
    const routeVehicles = vehicles.filter(v => v.route === routeId);
    const routeReports = reports.filter(r => r.routeId === routeId);
    
    const passengerCount = this.calculateTotalPassengers(routeReports);
    const costPerRoute = this.calculateCostPerRoute(routeVehicles, routeReports);
    const costPerPassenger = passengerCount > 0 ? costPerRoute / passengerCount : 0;
    const vehicleUtilizationCost = this.calculateVehicleUtilizationCost(routeVehicles);
    const idleCost = this.calculateIdleCost(routeVehicles);
    const fuelEfficiencyEstimate = this.calculateFuelEfficiency(routeVehicles, routeReports);
    const operatingEfficiency = this.calculateOperatingEfficiency(routeVehicles, routeReports);
    
    return {
      routeId,
      routeName,
      costPerRoute: Math.round(costPerRoute),
      costPerPassenger: Math.round(costPerPassenger * 100) / 100,
      vehicleUtilizationCost: Math.round(vehicleUtilizationCost),
      idleCost: Math.round(idleCost),
      fuelEfficiencyEstimate: Math.round(fuelEfficiencyEstimate * 100) / 100,
      operatingEfficiency: Math.round(operatingEfficiency),
      totalCost: Math.round(costPerRoute),
      passengerCount,
    };
  }
  
  /**
   * Calculate total passengers for a route
   */
  private static calculateTotalPassengers(reports: ICrowdReportDocument[]): number {
    return reports.reduce((sum, r) => sum + r.passengerCount, 0);
  }
  
  /**
   * Calculate cost per route
   */
  private static calculateCostPerRoute(vehicles: ILiveVehicleDocument[], reports: ICrowdReportDocument[]): number {
    let totalCost = 0;
    
    // Fuel cost
    const totalDistance = this.estimateTotalDistance(vehicles, reports);
    totalCost += totalDistance * this.COST_PER_KM;
    
    // Operating time cost
    const operatingHours = this.estimateOperatingHours(vehicles, reports);
    totalCost += operatingHours * this.COST_PER_HOUR;
    
    // Driver cost
    totalCost += operatingHours * this.DRIVER_COST_PER_HOUR * vehicles.length;
    
    // Maintenance cost
    totalCost += operatingHours * this.MAINTENANCE_COST_PER_HOUR * vehicles.length;
    
    return totalCost;
  }
  
  /**
   * Estimate total distance traveled
   */
  private static estimateTotalDistance(vehicles: ILiveVehicleDocument[], reports: ICrowdReportDocument[]): number {
    // Simplified estimation based on average speed and time
    const avgSpeed = calculateMean(vehicles.map(v => v.speed));
    const hours = 8; // Assume 8 hours of operation
    return avgSpeed * hours * vehicles.length;
  }
  
  /**
   * Estimate operating hours
   */
  private static estimateOperatingHours(vehicles: ILiveVehicleDocument[], reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 8 * vehicles.length;
    
    const timeSpan = this.getTimeSpanInHours(reports);
    return timeSpan * vehicles.length;
  }
  
  /**
   * Get time span in hours from reports
   */
  private static getTimeSpanInHours(reports: ICrowdReportDocument[]): number {
    if (reports.length === 0) return 8;
    
    const firstReport = reports[0];
    const lastReport = reports[reports.length - 1];
    const hours = (lastReport.createdAt.getTime() - firstReport.createdAt.getTime()) / (1000 * 60 * 60);
    
    return Math.max(1, hours);
  }
  
  /**
   * Calculate vehicle utilization cost
   */
  private static calculateVehicleUtilizationCost(vehicles: ILiveVehicleDocument[]): number {
    return vehicles.reduce((sum, vehicle) => {
      const utilization = vehicle.currentPassengers / vehicle.capacity;
      const cost = this.COST_PER_HOUR * 8 * (1 - utilization); // Cost of unused capacity
      return sum + cost;
    }, 0);
  }
  
  /**
   * Calculate idle cost (vehicles not moving)
   */
  private static calculateIdleCost(vehicles: ILiveVehicleDocument[]): number {
    const idleVehicles = vehicles.filter(v => v.status === 'STOPPED' || v.speed < 5);
    return idleVehicles.length * this.COST_PER_HOUR * 8;
  }
  
  /**
   * Calculate fuel efficiency (km per liter)
   */
  private static calculateFuelEfficiency(vehicles: ILiveVehicleDocument[], reports: ICrowdReportDocument[]): number {
    const avgSpeed = calculateMean(vehicles.map(v => v.speed));
    
    // Fuel efficiency varies with speed (simplified model)
    if (avgSpeed < 20) return 8; // Low speed, lower efficiency
    if (avgSpeed < 40) return 10; // Optimal speed
    if (avgSpeed < 60) return 9; // Higher speed, slightly lower efficiency
    return 7; // Very high speed, lower efficiency
  }
  
  /**
   * Calculate operating efficiency (cost effectiveness)
   */
  private static calculateOperatingEfficiency(vehicles: ILiveVehicleDocument[], reports: ICrowdReportDocument[]): number {
    const totalPassengers = this.calculateTotalPassengers(reports);
    const totalCost = this.calculateCostPerRoute(vehicles, reports);
    
    if (totalCost === 0) return 0;
    
    // Efficiency = passengers per cost unit
    const efficiency = (totalPassengers / totalCost) * 100;
    
    return Math.min(100, efficiency);
  }
  
  /**
   * Calculate cost analysis for multiple routes
   */
  static calculateMultipleRouteCosts(
    routes: Array<{ routeId: string; routeName: string }>,
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[]
  ): CostAnalysis[] {
    return routes.map(route => 
      this.calculateRouteCost(route.routeId, route.routeName, vehicles, reports)
    );
  }
  
  /**
   * Calculate total fleet cost
   */
  static calculateTotalFleetCost(costAnalyses: CostAnalysis[]): number {
    return costAnalyses.reduce((sum, analysis) => sum + analysis.totalCost, 0);
  }
  
  /**
   * Calculate average cost per passenger across all routes
   */
  static calculateAverageCostPerPassenger(costAnalyses: CostAnalysis[]): number {
    if (costAnalyses.length === 0) return 0;
    
    const totalCost = this.calculateTotalFleetCost(costAnalyses);
    const totalPassengers = costAnalyses.reduce((sum, analysis) => sum + analysis.passengerCount, 0);
    
    if (totalPassengers === 0) return 0;
    
    return totalCost / totalPassengers;
  }
  
  /**
   * Identify cost-inefficient routes
   */
  static identifyInefficientRoutes(costAnalyses: CostAnalysis[]): CostAnalysis[] {
    const avgCostPerPassenger = this.calculateAverageCostPerPassenger(costAnalyses);
    
    return costAnalyses.filter(analysis => 
      analysis.costPerPassenger > avgCostPerPassenger * 1.5
    );
  }
  
  /**
   * Calculate potential savings from optimization
   */
  static calculatePotentialSavings(costAnalyses: CostAnalysis[]): {
    idleReduction: number;
    utilizationImprovement: number;
    totalPotential: number;
  } {
    const totalIdleCost = costAnalyses.reduce((sum, analysis) => sum + analysis.idleCost, 0);
    const totalUtilizationCost = costAnalyses.reduce((sum, analysis) => sum + analysis.vehicleUtilizationCost, 0);
    
    // Assume 20% reduction in idle costs and 15% improvement in utilization
    const idleReduction = totalIdleCost * 0.2;
    const utilizationImprovement = totalUtilizationCost * 0.15;
    
    return {
      idleReduction: Math.round(idleReduction),
      utilizationImprovement: Math.round(utilizationImprovement),
      totalPotential: Math.round(idleReduction + utilizationImprovement),
    };
  }
}