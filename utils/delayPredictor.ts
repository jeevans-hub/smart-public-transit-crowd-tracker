import { ILiveVehicleDocument } from '@/types/vehicle';
import { ICrowdReportDocument } from '@/types/crowd';
import { IPredictionDocument } from '@/types/prediction';
import { DelayPrediction } from '@/types/operations';
import { calculateMean } from './statistics';

/**
 * Delay Prediction Engine
 * Predicts arrival delays based on current conditions
 */
export class DelayPredictor {
  
  /**
   * Predict delay for a vehicle
   */
  static predictDelay(
    vehicle: ILiveVehicleDocument,
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): DelayPrediction {
    const vehicleReports = reports.filter(r => r.vehicleId === vehicle.vehicleId);
    const stationPredictions = predictions.filter(p => p.stationId === vehicle.nextStation);
    
    // Calculate factors
    const trafficRisk = this.calculateTrafficRisk(vehicle, vehicleReports);
    const stationCongestion = this.calculateStationCongestion(vehicle, stationPredictions);
    const weatherImpact = this.calculateWeatherImpact(); // Placeholder - would integrate weather API
    const historicalDelay = this.calculateHistoricalDelay(vehicle, vehicleReports);
    
    // Calculate predicted delay
    const predictedDelay = this.calculatePredictedDelay(
      trafficRisk,
      stationCongestion,
      weatherImpact,
      historicalDelay
    );
    
    // Calculate delay probability
    const delayProbability = this.calculateDelayProbability(
      trafficRisk,
      stationCongestion,
      historicalDelay
    );
    
    // Determine delay risk
    const delayRisk = this.determineDelayRisk(predictedDelay, delayProbability);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(vehicleReports.length, stationPredictions.length);
    
    // Estimate arrival time
    const estimatedArrivalTime = this.estimateArrivalTime(vehicle, predictedDelay);
    
    return {
      vehicleId: vehicle.vehicleId,
      vehicleNumber: vehicle.vehicleNumber,
      route: vehicle.route,
      currentStation: vehicle.currentStation,
      nextStation: vehicle.nextStation,
      predictedDelay: Math.round(predictedDelay),
      delayProbability: Math.round(delayProbability),
      delayRisk,
      factors: {
        trafficRisk: Math.round(trafficRisk),
        stationCongestion: Math.round(stationCongestion),
        weatherImpact: Math.round(weatherImpact),
        historicalDelay: Math.round(historicalDelay),
      },
      confidence: Math.round(confidence),
      estimatedArrivalTime,
    };
  }
  
  /**
   * Calculate traffic risk based on speed and patterns
   */
  private static calculateTrafficRisk(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (vehicle.speed < 5) return 80;
    if (vehicle.speed < 10) return 60;
    if (vehicle.speed < 20) return 40;
    if (vehicle.speed < 30) return 20;
    
    // Check for recent speed drops
    if (reports.length > 1) {
      const recentSpeeds = reports.slice(-5).map(r => {
        // In production, this would use actual speed data from reports
        return vehicle.speed;
      });
      const avgSpeed = calculateMean(recentSpeeds);
      if (avgSpeed < vehicle.speed * 0.7) return 30; // Speed dropping
    }
    
    return 10;
  }
  
  /**
   * Calculate station congestion based on predictions
   */
  private static calculateStationCongestion(vehicle: ILiveVehicleDocument, predictions: IPredictionDocument[]): number {
    if (predictions.length === 0) return 0;
    
    const highRiskPredictions = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL');
    const criticalPredictions = predictions.filter(p => p.risk === 'CRITICAL');
    
    let congestion = 0;
    congestion += highRiskPredictions.length * 20;
    congestion += criticalPredictions.length * 40;
    
    return Math.min(100, congestion);
  }
  
  /**
   * Calculate weather impact (placeholder)
   */
  private static calculateWeatherImpact(): number {
    // In production, this would integrate with a weather API
    // For now, return a default low impact
    return 5;
  }
  
  /**
   * Calculate historical delay pattern
   */
  private static calculateHistoricalDelay(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
    if (vehicle.status === 'DELAYED') return 70;
    
    // Check for delayed status in recent reports
    const delayedReports = reports.filter(r => {
      // In production, this would check actual delay data
      return false;
    });
    
    if (delayedReports.length > 0) {
      return (delayedReports.length / reports.length) * 100;
    }
    
    return 10;
  }
  
  /**
   * Calculate predicted delay in minutes
   */
  private static calculatePredictedDelay(
    trafficRisk: number,
    stationCongestion: number,
    weatherImpact: number,
    historicalDelay: number
  ): number {
    let delay = 0;
    
    // Traffic contribution
    delay += (trafficRisk / 100) * 15;
    
    // Station congestion contribution
    delay += (stationCongestion / 100) * 10;
    
    // Weather contribution
    delay += (weatherImpact / 100) * 5;
    
    // Historical pattern contribution
    delay += (historicalDelay / 100) * 8;
    
    return Math.max(0, delay);
  }
  
  /**
   * Calculate probability of delay occurring
   */
  private static calculateDelayProbability(
    trafficRisk: number,
    stationCongestion: number,
    historicalDelay: number
  ): number {
    const factors = [trafficRisk, stationCongestion, historicalDelay];
    const avgRisk = calculateMean(factors);
    
    // Convert to probability
    return Math.min(100, avgRisk);
  }
  
  /**
   * Determine delay risk level
   */
  private static determineDelayRisk(predictedDelay: number, delayProbability: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (predictedDelay >= 15 || delayProbability >= 75) return 'HIGH';
    if (predictedDelay >= 8 || delayProbability >= 50) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Calculate confidence in prediction
   */
  private static calculateConfidence(reportCount: number, predictionCount: number): number {
    const reportScore = Math.min(40, reportCount * 4);
    const predictionScore = Math.min(40, predictionCount * 5);
    const baseScore = 20;
    
    return Math.min(100, reportScore + predictionScore + baseScore);
  }
  
  /**
   * Estimate arrival time with delay
   */
  private static estimateArrivalTime(vehicle: ILiveVehicleDocument, predictedDelay: number): Date {
    // Estimate base travel time (simplified)
    const baseTravelTime = 15; // 15 minutes average between stations
    
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + baseTravelTime + predictedDelay);
    
    return arrivalTime;
  }
  
  /**
   * Batch predict delays for multiple vehicles
   */
  static predictBatchDelays(
    vehicles: ILiveVehicleDocument[],
    reports: ICrowdReportDocument[],
    predictions: IPredictionDocument[]
  ): DelayPrediction[] {
    return vehicles.map(vehicle => 
      this.predictDelay(vehicle, reports, predictions)
    );
  }
  
  /**
   * Identify vehicles with high delay risk
   */
  static identifyHighDelayRiskVehicles(delayPredictions: DelayPrediction[]): DelayPrediction[] {
    return delayPredictions.filter(p => p.delayRisk === 'HIGH');
  }
  
  /**
   * Calculate average delay across fleet
   */
  static calculateAverageDelay(delayPredictions: DelayPrediction[]): number {
    if (delayPredictions.length === 0) return 0;
    const delays = delayPredictions.map(p => p.predictedDelay);
    return calculateMean(delays);
  }
}