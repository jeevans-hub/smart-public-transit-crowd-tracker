import PredictionHistory from '@/models/PredictionHistory';
import CrowdReport from '@/models/CrowdReport';
import { IPrediction, IPredictionDocument, IPredictionResponse, IPredictionMetrics, PredictionWindow, IHistoricalData } from '@/types/prediction';
import { PredictionEngine } from '@/utils/predictionEngine';
import { socketServer } from '@/server/socket';

/**
 * Create a new prediction
 */
export async function createPrediction(data: {
  stationId: string;
  stationName: string;
  window: PredictionWindow;
}): Promise<IPredictionDocument> {
  // Fetch historical crowd data for this station
  const historicalReports = await CrowdReport.find({ stationId: data.stationId })
    .sort({ createdAt: -1 })
    .limit(100);
  
  // Convert to IHistoricalData format
  const historicalData: IHistoricalData[] = historicalReports.map((report) => ({
    timestamp: report.createdAt,
    occupancyPercentage: report.occupancyPercentage,
    passengerCount: report.passengerCount,
    crowdLevel: report.crowdLevel,
  }));
  
  // Generate prediction using the engine
  const prediction = PredictionEngine.generatePrediction(
    data.stationId,
    data.stationName,
    historicalData,
    data.window
  );
  
  // Save to database
  const predictionRecord = new PredictionHistory(prediction);
  await predictionRecord.save();
  
  // Broadcast socket events
  if (socketServer.isActive()) {
    const response = toPredictionResponse(predictionRecord);
    socketServer.broadcastPredictionGenerated(response);
    
    // Generate and broadcast alerts
    const alerts = PredictionEngine.generateAlerts(
      predictionRecord.stationId,
      predictionRecord.stationName,
      historicalData,
      prediction
    );
    alerts.forEach((alert) => {
      socketServer.broadcastPredictionAlert(predictionRecord.stationId, predictionRecord.stationName, alert);
    });
    
    // Generate and broadcast insights
    const insights = PredictionEngine.generateInsights(
      predictionRecord.stationId,
      predictionRecord.stationName,
      historicalData,
      prediction
    );
    insights.forEach((insight) => {
      socketServer.broadcastPredictionInsight(predictionRecord.stationId, predictionRecord.stationName, insight);
    });
    
    // Broadcast trend and confidence
    socketServer.broadcastPredictionTrend(
      predictionRecord.stationId,
      predictionRecord.stationName,
      predictionRecord.trend,
      predictionRecord.confidence
    );
    socketServer.broadcastPredictionConfidence(
      predictionRecord.stationId,
      predictionRecord.stationName,
      predictionRecord.confidence,
      predictionRecord.risk
    );
    
    // Broadcast timeline event
    socketServer.broadcastTimelineEvent({
      type: 'Prediction Generated',
      timestamp: new Date(),
      data: {
        stationId: predictionRecord.stationId,
        stationName: predictionRecord.stationName,
        predictedCrowd: predictionRecord.predictedCrowd,
        confidence: predictionRecord.confidence,
      },
    });
  }
  
  return predictionRecord;
}

/**
 * Get prediction by ID
 */
export async function getPredictionById(id: string): Promise<IPredictionDocument | null> {
  return PredictionHistory.findById(id);
}

/**
 * Get predictions for a station
 */
