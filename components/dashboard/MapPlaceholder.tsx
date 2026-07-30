'use client';

import { MapPin, Car, Plus, Minus, Maximize2, Layers } from 'lucide-react';
import { MapMarker } from '@/data/dashboard';

interface MapPlaceholderProps {
  markers: MapMarker[];
}

export default function MapPlaceholder({ markers }: MapPlaceholderProps) {

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Map</h3>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Layers className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Maximize2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-900 h-96">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Map Markers */}
        {markers.map((marker, index) => {
          // Distribute markers across the map area
          const positions = [
            { x: 20, y: 30 }, { x: 50, y: 25 }, { x: 80, y: 35 },
            { x: 35, y: 50 }, { x: 65, y: 55 }, { x: 25, y: 70 },
            { x: 55, y: 65 }, { x: 75, y: 45 }, { x: 45, y: 75 },
            { x: 70, y: 20 }
          ];
          const pos = positions[index % positions.length];
          
          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className={`p-2 rounded-full ${
                marker.type === 'station' 
                  ? marker.status === 'critical' ? 'bg-red-500' : 
                    marker.status === 'high' ? 'bg-orange-500' : 
                    marker.status === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                  : marker.status === 'delayed' ? 'bg-purple-500' : 'bg-blue-500'
              } shadow-lg group-hover:scale-110 transition-transform`}>
                {marker.type === 'station' ? (
                  <MapPin className="w-4 h-4 text-white" />
                ) : (
                  <Car className="w-4 h-4 text-white" />
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {marker.name}
              </div>
            </div>
          );
        })}

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Healthy Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-600">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-gray-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Active Vehicle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-gray-600">Delayed Vehicle</span>
            </div>
          </div>
        </div>

        {/* Integration Notice */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white px-3 py-2 rounded-lg text-xs">
          <span className="font-medium">Google Maps Integration</span> - Ready for Phase 3
        </div>
      </div>
    </div>
  );
}
