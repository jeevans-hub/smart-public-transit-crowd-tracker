export interface EtaValidationSample {
  routeId: string;
  hourOfDay: number;
  source: string;
  predictedArrival: Date;
  actualArrival: Date;
}

export interface EtaValidationMetrics {
  available: boolean;
  sampleCount: number;
  meanAbsoluteErrorMinutes: number | null;
  medianAbsoluteErrorMinutes: number | null;
  p90AbsoluteErrorMinutes: number | null;
  withinOneMinutePercent: number | null;
  withinThreeMinutesPercent: number | null;
  withinFiveMinutesPercent: number | null;
}

function percentile(sorted: number[], fraction: number): number | null {
  if (sorted.length === 0) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

export function calculateEtaValidationMetrics(samples: EtaValidationSample[]): EtaValidationMetrics {
  const errors = samples.map((sample) => Math.abs(sample.actualArrival.getTime() - sample.predictedArrival.getTime()) / 60_000).sort((a, b) => a - b);
  const count = errors.length;
  const ratio = (minutes: number) => count === 0 ? null : Math.round(errors.filter((error) => error <= minutes).length / count * 10_000) / 100;
  return {
    available: count > 0,
    sampleCount: count,
    meanAbsoluteErrorMinutes: count === 0 ? null : Math.round(errors.reduce((sum, value) => sum + value, 0) / count * 100) / 100,
    medianAbsoluteErrorMinutes: percentile(errors, 0.5),
    p90AbsoluteErrorMinutes: percentile(errors, 0.9),
    withinOneMinutePercent: ratio(1),
    withinThreeMinutesPercent: ratio(3),
    withinFiveMinutesPercent: ratio(5),
  };
}

export function isGeofenceArrival(distanceMeters: number, thresholdMeters = 75): boolean {
  return Number.isFinite(distanceMeters) && distanceMeters >= 0 && distanceMeters <= thresholdMeters;
}

export function groupEtaMetrics(samples: EtaValidationSample[]) {
  const group = (key: (sample: EtaValidationSample) => string) => Object.fromEntries(
    [...new Set(samples.map(key))].map((value) => [value, calculateEtaValidationMetrics(samples.filter((sample) => key(sample) === value))]),
  );
  return { byRoute: group((sample) => sample.routeId), byHour: group((sample) => String(sample.hourOfDay)), bySource: group((sample) => sample.source) };
}
