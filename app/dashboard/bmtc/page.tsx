'use client';

import Link from 'next/link';
import { RefreshCw, Search, Bus, MapPin, Brain, ArrowRight, Activity } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';
import CrowdBadge from '@/components/bmtc/CrowdBadge';
import type { TransitDataSource, TransitFeedHealth, TransitRoute, TransitVehicle } from '@/types/transit';
import type { BmtcCrowdPrediction } from '@/types/recommendation';

type VehicleWithRoute = TransitVehicle & { route: TransitRoute | null };

export default function BmtcDashboardPage() {
  const [vehicles, setVehicles] = useState<VehicleWithRoute[]>([]);
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [predictions, setPredictions] = useState<BmtcCrowdPrediction[]>([]);
  const [source, setSource] = useState<TransitDataSource>('DEMO');
  const [providerStatus, setProviderStatus] = useState<TransitFeedHealth | null>(null);
  const [search, setSearch] = useState('');
  const [crowd, setCrowd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (search) query.set('route', search);
      if (crowd) query.set('crowdLevel', crowd);
      const [vehicleResponse, routeResponse, predictionResponse, providerResponse] = await Promise.all([
        fetch(`/api/bmtc/vehicles?${query.toString()}`),
        fetch('/api/bmtc/routes'),
        fetch('/api/bmtc/crowd-predictions'),
        fetch('/api/bmtc/provider-status'),
      ]);
      const vehicleData = await vehicleResponse.json();
      const routeData = await routeResponse.json();
      const predictionData = await predictionResponse.json();
      const providerData = await providerResponse.json();
      if (!vehicleResponse.ok || !vehicleData.success) throw new Error(vehicleData.error?.message || 'Unable to load BMTC vehicles');
      if (!routeResponse.ok || !routeData.success) throw new Error(routeData.error?.message || 'Unable to load BMTC routes');
      if (!predictionResponse.ok || !predictionData.success) throw new Error(predictionData.error?.message || 'Unable to load crowd intelligence');
      setVehicles(vehicleData.data);
      setRoutes(routeData.data);
      setPredictions(predictionData.data);
      setSource(vehicleData.dataSource || 'DEMO');
      if (providerResponse.ok && providerData.success) setProviderStatus(providerData.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load transit data');
    } finally {
      setLoading(false);
    }
  }, [crowd, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72"><Navbar /><main className="p-6 space-y-6">
        <PageHeader title="BMTC Transit Tracking" subtitle="Explore Bengaluru routes, stops, vehicles, and crowd estimates" action={<TransitDataSourceBadge source={source} status={providerStatus?.status} provider={providerStatus?.provider} verificationStatus={providerStatus?.verificationStatus} fallbackActive={providerStatus?.fallbackActive} activationState={providerStatus?.activation?.state} />} />
        <div className={`rounded-xl border p-4 text-sm ${providerStatus?.realFeedVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : providerStatus && !providerStatus.fallbackActive ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {providerStatus?.realFeedVerified
            ? `Fresh BMTC vehicle data verified from ${providerStatus.sourceName || 'the configured transit provider'}.`
            : providerStatus && !providerStatus.fallbackActive
              ? `${providerStatus.verificationReason || 'Live transit data is available, but BMTC identity is not verified.'} It is not labelled as live BMTC data.`
              : providerStatus?.fallbackReason || 'This environment uses deterministic demo transit data until an approved BMTC feed is configured and verified.'}
        </div>
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Activity size={19} className="text-blue-600" /><h2 className="font-bold text-gray-900">Transit provider health</h2></div>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div><p className="text-gray-500">Provider</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.provider || 'DEMO'}</p></div>
            <div><p className="text-gray-500">Verification</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.verificationStatus || 'NOT_CONFIGURED'}</p></div>
            <div><p className="text-gray-500">Feed status</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.status || 'DEMO'}</p></div>
            <div><p className="text-gray-500">Last updated</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.lastSuccessfulFetch ? new Date(providerStatus.lastSuccessfulFetch).toLocaleTimeString() : 'Not connected'}</p></div>
            <div><p className="text-gray-500">Active vehicles</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.vehicleCount ?? 0}</p></div>
            <div><p className="text-gray-500">Trip updates</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.tripUpdateCount ?? 0}</p></div>
            <div><p className="text-gray-500">Newest update</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.newestVehicleAgeSeconds === null || providerStatus?.newestVehicleAgeSeconds === undefined ? '—' : `${providerStatus.newestVehicleAgeSeconds}s ago`}</p></div>
            <div><p className="text-gray-500">Fallback</p><p className="mt-1 font-semibold text-gray-900">{providerStatus?.fallbackActive ? providerStatus.fallbackReason || 'Demo active' : 'Not active'}</p></div>
          </div>
          <Link href="/dashboard/bmtc/diagnostics" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Open live-feed diagnostics <ArrowRight size={15} /></Link>
        </section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Tracked buses</p><p className="mt-1 text-3xl font-bold text-gray-900">{vehicles.length}</p></div>
          <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Available routes</p><p className="mt-1 text-3xl font-bold text-gray-900">{routes.length}</p></div>
          <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Data refresh</p><p className="mt-1 text-lg font-semibold text-gray-900">Every 30 seconds</p></div>
          <div className="rounded-xl border bg-white p-5"><p className="text-sm text-gray-500">Current rush level</p><p className="mt-1 text-2xl font-bold text-purple-700">{predictions[0]?.rush.rushLevel || '—'}</p></div>
        </div>
        <section className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><div className="rounded-lg bg-purple-100 p-2 text-purple-700"><Brain size={22} /></div><div><h2 className="font-bold text-gray-900">Crowd intelligence</h2><p className="mt-1 text-sm text-gray-600">{predictions.filter((item) => item.crowd.crowdLevel === 'HIGH' || item.crowd.crowdLevel === 'VERY_HIGH').length} high-crowd route predictions · {predictions[0]?.rush.confidence || 0}% rush confidence</p><p className="mt-1 text-xs text-gray-500">Source: {predictions[0]?.rush.source?.replace('_', ' ') || 'DEMO PRIOR'}</p></div></div><Link href="/dashboard/bmtc/nearby" className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">Compare nearby buses <ArrowRight size={16} /></Link></div>
        </section>
        {routes.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">BMTC route intelligence</h2><span className="text-sm text-gray-500">Crowd trend and best travel time</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{routes.map((route) => <Link key={route.routeId} href={`/dashboard/bmtc/routes/${route.routeNumber}`} className="rounded-xl border bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow"><p className="text-lg font-bold text-blue-700">Route {route.routeNumber}</p><p className="mt-1 text-sm text-gray-600">{route.origin} → {route.destination}</p></Link>)}</div></section>}
        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-lg border px-3"><Search size={18} className="text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search route number" className="w-full py-2 outline-none" /></label>
          <select value={crowd} onChange={(event) => setCrowd(event.target.value)} className="rounded-lg border px-3 py-2"><option value="">All crowd levels</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="VERY_HIGH">Very high</option></select>
          <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"><RefreshCw size={17} /> Refresh</button>
        </div>
        {loading ? <LoadingSpinner /> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}<button onClick={() => void load()} className="ml-3 underline">Try again</button></div> : vehicles.length === 0 ? <div className="rounded-xl border bg-white p-10 text-center text-gray-500">No vehicles match the selected filters.</div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle) => <Link key={vehicle.vehicleId} href={`/dashboard/bmtc/vehicles/${vehicle.vehicleId}`} className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><div><p className="text-lg font-bold text-gray-900">{vehicle.vehicleId}</p><p className="text-sm text-blue-600">Route {vehicle.route?.routeNumber || vehicle.routeId}</p></div><Bus className="text-blue-600" /></div><div className="mt-5 flex items-center justify-between"><CrowdBadge level={vehicle.occupancy.crowdLevel} /><span className="text-sm text-gray-600">{vehicle.speed} km/h</span></div><p className="mt-4 flex items-center gap-1 text-sm text-gray-500"><MapPin size={15} /> {vehicle.currentStopId || 'En route'} → {vehicle.nextStopId || 'Unknown'}</p></Link>)}</div>}
      </main></div>
    </div>
  );
}
