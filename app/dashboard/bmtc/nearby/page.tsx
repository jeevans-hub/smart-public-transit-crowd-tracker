'use client';

import Link from 'next/link';
import { LocateFixed, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import BusRecommendationCard from '@/components/bmtc/BusRecommendationCard';
import CrowdAlertBanner from '@/components/bmtc/CrowdAlertBanner';
import CrowdBadge from '@/components/bmtc/CrowdBadge';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import Sidebar from '@/components/dashboard/Sidebar';
import type { BmtcRecommendation } from '@/types/recommendation';
import type { TransitDataSource, TransitStop, VehicleArrival } from '@/types/transit';

type NearbyStop = TransitStop & { distanceMeters: number };

export default function NearbyBmtcPage() {
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [arrivals, setArrivals] = useState<VehicleArrival[]>([]);
  const [destinations, setDestinations] = useState<TransitStop[]>([]);
  const [selected, setSelected] = useState<NearbyStop | null>(null);
  const [destinationStopId, setDestinationStopId] = useState('');
  const [recommendation, setRecommendation] = useState<BmtcRecommendation | null>(null);
  const [source, setSource] = useState<TransitDataSource>('DEMO');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Use your location to find nearby stops.');
  const [alertStatus, setAlertStatus] = useState('');

  async function findNearby(latitude: number, longitude: number) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/bmtc/nearby-stops?lat=${latitude}&lng=${longitude}&radius=3000`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || 'Unable to find nearby stops');
      setStops(data.data);
      setSource(data.dataSource || 'DEMO');
      if (!data.data.length) setMessage('No stops were found within 3 km. Try a different location.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to find nearby stops');
    } finally {
      setLoading(false);
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setMessage('Location is not available in this browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => void findNearby(position.coords.latitude, position.coords.longitude),
      () => {
        setLoading(false);
        setMessage('Location permission was not granted. You can use the Bengaluru demo location instead.');
      },
    );
  }

  async function selectStop(stop: NearbyStop) {
    setSelected(stop);
    setArrivals([]);
    setDestinations([]);
    setDestinationStopId('');
    setRecommendation(null);
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch(`/api/bmtc/stops/${stop.stopId}/arrivals`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || 'Unable to load arrivals');
      setArrivals(data.data.arrivals);
      setDestinations(data.data.destinations || []);
      setSource(data.dataSource || 'DEMO');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load arrivals');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendation(nextDestinationStopId: string) {
    setDestinationStopId(nextDestinationStopId);
    setRecommendation(null);
    if (!selected || !nextDestinationStopId) return;
    setLoading(true);
    setMessage('');
    try {
      const query = new URLSearchParams({ stopId: selected.stopId, destinationStopId: nextDestinationStopId, maxWaitMinutes: '45' });
      const response = await fetch(`/api/bmtc/recommendations?${query.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || 'Unable to compare buses');
      setRecommendation(data.data);
      setSource(data.dataSource || 'DEMO');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to compare buses');
    } finally {
      setLoading(false);
    }
  }

  async function createCrowdAlert() {
    const first = recommendation?.firstArrivingBus;
    if (!selected || !destinationStopId || !first) return;
    setAlertStatus('Saving alert...');
    try {
      const response = await fetch('/api/bmtc/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeNumber: first.routeNumber, stopId: selected.stopId, destinationStopId, threshold: 'HIGH', arrivalWithinMinutes: 15, onlyIfBetterAlternative: true, enabled: true }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || 'Unable to save alert');
      setAlertStatus(`Alert saved for route ${first.routeNumber}.`);
    } catch (error) {
      setAlertStatus(error instanceof Error ? error.message : 'Unable to save alert');
    }
  }

  const recommendationByVehicle = new Map(recommendation?.alternatives.map((item) => [item.vehicleId, item]) || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="space-y-6 p-6">
          <PageHeader title="Nearby BMTC Stops" subtitle="Compare compatible buses by ETA, crowd, delay, and direction" action={<TransitDataSourceBadge source={source} />} />
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Location is used only for this search. Transit positions, crowd values, and recommendations are deterministic demo data.</div>
          <div className="flex flex-wrap gap-3">
            <button onClick={useLocation} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"><LocateFixed size={18} /> Find stops near me</button>
            <button onClick={() => void findNearby(12.9767, 77.5713)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 font-medium text-blue-700 hover:bg-blue-50"><Navigation size={18} /> Use Bengaluru demo location</button>
          </div>
          {loading && <LoadingSpinner />}
          {message && !loading && <div className="rounded-xl border bg-white p-5 text-gray-600">{message}</div>}
          {stops.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h2 className="font-bold text-gray-900">Nearby stops</h2>
                {stops.map((stop) => (
                  <button key={stop.stopId} onClick={() => void selectStop(stop)} className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm ${selected?.stopId === stop.stopId ? 'border-blue-500 ring-2 ring-blue-100' : 'hover:border-blue-300'}`}>
                    <div className="flex items-start justify-between"><div><p className="font-semibold text-gray-900">{stop.name}</p><p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} /> {stop.area}</p></div><span className="text-sm font-medium text-blue-600">{stop.distanceMeters} m</span></div>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border bg-white p-5">
                  <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-gray-900">{selected?.name || 'Select a stop'}</h2><p className="text-sm text-gray-500">Upcoming buses</p></div><RefreshCw size={18} className="text-gray-400" /></div>
                  {selected && destinations.length > 0 && <label className="mt-5 block text-sm font-medium text-gray-700">Destination<select value={destinationStopId} onChange={(event) => void loadRecommendation(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"><option value="">Choose a destination</option>{destinations.map((destination) => <option key={destination.stopId} value={destination.stopId}>{destination.name} · {destination.area}</option>)}</select></label>}
                  {selected && arrivals.length === 0 && !loading && <p className="mt-8 text-gray-500">No approaching buses found for this stop.</p>}
                  <div className="mt-5 space-y-3">
                    {arrivals.map((arrival) => {
                      const intelligence = recommendationByVehicle.get(arrival.vehicleId);
                      const isRecommended = intelligence?.isRecommended ?? false;
                      return <div key={arrival.vehicleId} className={`rounded-lg border p-4 ${isRecommended ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100' : 'border-gray-200'}`}><div className="flex items-center justify-between"><div><span className="font-bold text-blue-700">Route {arrival.routeNumber}</span>{isRecommended && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">RECOMMENDED</span>}</div><span className="font-semibold text-gray-900">{arrival.etaMinutes} min</span></div><p className="mt-1 text-sm text-gray-600">{arrival.direction.toLowerCase()} · delay {arrival.delayMinutes} min</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><CrowdBadge level={intelligence?.crowdLevel || arrival.crowd.crowdLevel} /><span className="text-xs text-gray-500">{intelligence?.crowdConfidence ?? arrival.crowd.crowdConfidence}% confidence</span></div><Link href={`/dashboard/bmtc/vehicles/${arrival.vehicleId}`} className="text-sm text-blue-600 hover:underline">View bus</Link></div></div>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {recommendation && <CrowdAlertBanner recommendation={recommendation} />}
          {recommendation && <BusRecommendationCard recommendation={recommendation} />}
          {recommendation?.firstArrivingBus && <section className="flex flex-col justify-between gap-3 rounded-xl border bg-white p-5 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-gray-900">Crowd alert</h2><p className="mt-1 text-sm text-gray-500">Notify this signed-in session when route {recommendation.firstArrivingBus.routeNumber} reaches HIGH crowd within 15 minutes and a better compatible bus exists.</p>{alertStatus && <p className="mt-2 text-sm text-blue-700">{alertStatus}</p>}</div><button onClick={() => void createCrowdAlert()} className="shrink-0 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Create alert</button></section>}
        </main>
      </div>
    </div>
  );
}
