import { Route } from '@/types/route';
import { Route as RouteIcon, Bus, Train, MapPin, Clock, Ruler } from 'lucide-react';

interface RouteCardProps {
  route: Route;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
}

const transportIcons: Record<string, any> = {
  'BUS': Bus,
  'METRO': Train,
  'TRAIN': Train,
};

const transportColors: Record<string, string> = {
  'BUS': 'bg-blue-100 text-blue-700',
  'METRO': 'bg-purple-100 text-purple-700',
  'TRAIN': 'bg-green-100 text-green-700',
};

export default function RouteCard({ route, onEdit, onDelete }: RouteCardProps) {
  const Icon = transportIcons[route.transportType] || RouteIcon;
  const colorClass = transportColors[route.transportType] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{route.routeName}</h3>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                {route.routeNumber}
              </span>
            </div>
            <p className="text-sm text-gray-500 capitalize">{route.transportType.toLowerCase()}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          route.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {route.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span className="font-medium">Origin</span>
          </div>
          <span className="text-gray-900">{route.originStation}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span className="font-medium">Destination</span>
          </div>
          <span className="text-gray-900">{route.destinationStation}</span>
        </div>
        {route.estimatedDuration && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="font-medium">Duration</span>
            </div>
            <span className="text-gray-900">{route.estimatedDuration} min</span>
          </div>
        )}
        {route.distance && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Ruler size={16} />
              <span className="font-medium">Distance</span>
            </div>
            <span className="text-gray-900">{route.distance.toFixed(1)} km</span>
          </div>
        )}
      </div>

      {route.stops && route.stops.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">{route.stops.length} stop{route.stops.length > 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-1">
            {route.stops.slice(0, 3).map((stop, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                {stop.stationName}
              </span>
            ))}
            {route.stops.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                +{route.stops.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(route)}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(route)}
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
