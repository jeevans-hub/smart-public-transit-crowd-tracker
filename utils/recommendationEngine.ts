import { IPrediction, Trend, RiskLevel } from '@/types/prediction';

/**
 * Generate operational recommendations based on prediction
 */
export function generateRecommendations(
  prediction: IPrediction,
  trend: Trend,
  risk: RiskLevel
): string {
  const recommendations: string[] = [];
  
  // Risk-based recommendations
  switch (risk) {
    case 'CRITICAL':
      recommendations.push('IMMEDIATE ACTION REQUIRED');
      recommendations.push('Dispatch emergency crowd management team');
      recommendations.push('Implement crowd control measures');
      recommendations.push('Consider temporary station closure');
      break;
      
    case 'HIGH':
      recommendations.push('Increase service frequency immediately');
      recommendations.push('Deploy additional vehicles to this route');
      recommendations.push('Alert station staff for crowd management');
      recommendations.push('Prepare contingency plans');
      break;
      
    case 'MEDIUM':
      recommendations.push('Monitor station closely');
      recommendations.push('Consider adding extra vehicles during peak times');
      recommendations.push('Prepare standby staff if needed');
      break;
      
    case 'LOW':
      recommendations.push('Maintain normal operations');
      recommendations.push('Continue regular monitoring');
      break;
  }
  
  // Trend-based recommendations
  switch (trend) {
    case 'RAPID_GROWTH':
      recommendations.push('Prepare for rapidly increasing demand');
      recommendations.push('Consider pre-positioning additional vehicles');
      recommendations.push('Alert nearby stations of potential overflow');
      break;
      
    case 'INCREASING':
      recommendations.push('Plan for gradual increase in passengers');
      recommendations.push('Adjust schedules if needed');
      break;
      
    case 'DECREASING':
    case 'RAPID_DECLINE':
      recommendations.push('Consider reducing service frequency to optimize resources');
      recommendations.push('Reallocate vehicles to higher-demand areas');
      break;
      
    case 'STABLE':
      recommendations.push('Continue current service levels');
      break;
  }
  
  // Prediction-based recommendations
  if (prediction.predictedCrowd > 90) {
    recommendations.push('Expected overcrowding - implement queue management');
    recommendations.push('Consider express services to reduce dwell time');
  } else if (prediction.predictedCrowd > 75) {
    recommendations.push('High occupancy expected - ensure adequate staffing');
  } else if (prediction.predictedCrowd < 30) {
    recommendations.push('Low occupancy expected - optimize resource allocation');
  }
  
  // Time-based recommendations
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9) {
    recommendations.push('Morning rush hour - ensure maximum vehicle availability');
  } else if (hour >= 16 && hour <= 19) {
    recommendations.push('Evening rush hour - prepare for increased demand');
  } else if (hour >= 22 || hour <= 5) {
    recommendations.push('Off-peak hours - consider reduced service frequency');
  }
  
  // Confidence-based recommendations
  if (prediction.confidence < 50) {
    recommendations.push('Low prediction confidence - increase manual monitoring');
    recommendations.push('Prepare for unexpected fluctuations');
  } else if (prediction.confidence < 70) {
    recommendations.push('Moderate prediction confidence - maintain regular monitoring');
  }
  
  // Remove duplicates and join
  const uniqueRecommendations = [...new Set(recommendations)];
  return uniqueRecommendations.join('. ') + '.';
}

/**
 * Generate specific recommendation for dispatch
 */
export function generateDispatchRecommendation(
  prediction: IPrediction,
  trend: Trend,
  risk: RiskLevel
): { shouldDispatch: boolean; vehicleCount: number; reason: string } {
  let shouldDispatch = false;
  let vehicleCount = 0;
  let reason = 'Normal operations';
  
  if (risk === 'CRITICAL') {
    shouldDispatch = true;
    vehicleCount = 3;
    reason = 'Critical risk level requires immediate vehicle deployment';
  } else if (risk === 'HIGH') {
    shouldDispatch = true;
    vehicleCount = 2;
    reason = 'High risk level warrants additional vehicles';
  } else if (risk === 'MEDIUM' && (trend === 'RAPID_GROWTH' || trend === 'INCREASING')) {
    shouldDispatch = true;
    vehicleCount = 1;
    reason = 'Medium risk with increasing trend suggests preventive deployment';
  } else if (prediction.predictedCrowd > 85) {
    shouldDispatch = true;
    vehicleCount = 1;
    reason = 'High predicted crowd density requires additional capacity';
  }
  
  return { shouldDispatch, vehicleCount, reason };
}

/**
 * Generate staffing recommendation
 */
