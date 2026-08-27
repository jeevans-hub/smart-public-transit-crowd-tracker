'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ILiveVehicleResponse } from '@/types/vehicle';
import VehicleMarker from './VehicleMarker';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VehicleMapProps {
  vehicles: ILiveVehicleResponse[];
  stations?: Array<{ id: string; name: string; latitude: number; longitude: number }>;
  onVehicleClick?: (vehicle: ILiveVehicleResponse) => void;
  selectedVehicle?: ILiveVehicleResponse | null;
  loading?: boolean;
}

function MapController({ vehicles, selectedVehicle }: { vehicles: ILiveVehicleResponse[]; selectedVehicle?: ILiveVehicleResponse | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      const validVehicles = vehicles.filter(v => v.latitude && v.longitude);
      
      if (validVehicles.length === 0) return;

      const bounds = L.latLngBounds(
        validVehicles.map((v) => [v.latitude, v.longitude] as [number, number])
      );

      if (selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude) {
        map.setView([selectedVehicle.latitude, selectedVehicle.longitude], 16);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } catch (error) {
      console.error('Map controller error:', error);
    }
  }, [vehicles, selectedVehicle, map]);

  return null;
}

export default function VehicleMap({
  vehicles,
  stations = [],
  onVehicleClick,
  selectedVehicle,
  loading = false,
}: VehicleMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const center = vehicles.length > 0
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : [12.9716, 77.5946]; // Default to Bengaluru if no vehicles

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      className="w-full h-full rounded-lg"
      style={{ height: '100%', minHeight: '500px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController vehicles={vehicles} selectedVehicle={selectedVehicle} />

      {/* Station markers */}
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={L.divIcon({
            className: 'station-marker',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>
            <div className="p-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{station.name}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Vehicle markers */}
      {vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle._id}
          vehicle={vehicle}
          onClick={onVehicleClick}
        />
      ))}
    </MapContainer>
  );
}
