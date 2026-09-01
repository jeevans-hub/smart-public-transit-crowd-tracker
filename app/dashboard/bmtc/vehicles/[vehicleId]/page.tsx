'use client';

import Link from 'next/link';
import { ArrowLeft, Bus, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';
import CrowdBadge from '@/components/bmtc/CrowdBadge';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import type { TransitDataSource, TransitRoute, TransitStop, TransitVehicle } from '@/types/transit';

type VehicleDetails = { vehicle: TransitVehicle; route: TransitRoute | null; currentStop: TransitStop | null; nextStop: TransitStop | null; eta: { etaMinutes: number } | null; dataSource: TransitDataSource };

export default function BmtcVehicleDetails({ params }: { params: Promise<{ vehicleId: string }> }) {
  const [details, setDetails] = useState<VehicleDetails | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { void params.then(({ vehicleId }) => fetch(`/api/bmtc/vehicles/${vehicleId}`).then(async (response) => { const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.error?.message || 'Vehicle not found'); setDetails(data.data); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Vehicle not found'))); }, [params]);
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="p-6">{!details && !error && <LoadingSpinner />}{error && <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>}{details && <div className="mx-auto max-w-3xl space-y-6"><Link href="/dashboard/bmtc" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"><ArrowLeft size={16} /> Back to BMTC tracking</Link><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-600">Route {details.route?.routeNumber || details.vehicle.routeId}</p><h1 className="text-3xl font-bold text-gray-900">{details.vehicle.vehicleId}</h1></div><TransitDataSourceBadge source={details.dataSource} /></div><div className="rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><Bus className="text-blue-600" /><span className="font-semibold text-gray-900">{details.route?.origin || 'Bengaluru'} → {details.route?.destination || 'Bengaluru'}</span></div><div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4"><div><p className="text-sm text-gray-500">Speed</p><p className="text-xl font-bold">{details.vehicle.speed} km/h</p></div><div><p className="text-sm text-gray-500">Crowd</p><CrowdBadge level={details.vehicle.occupancy.crowdLevel} /></div><div><p className="text-sm text-gray-500">Current stop</p><p className="font-semibold">{details.currentStop?.name || 'En route'}</p></div><div><p className="text-sm text-gray-500">Next stop</p><p className="font-semibold">{details.nextStop?.name || 'Unknown'}</p></div></div><p className="mt-6 flex items-center gap-2 text-sm text-gray-600"><MapPin size={16} /> ETA to next stop: {details.eta === null ? 'Unavailable' : `${details.eta.etaMinutes} minutes`}</p></div></div>}</main></div></div>;
}