export function generateStaffingRecommendation(
  prediction: IPrediction,
  risk: RiskLevel
): { staffingLevel: 'MINIMAL' | 'NORMAL' | 'INCREASED' | 'MAXIMUM'; reason: string } {
  let staffingLevel: 'MINIMAL' | 'NORMAL' | 'INCREASED' | 'MAXIMUM' = 'NORMAL';
  let reason = 'Normal staffing levels sufficient';
  
  if (risk === 'CRITICAL') {
    staffingLevel = 'MAXIMUM';
    reason = 'Critical risk requires maximum staffing for crowd control';
  } else if (risk === 'HIGH') {
    staffingLevel = 'INCREASED';
    reason = 'High risk level warrants increased staffing';
  } else if (prediction.predictedCrowd > 75) {
    staffingLevel = 'INCREASED';
    reason = 'High predicted occupancy requires additional staff';
  } else if (prediction.predictedCrowd < 30) {
    staffingLevel = 'MINIMAL';
    reason = 'Low predicted occupancy allows reduced staffing';
  }
  
  return { staffingLevel, reason };
}

/**
 * Generate service frequency recommendation
 */
export function generateFrequencyRecommendation(
  prediction: IPrediction,
  trend: Trend
): { frequencyAdjustment: 'INCREASE' | 'MAINTAIN' | 'DECREASE'; percentage: number; reason: string } {
  let frequencyAdjustment: 'INCREASE' | 'MAINTAIN' | 'DECREASE' = 'MAINTAIN';
  let percentage = 0;
  let reason = 'Maintain current service frequency';
  
  if (trend === 'RAPID_GROWTH' || prediction.predictedCrowd > 85) {
    frequencyAdjustment = 'INCREASE';
    percentage = 30;
    reason = 'Rapid growth or high occupancy requires increased frequency';
  } else if (trend === 'INCREASING' || prediction.predictedCrowd > 70) {
    frequencyAdjustment = 'INCREASE';
    percentage = 15;
    reason = 'Increasing trend or high occupancy suggests moderate frequency increase';
  } else if (trend === 'DECREASING' || trend === 'RAPID_DECLINE') {
    frequencyAdjustment = 'DECREASE';
    percentage = 20;
    reason = 'Decreasing trend allows frequency reduction for efficiency';
  } else if (prediction.predictedCrowd < 30) {
    frequencyAdjustment = 'DECREASE';
    percentage = 10;
    reason = 'Low occupancy allows slight frequency reduction';
  }
  
  return { frequencyAdjustment, percentage, reason };
}

/**
 * Generate operational summary
 */
export function generateOperationalSummary(
  prediction: IPrediction,
  trend: Trend,
  risk: RiskLevel
): {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actions: string[];
  monitoring: string[];
  resourceAllocation: string;
} {
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'LOW';
  const actions: string[] = [];
  const monitoring: string[] = [];
  
  // Determine priority
  if (risk === 'CRITICAL') {
    priority = 'URGENT';
  } else if (risk === 'HIGH') {
    priority = 'HIGH';
  } else if (risk === 'MEDIUM') {
    priority = 'MEDIUM';
  }
  
  // Generate actions
  const dispatch = generateDispatchRecommendation(prediction, trend, risk);
  if (dispatch.shouldDispatch) {
    actions.push(`Dispatch ${dispatch.vehicleCount} additional vehicle(s)`);
  }
  
  const staffing = generateStaffingRecommendation(prediction, risk);
  if (staffing.staffingLevel === 'MAXIMUM') {
    actions.push('Deploy maximum staffing');
  } else if (staffing.staffingLevel === 'INCREASED') {
    actions.push('Increase staffing levels');
  }
  
  const frequency = generateFrequencyRecommendation(prediction, trend);
  if (frequency.frequencyAdjustment === 'INCREASE') {
    actions.push(`Increase service frequency by ${frequency.percentage}%`);
  } else if (frequency.frequencyAdjustment === 'DECREASE') {
    actions.push(`Decrease service frequency by ${frequency.percentage}%`);
  }
  
  // Generate monitoring requirements
  if (prediction.confidence < 60) {
    monitoring.push('Increase manual monitoring due to low prediction confidence');
  }
  
  if (risk === 'HIGH' || risk === 'CRITICAL') {
    monitoring.push('Continuous real-time monitoring required');
    monitoring.push('Monitor for crowd overflow to adjacent stations');
  }
  
  if (trend === 'RAPID_GROWTH') {
    monitoring.push('Monitor for sudden demand spikes');
  }
  
  // Resource allocation
  let resourceAllocation = 'Standard resource allocation';
  if (risk === 'CRITICAL') {
    resourceAllocation = 'Maximum resource allocation - all available resources';
  } else if (risk === 'HIGH') {
    resourceAllocation = 'High resource allocation - prioritize this station';
  } else if (risk === 'MEDIUM') {
    resourceAllocation = 'Moderate resource allocation - maintain standby resources';
  }
  
  return {
    priority,
    actions,
    monitoring,
    resourceAllocation,
  };
}
