import type {
  CrowdSource,
  TransitCrowdLevel,
  TransitDataSource,
  TransitVehicleDirection,
} from './transit';

export type RushLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type RushPredictionSource = 'HISTORICAL' | 'DEMO_PRIOR' | 'MIXED';

export interface TransitCrowdObservation {
  routeId: string;
  stopId: string;
  timestamp: Date;
  crowdScore: number;
  delayMinutes?: number;
  demandScore?: number;
}

export interface TransitCrowdAggregate {
  averageCrowdScore: number;
  peakCrowdScore: number;
  sampleCount: number;
  confidence: number;
  averageDelay: number;
  averageDemand: number;
}

export interface CrowdIntelligence {
  crowdLevel: TransitCrowdLevel;
  crowdScore: number;
  crowdConfidence: number;
  crowdSource: CrowdSource;
  passengerCount: number | null;
  factors: string[];
}

export interface RushHourPrediction {
  rushLevel: RushLevel;
  rushScore: number;
  confidence: number;
  source: RushPredictionSource;
  factors: string[];
}

export interface RouteCompatibilityResult {
  compatible: boolean;
  reason: string;
  originIndex: number;
  destinationIndex: number;
  effectiveStopIds: string[];
}

export interface RecommendationCandidate {
  vehicleId: string;
  routeId: string;
  routeNumber: string;
  direction: TransitVehicleDirection;
  currentStopId?: string | null;
  nextStopId?: string | null;
  etaMinutes: number;
  delayMinutes: number;
  crowdLevel: TransitCrowdLevel;
  crowdScore: number;
  crowdConfidence: number;
  crowdSource: CrowdSource;
  passengerCount: number | null;
  dataSource: TransitDataSource;
}

export interface RecommendationScoreBreakdown {
  eta: number;
  crowd: number;
  delay: number;
  confidence: number;
  routeFit: number;
}

export interface BmtcRecommendationAlternative extends RecommendationCandidate {
  recommendationScore: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  isRecommended: boolean;
}

export interface RejectedRecommendationCandidate {
  vehicleId: string;
  routeNumber: string;
  reason: string;
}

export interface BmtcRecommendation {
  selectedStopId: string;
  destinationStopId: string;
  recommendedBus: BmtcRecommendationAlternative | null;
  firstArrivingBus: BmtcRecommendationAlternative | null;
  alternatives: BmtcRecommendationAlternative[];
  rejectedCandidates: RejectedRecommendationCandidate[];
  rush: RushHourPrediction;
  reason: string;
  generatedAt: string;
  dataSource: TransitDataSource;
}

export interface BmtcCrowdAlert {
  id: string;
  userId: string;
  routeNumber: string;
  stopId: string;
  destinationStopId?: string;
  threshold: 'HIGH' | 'VERY_HIGH';
  arrivalWithinMinutes?: number;
  onlyIfBetterAlternative: boolean;
  enabled: boolean;
  lastTriggeredAt?: string;
}

export interface BmtcCrowdPrediction {
  routeId: string;
  routeNumber: string;
  stopId?: string;
  crowd: CrowdIntelligence;
  rush: RushHourPrediction;
  generatedAt: string;
  dataSource: TransitDataSource;
}

export interface CrowdTrendPoint {
  hour: number;
  label: string;
  crowdScore: number;
  crowdLevel: TransitCrowdLevel;
  confidence: number;
  crowdSource: CrowdSource;
}

export interface BestTravelWindow {
  suggestedStart: string;
  suggestedEnd: string;
  predictedCrowd: TransitCrowdLevel;
  crowdScore: number;
  confidence: number;
}
