'use client';

import { LiveVehicleStatus } from '@/types/vehicle';
import { getStatusColor, getStatusLabel } from '@/utils/vehicleStatus';

const statuses: LiveVehicleStatus[] = ['MOVING', 'STOPPED', 'DELAYED', 'OFFLINE'];

export default function VehicleLegend() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
      <div className="space-y-2">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getStatusColor(status) }}
            />
            <span className="text-sm text-gray-700">{getStatusLabel(status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
