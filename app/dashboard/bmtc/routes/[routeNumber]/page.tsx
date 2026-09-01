'use client';

import Link from 'next/link';
import { ArrowLeft, Bus, Clock3, Gauge, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import BusRecommendationCard from '@/components/bmtc/BusRecommendationCard';
import CrowdBadge from '@/components/bmtc/CrowdBadge';
import CrowdTrendChart from '@/components/bmtc/CrowdTrendChart';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import type { BestTravelWindow, BmtcCrowdPrediction, BmtcRecommendation, CrowdTrendPoint } from '@/types/recommendation';
import type { TransitDataSource, TransitRoute, TransitVehicle } from '@/types/transit';

interface RouteIntelligence {
  route: TransitRoute;
  currentPrediction: BmtcCrowdPrediction | null;
  trend: CrowdTrendPoint[];
  bestTravelWindow: BestTravelWindow | null;
  activeVehicles: TransitVehicle[];
  averageDelayMinutes: number;
}

export default function BmtcRouteIntelligencePage({ params }: { params: Promise<{ routeNumber: string }> }) {
  const [intelligence, setIntelligence] = useState<RouteIntelligence | null>(null);
  const [recommendation, setRecommendation] = useState<BmtcRecommendation | null>(null);
  const [source, setSource] = useState<TransitDataSource>('DEMO');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void params.then(async ({ routeNumber }) => {
        const response = await fetch(`/api/bmtc/routes/${encodeURIComponent(routeNumber)}/intelligence`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error?.message || 'Unable to load route intelligence');
        setIntelligence(data.data);
        setSource(data.dataSource || 'DEMO');
        const route: TransitRoute = data.data.route;
        if (route.stopIds.length >= 2) {
          const query = new URLSearchParams({ stopId: route.stopIds[0], destinationStopId: route.stopIds[route.stopIds.length - 1], route: route.routeNumber, maxWaitMinutes: '90' });
          const recommendationResponse = await fetch(`/api/bmtc/recommendations?${query.toString()}`);
          const recommendationData = await recommendationResponse.json();
          if (recommendationResponse.ok && recommendationData.success) setRecommendation(recommendationData.data);
        }
      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load route intelligence'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6">
        {!intelligence && !error && <LoadingSpinner />}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>}
        {intelligence && <>
          <Link href="/dashboard/bmtc" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"><ArrowLeft size={16} /> Back to BMTC tracking</Link>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">BMTC route intelligence</p><h1 className="text-3xl font-bold text-gray-900">Route {intelligence.route.routeNumber}</h1><p className="mt-1 text-gray-600">{intelligence.route.origin} → {intelligence.route.destination}</p></div><TransitDataSourceBadge source={source} /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-5"><p className="flex items-center gap-2 text-sm text-gray-500"><Gauge size={16} /> Current crowd</p><div className="mt-3">{intelligence.currentPrediction ? <CrowdBadge level={intelligence.currentPrediction.crowd.crowdLevel} /> : 'Unavailable'}</div></div>
            <div className="rounded-xl border bg-white p-5"><p className="flex items-center gap-2 text-sm text-gray-500"><Sparkles size={16} /> Rush level</p><p className="mt-2 text-xl font-bold text-purple-700">{intelligence.currentPrediction?.rush.rushLevel || '—'}</p></div>
            <div className="rounded-xl border bg-white p-5"><p className="flex items-center gap-2 text-sm text-gray-500"><Bus size={16} /> Active vehicles</p><p className="mt-2 text-2xl font-bold text-gray-900">{intelligence.activeVehicles.length}</p></div>
            <div className="rounded-xl border bg-white p-5"><p className="flex items-center gap-2 text-sm text-gray-500"><Clock3 size={16} /> Average delay</p><p className="mt-2 text-2xl font-bold text-gray-900">{intelligence.averageDelayMinutes} min</p></div>
          </div>
          {intelligence.bestTravelWindow && <section className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-bold text-gray-900">Best time to travel</h2><p className="mt-2 text-sm text-gray-700">Between <strong>{intelligence.bestTravelWindow.suggestedStart}</strong> and <strong>{intelligence.bestTravelWindow.suggestedEnd}</strong>, with predicted {intelligence.bestTravelWindow.predictedCrowd.replace('_', ' ').toLowerCase()} crowd ({intelligence.bestTravelWindow.confidence}% confidence).</p></section>}
          <CrowdTrendChart data={intelligence.trend} demo={source === 'DEMO'} />
          <section className="rounded-xl border bg-white p-5"><h2 className="font-bold text-gray-900">Active vehicle crowd levels</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{intelligence.activeVehicles.map((vehicle) => <Link key={vehicle.vehicleId} href={`/dashboard/bmtc/vehicles/${vehicle.vehicleId}`} className="flex items-center justify-between rounded-lg border p-4 hover:border-blue-300"><div><p className="font-semibold text-gray-900">{vehicle.vehicleId}</p><p className="text-xs text-gray-500">{vehicle.direction.toLowerCase()}</p></div><CrowdBadge level={vehicle.occupancy.crowdLevel} /></Link>)}</div></section>
          {recommendation && <BusRecommendationCard recommendation={recommendation} />}
        </>}
      </main></div>
    </div>
  );
}
