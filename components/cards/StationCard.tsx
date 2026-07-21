import { Station } from '@/types/station';
import { MapPin, Hash, Layers, Wifi, Accessibility, Coffee } from 'lucide-react';

interface StationCardProps {
  station: Station;
  onEdit?: (station: Station) => void;
  onDelete?: (station: Station) => void;
}

const facilityIcons: Record<string, any> = {
  'wifi': Wifi,
  'accessibility': Accessibility,
  'food': Coffee,
  'parking': Layers,
};

export default function StationCard({ station, onEdit, onDelete }: StationCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{station.stationName}</h3>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
              {station.stationCode}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{station.address}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          station.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {station.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}</span>
        </div>
        {station.zone && (
          <div className="flex items-center gap-2">
            <Hash size={16} />
            <span>Zone: {station.zone}</span>
          </div>
        )}
        {station.platformCount && (
          <div className="flex items-center gap-2">
            <Layers size={16} />
            <span>{station.platformCount} platform{station.platformCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {station.facilities && station.facilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {station.facilities.slice(0, 4).map((facility, index) => {
            const Icon = facilityIcons[facility.toLowerCase()] || Layers;
            return (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
              >
                <Icon size={12} />
                <span className="capitalize">{facility}</span>
              </div>
            );
          })}
          {station.facilities.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              +{station.facilities.length - 4} more
            </span>
          )}
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(station)}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(station)}
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
