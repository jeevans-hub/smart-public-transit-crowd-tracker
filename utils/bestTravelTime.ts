import type { BestTravelWindow, CrowdTrendPoint } from '../types/recommendation.ts';

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function findBestTravelWindow(
  points: CrowdTrendPoint[],
  serviceStartHour = 6,
  serviceEndHour = 22,
): BestTravelWindow | null {
  const valid = points
    .filter((point) => point.hour >= serviceStartHour && point.hour < serviceEndHour)
    .sort((a, b) => a.crowdScore - b.crowdScore || a.hour - b.hour);
  const best = valid[0];
  if (!best) return null;
  const nextPoint = points.filter((point) => point.hour > best.hour && point.hour <= serviceEndHour).sort((a, b) => a.hour - b.hour)[0];
  const endHour = Math.min(serviceEndHour, nextPoint?.hour ?? best.hour + 2);
  return {
    suggestedStart: formatHour(best.hour),
    suggestedEnd: formatHour(endHour),
    predictedCrowd: best.crowdLevel,
    crowdScore: best.crowdScore,
    confidence: best.confidence,
  };
}
