import connectDB from '@/lib/mongodb';
import BmtcCrowdAlertModel from '@/models/BmtcCrowdAlert';
import { socketServer } from '@/server/socket';
import type { BmtcCrowdAlert, BmtcRecommendation } from '@/types/recommendation';
import { evaluateBmtcAlert } from '@/utils/bmtcAlertEvaluator';

function toAlert(document: InstanceType<typeof BmtcCrowdAlertModel>): BmtcCrowdAlert {
  return {
    id: document._id.toString(),
    userId: document.userId,
    routeNumber: document.routeNumber,
    stopId: document.stopId,
    ...(document.destinationStopId ? { destinationStopId: document.destinationStopId } : {}),
    threshold: document.threshold,
    ...(document.arrivalWithinMinutes ? { arrivalWithinMinutes: document.arrivalWithinMinutes } : {}),
    onlyIfBetterAlternative: document.onlyIfBetterAlternative,
    enabled: document.enabled,
    ...(document.lastTriggeredAt ? { lastTriggeredAt: document.lastTriggeredAt.toISOString() } : {}),
  };
}

export async function createBmtcAlert(userId: string, input: Omit<BmtcCrowdAlert, 'id' | 'userId' | 'lastTriggeredAt'>): Promise<BmtcCrowdAlert> {
  await connectDB();
  const document = await BmtcCrowdAlertModel.create({ userId, ...input });
  return toAlert(document);
}

export async function listBmtcAlerts(userId: string): Promise<BmtcCrowdAlert[]> {
  await connectDB();
  const documents = await BmtcCrowdAlertModel.find({ userId }).sort({ createdAt: -1 });
  return documents.map(toAlert);
}

export async function deleteBmtcAlert(userId: string, id: string): Promise<boolean> {
  await connectDB();
  const result = await BmtcCrowdAlertModel.deleteOne({ _id: id, userId });
  return result.deletedCount === 1;
}

export async function evaluateUserBmtcAlerts(userId: string, recommendation: BmtcRecommendation): Promise<void> {
  try {
    await connectDB();
    const documents = await BmtcCrowdAlertModel.find({ userId, enabled: true, stopId: recommendation.selectedStopId });
    for (const document of documents) {
      const evaluation = evaluateBmtcAlert({
        routeNumber: document.routeNumber,
        stopId: document.stopId,
        destinationStopId: document.destinationStopId,
        threshold: document.threshold,
        arrivalWithinMinutes: document.arrivalWithinMinutes,
        onlyIfBetterAlternative: document.onlyIfBetterAlternative,
        enabled: document.enabled,
        lastTriggeredAt: document.lastTriggeredAt,
        lastFingerprint: document.lastFingerprint,
      }, recommendation);
      if (!evaluation.shouldTrigger || !evaluation.fingerprint || !evaluation.message) continue;
      document.lastTriggeredAt = new Date();
      document.lastFingerprint = evaluation.fingerprint;
      await document.save();
      if (socketServer.isActive()) socketServer.broadcastBmtcAlert({ alertId: document._id.toString(), message: evaluation.message, recommendation, dataSource: recommendation.dataSource });
    }
  } catch (error) {
    console.error('BMTC alert evaluation skipped:', error instanceof Error ? error.message : 'unknown error');
  }
}
