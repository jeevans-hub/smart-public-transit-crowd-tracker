'use client';

import { Marker, Popup } from 'react-leaflet';
import { ILiveVehicleResponse } from '@/types/vehicle';
import { getStatusColor } from '@/utils/vehicleStatus';
import L from 'leaflet';

interface VehicleMarkerProps {
  vehicle: ILiveVehicleResponse;
  onClick?: (vehicle: ILiveVehicleResponse) => void;
}

const createVehicleIcon = (color: string, rotation: number) => {
  return L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div style="
        transform: rotate(${rotation}deg);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg 
          viewBox="0 0 24 24" 
          fill="${color}" 
          width="24" 
          height="24"
          style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
        >
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function VehicleMarker({ vehicle, onClick }: VehicleMarkerProps) {
  const color = getStatusColor(vehicle.status);
  const icon = createVehicleIcon(color, vehicle.heading);

  const handleClick = () => {
    if (onClick) {
      onClick(vehicle);
    }
  };

  const occupancyPercentage = Math.round((vehicle.currentPassengers / vehicle.capacity) * 100);

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          <h3 className="font-bold text-lg mb-2">{vehicle.vehicleNumber}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-medium">{vehicle.route}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Driver:</span>
              <span className="font-medium">{vehicle.driverName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Station:</span>
              <span className="font-medium">{vehicle.currentStation || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Next Station:</span>
              <span className="font-medium">{vehicle.nextStation || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Passengers:</span>
              <span className="font-medium">{vehicle.currentPassengers} / {vehicle.capacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Occupancy:</span>
              <span className="font-medium">{occupancyPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Speed:</span>
              <span className="font-medium">{vehicle.speed.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span 
                className="font-medium"
                style={{ color }}
              >
                {vehicle.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium text-xs">
                {new Date(vehicle.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
