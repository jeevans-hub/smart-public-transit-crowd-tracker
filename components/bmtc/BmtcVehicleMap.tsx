'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { TransitRoute, TransitVehicle } from '@/types/transit';
import CrowdBadge from './CrowdBadge';
import 'leaflet/dist/leaflet.css';

function FitVehicles({ vehicles }: { vehicles: TransitVehicle[] }) {
  const map = useMap();
  useEffect(() => {
    if (vehicles.length === 0) return;
    map.fitBounds(L.latLngBounds(vehicles.map((vehicle) => [vehicle.latitude, vehicle.longitude])), { padding: [35, 35], maxZoom: 14 });
  }, [map, vehicles]);
  return null;
}

function vehicleIcon(level: TransitVehicle['occupancy']['crowdLevel']) {
  const color = level === 'LOW' ? '#16a34a' : level === 'MEDIUM' ? '#ca8a04' : level === 'HIGH' ? '#ea580c' : '#dc2626';
  return L.divIcon({ className: '', html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px #0005;display:grid;place-items:center;color:white;font-size:15px">●</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
}

export default function BmtcVehicleMap({ vehicles, routes }: { vehicles: TransitVehicle[]; routes: TransitRoute[] }) {
  return <div className="h-[420px] overflow-hidden rounded-xl border bg-gray-100">
    <MapContainer center={[12.9716, 77.5946]} zoom={11} className="h-full w-full">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitVehicles vehicles={vehicles} />
      {vehicles.map((vehicle) => {
        const route = routes.find((item) => item.routeId === vehicle.routeId);
        return <Marker key={vehicle.vehicleId} position={[vehicle.latitude, vehicle.longitude]} icon={vehicleIcon(vehicle.occupancy.crowdLevel)}><Popup><div className="space-y-2"><p className="font-bold">Route {route?.routeNumber || vehicle.routeId}</p><CrowdBadge level={vehicle.occupancy.crowdLevel} /><p className="text-xs">{vehicle.currentStopId || 'En route'} → {vehicle.nextStopId || 'Next stop unavailable'}</p><Link className="text-xs font-semibold text-blue-700" href={`/dashboard/bmtc/vehicles/${vehicle.vehicleId}`}>Vehicle details</Link></div></Popup></Marker>;
      })}
    </MapContainer>
  </div>;
}
