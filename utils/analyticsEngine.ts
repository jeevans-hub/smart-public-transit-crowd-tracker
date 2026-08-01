import { ICrowdReportDocument } from '@/types/crowd';
import { ILiveVehicleDocument } from '@/types/vehicle';
import { IPredictionDocument } from '@/types/prediction';
import {
  DateRange,
  DateRangeFilter,
  AnalyticsFilters,
  PassengerTrend,
  OccupancyTrend,
  VehicleTrend,
  PredictionTrend,
  AlertTrend,
  HeatmapData,
  StationAnalytics,
  RouteAnalytics,
  VehicleAnalytics,
  RoutePerformance,
  VehicleUtilization,
  PeakHourAnalysis,
  DemandForecast,
  AIRecommendation,
  HistoricalAnalytics,
} from '@/types/analytics';
import { calculateMean, calculateMax, calculateMin, calculateMovingAverage } from './statistics';
import { calculateOccupancyPercentage, calculateCrowdLevel } from './crowdCalculator';

/**
 * Main Analytics Engine
 * Processes historical data to generate analytics insights
 */
export class AnalyticsEngine {
  
  /**
   * Get date range from filter
   */
  static getDateRange(filter: DateRangeFilter): { startDate: Date; endDate: Date } {
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    switch (filter.range) {
      case 'TODAY':
        break;
      case 'YESTERDAY':
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'LAST_7_DAYS':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'LAST_30_DAYS':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'LAST_90_DAYS':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'CUSTOM':
        if (filter.startDate) startDate = filter.startDate;
        if (filter.endDate) endDate = filter.endDate;
        break;
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Filter reports by date range and other filters
   */
  static filterReports(
    reports: ICrowdReportDocument[],
    filters: AnalyticsFilters
  ): ICrowdReportDocument[] {
    const { startDate, endDate } = this.getDateRange(filters.dateRange);
    
    return reports.filter(report => {
      if (report.createdAt < startDate || report.createdAt > endDate) return false;
      if (filters.stationId && report.stationId !== filters.stationId) return false;
      if (filters.routeId && report.routeId !== filters.routeId) return false;
      if (filters.vehicleId && report.vehicleId !== filters.vehicleId) return false;
      return true;
    });
  }
  
  /**
   * Filter vehicles by status and other filters
   */
  static filterVehicles(
    vehicles: ILiveVehicleDocument[],
    filters: AnalyticsFilters
  ): ILiveVehicleDocument[] {
    return vehicles.filter(vehicle => {
      if (filters.status && vehicle.status !== filters.status) return false;
      if (filters.routeId && vehicle.route !== filters.routeId) return false;
      if (filters.vehicleId && vehicle.vehicleId !== filters.vehicleId) return false;
      return true;
    });
  }
  
  /**
   * Generate passenger trend data
   */
  static generatePassengerTrend(
    reports: ICrowdReportDocument[],
    groupBy: 'hour' | 'day' | 'week' = 'day'
  ): PassengerTrend[] {
    const grouped: Record<string, { count: number; occupancy: number[] }> = {};
    
    reports.forEach(report => {
      let key: string;
      const date = new Date(report.createdAt);
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = { count: 0, occupancy: [] };
      }
      grouped[key].count += report.passengerCount;
      grouped[key].occupancy.push(report.occupancyPercentage);
    });
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date: new Date(date),
        count: data.count,
        occupancy: calculateMean(data.occupancy),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  /**
   * Generate occupancy trend data
   */
  static generateOccupancyTrend(
    reports: ICrowdReportDocument[],
    groupBy: 'hour' | 'day' = 'hour'
  ): OccupancyTrend[] {
    const grouped: Record<string, number[]> = {};
    
    reports.forEach(report => {
      let key: string;
      const date = new Date(report.createdAt);
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(report.occupancyPercentage);
    });
    
    return Object.entries(grouped)
      .map(([timestamp, occupancies]) => ({
        timestamp: new Date(timestamp),
        occupancy: calculateMean(occupancies),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  /**
   * Generate vehicle trend data
   */
  static generateVehicleTrend(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    groupBy: 'hour' | 'day' = 'hour'
  ): VehicleTrend[] {
    const grouped: Record<string, { active: number; speeds: number[]; occupancies: number[] }> = {};
    
    // Group by time
    const timeGroups = groupBy === 'hour' ? 24 : 30; // hours or days
    
    for (let i = 0; i < timeGroups; i++) {
      const key = i.toString();
      grouped[key] = { active: 0, speeds: [], occupancies: [] };
    }
    
    vehicles.forEach(vehicle => {
      const hour = vehicle.lastUpdated.getHours();
      const key = hour.toString();
      if (grouped[key]) {
        grouped[key].active++;
        grouped[key].speeds.push(vehicle.speed);
      }
    });
    
    reports.forEach(report => {
      const hour = report.createdAt.getHours();
      const key = hour.toString();
      if (grouped[key]) {
        grouped[key].occupancies.push(report.occupancyPercentage);
      }
    });
    
    return Object.entries(grouped)
      .map(([_, data]) => ({
        timestamp: new Date(),
        activeVehicles: data.active,
        averageSpeed: calculateMean(data.speeds),
        averageOccupancy: calculateMean(data.occupancies),
      }));
  }
  
  /**
   * Generate prediction trend data
   */
  static generatePredictionTrend(
    predictions: IPredictionDocument[],
    groupBy: 'hour' | 'day' = 'hour'
  ): PredictionTrend[] {
    const grouped: Record<string, { accuracies: number[]; confidences: number[]; risks: string[] }> = {};
    
    predictions.forEach(prediction => {
      let key: string;
      const date = new Date(prediction.generatedAt);
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = { accuracies: [], confidences: [], risks: [] };
      }
      grouped[key].accuracies.push(prediction.confidence);
      grouped[key].confidences.push(prediction.confidence);
      grouped[key].risks.push(prediction.risk);
    });
    
    return Object.entries(grouped)
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp),
        accuracy: calculateMean(data.accuracies),
        confidence: calculateMean(data.confidences),
        riskLevel: this.getMostFrequentRisk(data.risks),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  /**
   * Generate alert trend data
   */
  static generateAlertTrend(
    predictions: IPredictionDocument[],
    groupBy: 'hour' | 'day' = 'hour'
  ): AlertTrend[] {
    const grouped: Record<string, { info: number; warning: number; critical: number }> = {};
    
    predictions.forEach(prediction => {
      let key: string;
      const date = new Date(prediction.generatedAt);
      
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
      }
      
      if (!grouped[key]) {
        grouped[key] = { info: 0, warning: 0, critical: 0 };
      }
      
      if (prediction.risk === 'LOW') {
        grouped[key].info++;
      } else if (prediction.risk === 'MEDIUM' || prediction.risk === 'HIGH') {
        grouped[key].warning++;
      } else if (prediction.risk === 'CRITICAL') {
        grouped[key].critical++;
      }
    });
    
    return Object.entries(grouped)
      .map(([timestamp, data]) => {
        const total = data.info + data.warning + data.critical;
        const severity: 'INFO' | 'WARNING' | 'CRITICAL' = data.critical > 0 ? 'CRITICAL' : data.warning > 0 ? 'WARNING' : 'INFO';
        return {
          timestamp: new Date(timestamp),
          count: total,
          severity,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  /**
   * Generate heatmap data for occupancy
   */
  static generateHeatmapData(reports: ICrowdReportDocument[]): HeatmapData[] {
    const stationData: Record<string, Record<number, Record<number, number[]>>> = {};
    
    reports.forEach(report => {
      const stationId = report.stationId;
      const hour = report.createdAt.getHours();
      const dayOfWeek = report.createdAt.getDay();
      
      if (!stationData[stationId]) {
        stationData[stationId] = {};
      }
      if (!stationData[stationId][hour]) {
        stationData[stationId][hour] = {};
      }
      if (!stationData[stationId][hour][dayOfWeek]) {
        stationData[stationId][hour][dayOfWeek] = [];
      }
      stationData[stationId][hour][dayOfWeek].push(report.occupancyPercentage);
    });
    
    const heatmapData: HeatmapData[] = [];
    
    Object.entries(stationData).forEach(([stationId, hours]) => {
      Object.entries(hours).forEach(([hour, days]) => {
        Object.entries(days).forEach(([dayOfWeek, occupancies]) => {
          const avgOccupancy = calculateMean(occupancies);
          heatmapData.push({
            stationId,
            stationName: stationId, // Would need to fetch actual name
            hour: parseInt(hour),
            dayOfWeek: parseInt(dayOfWeek),
            occupancy: avgOccupancy,
            color: this.getHeatmapColor(avgOccupancy),
          });
        });
      });
    });
    
    return heatmapData;
  }
  
  /**
   * Generate station analytics
   */
  static generateStationAnalytics(reports: ICrowdReportDocument[]): StationAnalytics[] {
    const stationData: Record<string, {
      occupancies: number[];
      waitingPassengers: number[];
      reports: ICrowdReportDocument[];
    }> = {};
    
    reports.forEach(report => {
      if (!stationData[report.stationId]) {
        stationData[report.stationId] = { occupancies: [], waitingPassengers: [], reports: [] };
      }
      stationData[report.stationId].occupancies.push(report.occupancyPercentage);
      stationData[report.stationId].waitingPassengers.push(report.passengerCount);
      stationData[report.stationId].reports.push(report);
    });
    
    return Object.entries(stationData)
      .map(([stationId, data]) => {
        const occupancies = data.occupancies;
        return {
          stationId,
          stationName: stationId,
          averageOccupancy: calculateMean(occupancies),
          maxOccupancy: calculateMax(occupancies),
          minOccupancy: calculateMin(occupancies),
          totalReports: data.reports.length,
          averageWaitingPassengers: calculateMean(data.waitingPassengers),
          peakHour: this.getPeakHour(data.reports),
          peakDay: this.getPeakDay(data.reports),
          rank: 0,
        };
      })
      .sort((a, b) => b.averageOccupancy - a.averageOccupancy)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  
  /**
   * Generate route analytics
   */
  static generateRouteAnalytics(
    reports: ICrowdReportDocument[],
    vehicles: ILiveVehicleDocument[]
  ): RouteAnalytics[] {
    const routeData: Record<string, {
      occupancies: number[];
      speeds: number[];
      delays: number[];
      reports: ICrowdReportDocument[];
      routeVehicles: ILiveVehicleDocument[];
    }> = {};
    
    reports.forEach(report => {
      if (!routeData[report.routeId]) {
        routeData[report.routeId] = { occupancies: [], speeds: [], delays: [], reports: [], routeVehicles: [] };
      }
      routeData[report.routeId].occupancies.push(report.occupancyPercentage);
      routeData[report.routeId].reports.push(report);
    });
    
    vehicles.forEach(vehicle => {
      if (!routeData[vehicle.route]) {
        routeData[vehicle.route] = { occupancies: [], speeds: [], delays: [], reports: [], routeVehicles: [] };
      }
      routeData[vehicle.route].speeds.push(vehicle.speed);
      routeData[vehicle.route].delays.push(vehicle.status === 'DELAYED' ? 1 : 0);
      routeData[vehicle.route].routeVehicles.push(vehicle);
    });
    
    return Object.entries(routeData)
      .map(([routeId, data]) => {
        const occupancies = data.occupancies.length > 0 ? data.occupancies : [0];
        const speeds = data.speeds.length > 0 ? data.speeds : [0];
        const delays = data.delays.length > 0 ? data.delays : [0];
        
        return {
          routeId,
          routeName: routeId,
          averageOccupancy: calculateMean(occupancies),
          maxOccupancy: calculateMax(occupancies),
          minOccupancy: calculateMin(occupancies),
          totalReports: data.reports.length,
          efficiency: this.calculateRouteEfficiency(data),
          averageSpeed: calculateMean(speeds),
          averageDelay: calculateMean(delays) * 10, // Convert to minutes
          rank: 0,
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  
  /**
   * Generate vehicle analytics
   */
  static generateVehicleAnalytics(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[]
  ): VehicleAnalytics[] {
    const vehicleData: Record<string, {
      occupancies: number[];
      speeds: number[];
      reports: ICrowdReportDocument[];
    }> = {};
    
    reports.forEach(report => {
      if (!vehicleData[report.vehicleId]) {
        vehicleData[report.vehicleId] = { occupancies: [], speeds: [], reports: [] };
      }
      vehicleData[report.vehicleId].occupancies.push(report.occupancyPercentage);
      vehicleData[report.vehicleId].reports.push(report);
    });
    
    return vehicles.map(vehicle => {
      const data = vehicleData[vehicle.vehicleId] || { occupancies: [], speeds: [], reports: [] };
      const occupancies = data.occupancies.length > 0 ? data.occupancies : [(vehicle.currentPassengers / vehicle.capacity) * 100];
      
      const operatingHours = this.calculateOperatingHours(vehicle);
      
      return {
        vehicleId: vehicle.vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        routeId: vehicle.route,
        averageOccupancy: calculateMean(occupancies),
        maxOccupancy: calculateMax(occupancies),
        totalTrips: data.reports.length,
        operatingHours,
        averageSpeed: vehicle.speed,
        utilizationRate: (vehicle.currentPassengers / vehicle.capacity) * 100,
        status: vehicle.status,
        rank: 0,
      };
    })
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  
  /**
   * Generate route performance metrics
   */
  static generateRoutePerformance(
    reports: ICrowdReportDocument[],
    vehicles: ILiveVehicleDocument[]
  ): RoutePerformance[] {
    const routeData: Record<string, {
      occupancies: number[];
      delays: number[];
      vehicles: ILiveVehicleDocument[];
    }> = {};
    
    reports.forEach(report => {
      if (!routeData[report.routeId]) {
        routeData[report.routeId] = { occupancies: [], delays: [], vehicles: [] };
      }
      routeData[report.routeId].occupancies.push(report.occupancyPercentage);
    });
    
    vehicles.forEach(vehicle => {
      if (!routeData[vehicle.route]) {
        routeData[vehicle.route] = { occupancies: [], delays: [], vehicles: [] };
      }
      routeData[vehicle.route].delays.push(vehicle.status === 'DELAYED' ? 1 : 0);
      routeData[vehicle.route].vehicles.push(vehicle);
    });
    
    return Object.entries(routeData).map(([routeId, data]) => {
      const onTimeVehicles = data.vehicles.filter(v => v.status !== 'DELAYED').length;
      const onTimeRate = data.vehicles.length > 0 ? (onTimeVehicles / data.vehicles.length) * 100 : 100;
      const avgDelay = calculateMean(data.delays) * 15; // Convert to minutes
      
      return {
        routeId,
        routeName: routeId,
        efficiency: calculateMean(data.occupancies),
        onTimeRate,
        averageDelay: avgDelay,
        passengerSatisfaction: 100 - avgDelay, // Proxy metric
        costEfficiency: onTimeRate * 0.5 + calculateMean(data.occupancies) * 0.5,
      };
    });
  }
  
  /**
   * Generate vehicle utilization metrics
   */
  static generateVehicleUtilization(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[]
  ): VehicleUtilization[] {
    return vehicles.map(vehicle => {
      const vehicleReports = reports.filter(r => r.vehicleId === vehicle.vehicleId);
      const avgOccupancy = vehicleReports.length > 0
        ? calculateMean(vehicleReports.map(r => r.occupancyPercentage))
        : (vehicle.currentPassengers / vehicle.capacity) * 100;
      
      const operatingHours = this.calculateOperatingHours(vehicle);
      const utilizationRate = avgOccupancy;
      
      return {
        vehicleId: vehicle.vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        utilizationRate,
        operatingHours,
        idleTime: Math.max(0, 24 - operatingHours),
        tripsCompleted: vehicleReports.length,
        averageOccupancy: avgOccupancy,
      };
    });
  }
  
  /**
   * Generate peak hour analysis
   */
  static generatePeakHourAnalysis(reports: ICrowdReportDocument[]): PeakHourAnalysis[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hourlyData: Record<number, {
      occupancies: number[];
      passengers: number;
      vehicles: Set<string>;
    }> = {};
    
    reports.forEach(report => {
      const hour = report.createdAt.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { occupancies: [], passengers: 0, vehicles: new Set() };
      }
      hourlyData[hour].occupancies.push(report.occupancyPercentage);
      hourlyData[hour].passengers += report.passengerCount;
      hourlyData[hour].vehicles.add(report.vehicleId);
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => {
      const avgOccupancy = calculateMean(data.occupancies);
      const congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 
        avgOccupancy < 40 ? 'LOW' : avgOccupancy < 60 ? 'MEDIUM' : avgOccupancy < 80 ? 'HIGH' : 'CRITICAL';
      
      return {
        hour: parseInt(hour),
        dayOfWeek: 'All Days',
        averageOccupancy: avgOccupancy,
        passengerCount: data.passengers,
        vehicleCount: data.vehicles.size,
        congestionLevel,
      };
    }).sort((a, b) => a.hour - b.hour);
  }
  
  /**
   * Generate demand forecast
   */
  static generateDemandForecast(
    reports: ICrowdReportDocument[],
    daysAhead: number = 7
  ): DemandForecast[] {
    const forecasts: DemandForecast[] = [];
    const trend = this.generatePassengerTrend(reports, 'day');
    
    if (trend.length < 2) {
      return forecasts;
    }
    
    const recentTrend = calculateMovingAverage(trend.map(t => t.count), Math.min(5, trend.length));
    const lastValue = recentTrend[recentTrend.length - 1];
    const growthRate = (lastValue - recentTrend[0]) / Math.max(1, recentTrend[0]);
    
    for (let i = 1; i <= daysAhead; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const predictedDemand = lastValue * (1 + growthRate * i * 0.1);
      const confidence = Math.max(50, 95 - i * 5);
      
      const factors: string[] = [];
      if (growthRate > 0.1) factors.push('Increasing trend');
      if (growthRate < -0.1) factors.push('Decreasing trend');
      factors.push('Historical patterns');
      
      const recommendedActions: string[] = [];
      if (predictedDemand > lastValue * 1.2) {
        recommendedActions.push('Consider increasing vehicle frequency');
      } else if (predictedDemand < lastValue * 0.8) {
        recommendedActions.push('Consider reducing service frequency');
      }
      
      forecasts.push({
        date: forecastDate,
        predictedDemand: Math.round(predictedDemand),
        confidence: Math.round(confidence),
        factors,
        recommendedActions,
      });
    }
    
    return forecasts;
  }
  
  /**
   * Generate AI recommendations
   */
  static generateAIRecommendations(
    reports: ICrowdReportDocument[],
    vehicles: ILiveVehicleDocument[],
    predictions: IPredictionDocument[]
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    
    // Check for overcrowded routes
    const routeAnalytics = this.generateRouteAnalytics(reports, vehicles);
    const overcrowdedRoutes = routeAnalytics.filter(r => r.averageOccupancy > 80);
    overcrowdedRoutes.forEach(route => {
      recommendations.push({
        id: `rec-dispatch-${route.routeId}-${Date.now()}`,
        type: 'DISPATCH',
        priority: route.averageOccupancy > 90 ? 'URGENT' : 'HIGH',
        title: `Dispatch additional vehicles to Route ${route.routeId}`,
        description: `Route ${route.routeId} is experiencing ${route.averageOccupancy.toFixed(0)}% average occupancy. Additional vehicles are recommended to reduce congestion.`,
        targetId: route.routeId,
        targetName: route.routeName,
        expectedImpact: `Reduce occupancy by approximately ${Math.round(route.averageOccupancy - 70)}%`,
        confidence: Math.round(route.averageOccupancy),
        generatedAt: new Date(),
        status: 'PENDING',
      });
    });
    
    // Check for underutilized routes
    const underutilizedRoutes = routeAnalytics.filter(r => r.averageOccupancy < 30);
    underutilizedRoutes.forEach(route => {
      recommendations.push({
        id: `rec-reduce-${route.routeId}-${Date.now()}`,
        type: 'REDUCE_SERVICE',
        priority: 'LOW',
        title: `Reduce service frequency on Route ${route.routeId}`,
        description: `Route ${route.routeId} has low utilization at ${route.averageOccupancy.toFixed(0)}%. Consider reducing frequency to optimize resources.`,
        targetId: route.routeId,
        targetName: route.routeName,
        expectedImpact: `Save operational costs while maintaining service quality`,
        confidence: Math.round(100 - route.averageOccupancy),
        generatedAt: new Date(),
        status: 'PENDING',
      });
    });
    
    // Check for peak hour patterns
    const peakHourAnalysis = this.generatePeakHourAnalysis(reports);
    const peakHours = peakHourAnalysis.filter(ph => ph.congestionLevel === 'HIGH' || ph.congestionLevel === 'CRITICAL');
    peakHours.forEach(ph => {
      recommendations.push({
        id: `rec-freq-${ph.hour}-${Date.now()}`,
        type: 'FREQUENCY',
        priority: ph.congestionLevel === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        title: `Increase frequency during ${ph.hour}:00 hour`,
        description: `Peak congestion detected at ${ph.hour}:00 with ${ph.averageOccupancy.toFixed(0)}% occupancy. Increase frequency during this time.`,
        expectedImpact: `Reduce wait times and improve passenger experience`,
        confidence: Math.round(ph.averageOccupancy),
        generatedAt: new Date(),
        status: 'PENDING',
      });
    });
    
    // Check for critical predictions
    const criticalPredictions = predictions.filter(p => p.risk === 'CRITICAL');
    criticalPredictions.forEach(prediction => {
      recommendations.push({
        id: `rec-congestion-${prediction.stationId}-${Date.now()}`,
        type: 'CONGESTION',
        priority: 'URGENT',
        title: `High congestion expected at ${prediction.stationName}`,
        description: prediction.recommendation,
        targetId: prediction.stationId,
        targetName: prediction.stationName,
        expectedImpact: `Prevent overcrowding and maintain safety`,
        confidence: prediction.confidence,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    });
    
    // Check for vehicle optimization opportunities
    const vehicleAnalytics = this.generateVehicleAnalytics(vehicles, reports);
    const lowUtilizationVehicles = vehicleAnalytics.filter(v => v.utilizationRate < 40);
    if (lowUtilizationVehicles.length > 2) {
      recommendations.push({
        id: `rec-optimize-${Date.now()}`,
        type: 'OPTIMIZATION',
        priority: 'MEDIUM',
        title: 'Optimize vehicle distribution',
        description: `${lowUtilizationVehicles.length} vehicles have low utilization. Consider redistributing vehicles to high-demand routes.`,
        expectedImpact: 'Improve overall fleet efficiency and reduce costs',
        confidence: 75,
        generatedAt: new Date(),
        status: 'PENDING',
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  /**
   * Generate historical analytics summary
   */
  static generateHistoricalAnalytics(
    reports: ICrowdReportDocument[],
    dateRange: DateRangeFilter
  ): HistoricalAnalytics {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const filteredReports = reports.filter(r => r.createdAt >= startDate && r.createdAt <= endDate);
    
    const occupancies = filteredReports.map(r => r.occupancyPercentage);
    const peakHour = this.getPeakHour(filteredReports);
    const peakDay = this.getPeakDay(filteredReports);
    
    return {
      period: dateRange.range,
      startDate,
      endDate,
      totalReports: filteredReports.length,
      averageOccupancy: calculateMean(occupancies),
      maxOccupancy: calculateMax(occupancies),
      minOccupancy: calculateMin(occupancies),
      peakHour,
      peakDay,
      totalPassengers: filteredReports.reduce((sum, r) => sum + r.passengerCount, 0),
      uniqueStations: new Set(filteredReports.map(r => r.stationId)).size,
      uniqueRoutes: new Set(filteredReports.map(r => r.routeId)).size,
      uniqueVehicles: new Set(filteredReports.map(r => r.vehicleId)).size,
    };
  }
  
  // Helper methods
  
  private static getHeatmapColor(occupancy: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (occupancy < 40) return 'green';
    if (occupancy < 60) return 'yellow';
    if (occupancy < 80) return 'orange';
    return 'red';
  }
  
  private static getMostFrequentRisk(risks: string[]): string {
    const counts: Record<string, number> = {};
    risks.forEach(risk => {
      counts[risk] = (counts[risk] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'LOW';
  }
  
  private static getPeakHour(reports: ICrowdReportDocument[]): number {
    const hourlyData: Record<number, number[]> = {};
    reports.forEach(report => {
      const hour = report.createdAt.getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(report.occupancyPercentage);
    });
    
    let peakHour = 0;
    let maxOccupancy = 0;
    Object.entries(hourlyData).forEach(([hour, occupancies]) => {
      const avg = calculateMean(occupancies);
      if (avg > maxOccupancy) {
        maxOccupancy = avg;
        peakHour = parseInt(hour);
      }
    });
    return peakHour;
  }
  
  private static getPeakDay(reports: ICrowdReportDocument[]): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData: Record<number, number[]> = {};
    reports.forEach(report => {
      const day = report.createdAt.getDay();
      if (!dailyData[day]) dailyData[day] = [];
      dailyData[day].push(report.occupancyPercentage);
    });
    
    let peakDay = 0;
    let maxOccupancy = 0;
    Object.entries(dailyData).forEach(([day, occupancies]) => {
      const avg = calculateMean(occupancies);
      if (avg > maxOccupancy) {
        maxOccupancy = avg;
        peakDay = parseInt(day);
      }
    });
    return dayNames[peakDay];
  }
  
  private static calculateRouteEfficiency(data: {
    occupancies: number[];
    speeds: number[];
    delays: number[];
    reports: ICrowdReportDocument[];
    routeVehicles: ILiveVehicleDocument[];
  }): number {
    const avgOccupancy = calculateMean(data.occupancies.length > 0 ? data.occupancies : [0]);
    const avgSpeed = calculateMean(data.speeds.length > 0 ? data.speeds : [0]);
    const onTimeRate = data.delays.length > 0 ? 1 - calculateMean(data.delays) : 1;
    
    return (avgOccupancy * 0.4 + avgSpeed * 0.3 + onTimeRate * 100 * 0.3) / 100;
  }
  
  private static calculateOperatingHours(vehicle: ILiveVehicleDocument): number {
    // Simplified calculation - in production, track actual operating hours
    const hoursSinceUpdate = (Date.now() - vehicle.lastUpdated.getTime()) / (1000 * 60 * 60);
    return vehicle.status !== 'OFFLINE' ? Math.min(24, hoursSinceUpdate) : 0;
  }
}
