'use client';

import { ILiveVehicleResponse } from '@/types/vehicle';
import { getStatusColor, getStatusLabel } from '@/utils/vehicleStatus';
import { Bus, MapPin, Users, Gauge, Clock } from 'lucide-react';

interface VehicleInfoCardProps {
  vehicle: ILiveVehicleResponse | null;
  onClose: () => void;
}

export default function VehicleInfoCard({ vehicle, onClose }: VehicleInfoCardProps) {
  if (!vehicle) return null;

  const color = getStatusColor(vehicle.status);
  const occupancyPercentage = Math.round((vehicle.currentPassengers / vehicle.capacity) * 100);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{vehicle.vehicleNumber}</h3>
          <p className="text-sm text-gray-500">{vehicle.vehicleType}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bus className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Route</p>
            <p className="font-medium">{vehicle.route}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Current Station</p>
            <p className="font-medium">{vehicle.currentStation || 'En route'}</p>
          </div>
        </div>

        {vehicle.nextStation && (
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Next Station</p>
              <p className="font-medium">{vehicle.nextStation}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-500" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">Occupancy</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${occupancyPercentage}%`,
                    backgroundColor: occupancyPercentage > 80 ? '#ef4444' : occupancyPercentage > 60 ? '#f97316' : '#22c55e',
                  }}
                />
              </div>
              <span className="font-medium text-sm">{occupancyPercentage}%</span>
            </div>
            <p className="text-xs text-gray-500">{vehicle.currentPassengers} / {vehicle.capacity} passengers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Speed</p>
            <p className="font-medium">{vehicle.speed.toFixed(1)} km/h</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-medium text-sm">{new Date(vehicle.lastUpdated).toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium" style={{ color }}>
              {getStatusLabel(vehicle.status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
