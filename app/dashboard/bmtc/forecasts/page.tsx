'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock3, Gauge, Sparkles } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import CrowdBadge from '@/components/bmtc/CrowdBadge';
import type { BmtcCrowdPrediction } from '@/types/recommendation';

export default function CrowdForecastsPage() {
  const [forecasts, setForecasts] = useState<BmtcCrowdPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetch('/api/bmtc/crowd-predictions').then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error?.message || 'Unable to load forecasts'); setForecasts(body.data || []); }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load forecasts')); }, []);
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6"><PageHeader title="Crowd Forecasts" subtitle="Estimated BMTC route crowd levels with confidence and source transparency" />
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Forecasts are estimates unless their source is marked LIVE_OCCUPANCY. Exact passenger counts are never invented.</div>
    {!error && forecasts.length === 0 ? <LoadingSpinner /> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{forecasts.map((forecast) => <article key={forecast.routeId} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm text-gray-500">Route</p><h2 className="text-2xl font-bold text-blue-700">{forecast.routeNumber}</h2></div><CrowdBadge level={forecast.crowd.crowdLevel} /></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-gray-50 p-3"><p className="flex items-center gap-1 text-gray-500"><Gauge size={14} /> Confidence</p><p className="mt-1 font-bold">{forecast.crowd.crowdConfidence}%</p></div><div className="rounded-lg bg-gray-50 p-3"><p className="flex items-center gap-1 text-gray-500"><Clock3 size={14} /> Rush context</p><p className="mt-1 font-bold">{forecast.rush.rushLevel}</p></div></div><p className="mt-4 text-xs font-semibold text-gray-500">Source: {forecast.crowd.crowdSource.replaceAll('_', ' ')}</p><Link href={`/dashboard/bmtc/routes/${forecast.routeNumber}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">View route trend <ArrowRight size={15} /></Link></article>)}</div>}
    <section className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2"><Sparkles className="text-purple-600" /><h2 className="font-bold">How to use forecasts</h2></div><p className="mt-2 text-sm text-gray-600">Compare the forecast with upcoming buses on Nearby Stops. Recommendations also check direction and destination compatibility before suggesting a less-crowded bus.</p></section>
  </main></div></div>;
}
