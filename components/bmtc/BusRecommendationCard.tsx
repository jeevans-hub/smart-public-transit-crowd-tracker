import { CheckCircle2, Clock3, ShieldCheck, Users } from 'lucide-react';
import CrowdBadge from './CrowdBadge';
import TransitDataSourceBadge from './TransitDataSourceBadge';
import type { BmtcRecommendation } from '@/types/recommendation';

export default function BusRecommendationCard({ recommendation }: { recommendation: BmtcRecommendation }) {
  const recommended = recommendation.recommendedBus;
  if (!recommended) {
    return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-gray-900">Bus recommendation</h2><p className="mt-3 text-sm text-gray-600">{recommendation.reason}</p><div className="mt-4"><TransitDataSourceBadge source={recommendation.dataSource} /></div></section>;
  }
  return (
    <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="bg-emerald-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17} /> Recommended bus</p><h2 className="mt-1 text-2xl font-bold text-gray-900">Route {recommended.routeNumber}</h2></div><TransitDataSourceBadge source={recommendation.dataSource} /></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-3"><p className="flex items-center gap-1 text-xs text-gray-500"><Clock3 size={13} /> ETA</p><p className="mt-1 font-bold text-gray-900">{recommended.etaMinutes} min</p></div>
          <div className="rounded-lg bg-white p-3"><p className="flex items-center gap-1 text-xs text-gray-500"><Users size={13} /> Crowd</p><div className="mt-1"><CrowdBadge level={recommended.crowdLevel} /></div></div>
          <div className="rounded-lg bg-white p-3"><p className="flex items-center gap-1 text-xs text-gray-500"><ShieldCheck size={13} /> Confidence</p><p className="mt-1 font-bold text-gray-900">{recommended.crowdConfidence}%</p></div>
          <div className="rounded-lg bg-white p-3"><p className="text-xs text-gray-500">Expected delay</p><p className="mt-1 font-bold text-gray-900">{recommended.delayMinutes} min</p></div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-6 text-gray-700">{recommendation.reason}</p>
        <p className="mt-3 text-xs text-gray-500">Recommendation score {recommended.recommendationScore}/100 · {recommendation.rush.rushLevel} rush demand</p>
        {recommendation.alternatives.length > 1 && <div className="mt-5 border-t pt-4"><p className="text-sm font-semibold text-gray-900">Compared buses</p><div className="mt-3 space-y-2">{recommendation.alternatives.map((alternative) => <div key={alternative.vehicleId} className={`flex items-center justify-between rounded-lg border p-3 text-sm ${alternative.isRecommended ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}><span className="font-semibold text-gray-900">{alternative.routeNumber} · {alternative.etaMinutes} min</span><div className="flex items-center gap-2"><CrowdBadge level={alternative.crowdLevel} />{alternative.isRecommended && <span className="text-xs font-bold text-emerald-700">BEST</span>}</div></div>)}</div></div>}
      </div>
    </section>
  );
}
