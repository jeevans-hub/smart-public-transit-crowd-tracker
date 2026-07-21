import { Vehicle } from '@/types/vehicle';
import { Car, Users, MapPin, Wrench, Signal, Circle } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  'ACTIVE': { label: 'Active', color: 'bg-green-100 text-green-700', icon: Circle },
  'IN_SERVICE': { label: 'In Service', color: 'bg-blue-100 text-blue-700', icon: Signal },
  'MAINTENANCE': { label: 'Maintenance', color: 'bg-orange-100 text-orange-700', icon: Wrench },
  'OFFLINE': { label: 'Offline', color: 'bg-gray-100 text-gray-700', icon: Circle },
};

export default function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const status = statusConfig[vehicle.status] || statusConfig.OFFLINE;
  const StatusIcon = status.icon;
  const occupancyPercentage = (vehicle.currentPassengers / vehicle.capacity) * 100;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Car className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{vehicle.vehicleNumber}</h3>
            <p className="text-sm text-gray-500">{vehicle.vehicleType}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span className="font-medium">Capacity</span>
          </div>
          <span className="text-gray-900">{vehicle.capacity}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span className="font-medium">Passengers</span>
          </div>
          <span className="text-gray-900">{vehicle.currentPassengers}</span>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Occupancy</span>
            <span>{occupancyPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-colors ${
                occupancyPercentage > 90 ? 'bg-red-500' :
                occupancyPercentage > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {vehicle.driverName && (
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={16} />
            <span>Driver: {vehicle.driverName}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <MapPin size={16} className={vehicle.gpsEnabled ? 'text-green-600' : 'text-gray-400'} />
          <span className={`text-sm ${vehicle.gpsEnabled ? 'text-green-600' : 'text-gray-500'}`}>
            GPS {vehicle.gpsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(vehicle)}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(vehicle)}
              className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