export async function getPredictionsByStation(stationId: string, limit: number = 20): Promise<IPredictionDocument[]> {
  return PredictionHistory.find({ stationId })
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Get recent predictions
 */
export async function getRecentPredictions(limit: number = 20): Promise<IPredictionDocument[]> {
  return PredictionHistory.find()
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Get predictions with filters
 */
export async function getPredictions(filters: {
  stationId?: string;
  window?: PredictionWindow;
  risk?: string;
  limit?: number;
  page?: number;
}): Promise<{ predictions: IPredictionDocument[]; total: number }> {
  const query: any = {};
  
  if (filters.stationId) query.stationId = filters.stationId;
  if (filters.window) query.predictionWindow = filters.window;
  if (filters.risk) query.risk = filters.risk as any;
  
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const skip = (page - 1) * limit;
  
  const predictions = await PredictionHistory.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await PredictionHistory.countDocuments(query);
  
  return { predictions, total };
}

/**
 * Delete prediction by ID
 */
export async function deletePrediction(id: string): Promise<IPredictionDocument | null> {
  const prediction = await PredictionHistory.findByIdAndDelete(id);
  
  if (prediction && socketServer.isActive()) {
    socketServer.broadcastPredictionDeleted(id, prediction.stationId);
    
    // Broadcast timeline event
    socketServer.broadcastTimelineEvent({
      type: 'Prediction Deleted',
      timestamp: new Date(),
      data: {
        stationId: prediction.stationId,
        stationName: prediction.stationName,
      },
    });
  }
  
  return prediction;
}

/**
 * Delete old predictions (cleanup)
 */
export async function deleteOldPredictions(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await PredictionHistory.deleteMany({
    createdAt: { $lt: cutoffDate },
  });
  return result.deletedCount || 0;
}

/**
 * Calculate prediction metrics
 */
export async function calculatePredictionMetrics(): Promise<IPredictionMetrics> {
  const predictions = await PredictionHistory.find()
    .sort({ createdAt: -1 })
    .limit(100);
  
  return PredictionEngine.calculateMetrics(predictions);
}

/**
 * Get prediction metrics for a specific station
 */
export async function getStationPredictionMetrics(stationId: string): Promise<IPredictionMetrics> {
  const predictions = await PredictionHistory.find({ stationId })
    .sort({ createdAt: -1 })
    .limit(100);
  
  return PredictionEngine.calculateMetrics(predictions);
}

/**
 * Get prediction statistics
 */
export async function getPredictionStatistics(): Promise<{
  totalPredictions: number;
  predictionsToday: number;
  averageConfidence: number;
  highRiskCount: number;
  criticalRiskCount: number;
  mostPredictedStation: { stationId: string; stationName: string; count: number } | null;
}> {
  const totalPredictions = await PredictionHistory.countDocuments();
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const predictionsToday = await PredictionHistory.countDocuments({
    createdAt: { $gte: startOfDay },
  });
  
  const allPredictions = await PredictionHistory.find();
  const averageConfidence = allPredictions.length > 0
    ? allPredictions.reduce((sum, p) => sum + p.confidence, 0) / allPredictions.length
    : 0;
  
  const highRiskCount = await PredictionHistory.countDocuments({ risk: 'HIGH' as any });
  const criticalRiskCount = await PredictionHistory.countDocuments({ risk: 'CRITICAL' as any });
  
  // Find most predicted station
  const stationCounts = await PredictionHistory.aggregate([
    { $group: { _id: { stationId: '$stationId', stationName: '$stationName' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  
  const mostPredictedStation = stationCounts.length > 0
    ? {
        stationId: stationCounts[0]._id.stationId,
        stationName: stationCounts[0]._id.stationName,
        count: stationCounts[0].count,
      }
    : null;
  
  return {
    totalPredictions,
    predictionsToday,
    averageConfidence,
    highRiskCount,
    criticalRiskCount,
    mostPredictedStation,
  };
}

/**
 * Convert prediction document to response
 */
export function toPredictionResponse(prediction: IPredictionDocument): IPredictionResponse {
  return {
    _id: prediction._id.toString(),
    stationId: prediction.stationId,
    stationName: prediction.stationName,
    currentCrowd: prediction.currentCrowd,
    predictedCrowd: prediction.predictedCrowd,
    predictionWindow: prediction.predictionWindow,
    confidence: prediction.confidence,
    trend: prediction.trend,
    risk: prediction.risk,
    algorithm: prediction.algorithm,
    historyUsed: prediction.historyUsed,
    recommendation: prediction.recommendation,
    explanation: prediction.explanation,
    generatedAt: prediction.generatedAt,
    createdAt: prediction.createdAt,
    updatedAt: prediction.updatedAt,
  };
}

/**
 * Generate batch predictions for multiple stations
 */
export async function generateBatchPredictions(stationConfigs: {
  stationId: string;
  stationName: string;
  window: PredictionWindow;
}[]): Promise<IPredictionDocument[]> {
  const predictions = await Promise.all(
    stationConfigs.map((config) => createPrediction(config))
  );
  return predictions;
}

/**
 * Get latest prediction for a station
 */
export async function getLatestPrediction(stationId: string): Promise<IPredictionDocument | null> {
  return PredictionHistory.findOne({ stationId }).sort({ createdAt: -1 });
}

/**
 * Get predictions by risk level
 */
export async function getPredictionsByRisk(risk: string, limit: number = 20): Promise<IPredictionDocument[]> {
  return PredictionHistory.find({ risk: risk as any })
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Get critical predictions requiring immediate attention
 */
export async function getCriticalPredictions(): Promise<IPredictionDocument[]> {
  return PredictionHistory.find({
    $or: [
      { risk: 'CRITICAL' as any },
      { predictedCrowd: { $gte: 90 } },
      { trend: 'RAPID_GROWTH' as any },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(50);
}
