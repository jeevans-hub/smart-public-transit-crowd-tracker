'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import type { BmtcRecommendation } from '@/types/recommendation';

export default function CrowdAlertBanner({ recommendation }: { recommendation: BmtcRecommendation }) {
  const [dismissed, setDismissed] = useState(false);
  const first = recommendation.firstArrivingBus;
  const recommended = recommendation.recommendedBus;
  const shouldShow = first && recommended && first.vehicleId !== recommended.vehicleId && (first.crowdLevel === 'HIGH' || first.crowdLevel === 'VERY_HIGH');
  if (!shouldShow || dismissed) return null;
  return <div className="flex items-start justify-between gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={20} /><p className="text-sm"><strong>Route {first.routeNumber}</strong> arriving in {first.etaMinutes} minutes is {first.crowdLevel.replace('_', ' ').toLowerCase()}. Consider route {recommended.routeNumber} in {recommended.etaMinutes} minutes.</p></div><button onClick={() => setDismissed(true)} aria-label="Dismiss crowd alert" className="rounded p-1 hover:bg-orange-100"><X size={17} /></button></div>;
}
