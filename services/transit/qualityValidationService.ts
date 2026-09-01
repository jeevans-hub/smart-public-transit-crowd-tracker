import type { TransitCrowdLevel } from '../../types/transit';

const LEVELS: TransitCrowdLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export interface CrowdValidationSample { predicted: TransitCrowdLevel; observed: TransitCrowdLevel; confidence: number; }

export function calculateCrowdValidation(samples: CrowdValidationSample[], liveOccupancyAvailable: boolean) {
  if (!liveOccupancyAvailable || samples.length === 0) return { available: false, sampleCount: 0, exactAgreementPercent: null, withinOneLevelPercent: null, majorErrorPercent: null, confidenceCalibration: [] };
  const differences = samples.map((sample) => Math.abs(LEVELS.indexOf(sample.predicted) - LEVELS.indexOf(sample.observed)));
  const percentage = (count: number) => Math.round(count / samples.length * 10_000) / 100;
  const confidenceCalibration = [0, 20, 40, 60, 80].map((minimum) => {
    const bin = samples.filter((sample) => sample.confidence >= minimum && sample.confidence < minimum + 20);
    return { range: `${minimum}-${minimum + 19}`, sampleCount: bin.length, agreementPercent: bin.length === 0 ? null : Math.round(bin.filter((sample) => sample.predicted === sample.observed).length / bin.length * 10_000) / 100 };
  });
  return { available: true, sampleCount: samples.length, exactAgreementPercent: percentage(differences.filter((value) => value === 0).length), withinOneLevelPercent: percentage(differences.filter((value) => value <= 1).length), majorErrorPercent: percentage(differences.filter((value) => value >= 2).length), confidenceCalibration };
}

export interface RecommendationValidationSample { offered: boolean; accepted: boolean; alternativeWasCompatible: boolean; arrivalDeltaMinutes: number | null; crowdImprovementLevels: number | null; }

export function calculateRecommendationValidation(samples: RecommendationValidationSample[]) {
  const offered = samples.filter((sample) => sample.offered);
  return {
    sampleCount: samples.length,
    offeredCount: offered.length,
    acceptedCount: offered.filter((sample) => sample.accepted).length,
    incompatibleAlternativeCount: offered.filter((sample) => !sample.alternativeWasCompatible).length,
    averageArrivalDeltaMinutes: average(offered.flatMap((sample) => sample.arrivalDeltaMinutes === null ? [] : [sample.arrivalDeltaMinutes])),
    averageCrowdImprovementLevels: average(offered.flatMap((sample) => sample.crowdImprovementLevels === null ? [] : [sample.crowdImprovementLevels])),
  };
}

function average(values: number[]) { return values.length === 0 ? null : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100; }
