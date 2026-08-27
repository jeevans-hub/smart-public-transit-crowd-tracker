'use client';

import { useEffect, useState } from 'react';
import { MapPin, Car, Plus, Minus, Maximize2, Layers, Minimize2 } from 'lucide-react';
import { MapMarker } from '@/data/dashboard';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPlaceholderProps {
  markers: MapMarker[];
}

function MapController({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      // Always center on Bengaluru
      const bengaluruCenter: [number, number] = [12.9716, 77.5946];
      map.setView(bengaluruCenter, 12);

      // If we have markers, fit bounds to show them
      if (markers && markers.length > 0) {
        const bounds = L.latLngBounds(
          markers.map((m) => [m.lat, m.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } catch (error) {
      console.error('Map controller error:', error);
    }
  }, [markers, map]);

  return null;
}

export default function MapPlaceholder({ markers }: MapPlaceholderProps) {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('standard');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const layers = [
    { id: 'standard', name: 'Standard', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { id: 'satellite', name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { id: 'terrain', name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
  ];

  const currentLayer = layers.find(l => l.id === selectedLayer) || layers[0];

  if (!isClient) {
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
        <div className="relative bg-gray-100 h-96 flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  const center: [number, number] = [12.9716, 77.5946]; // Always center on Bengaluru

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Map - Bengaluru</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowLayers(!showLayers)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Layers className="w-5 h-5 text-gray-600" />
            </button>
            {showLayers && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[150px]">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      setSelectedLayer(layer.id);
                      setShowLayers(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedLayer === layer.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {layer.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-gray-600" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
        <MapContainer
          center={center as [number, number]}
          zoom={12}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={currentLayer.url}
          />

          <MapController markers={markers} />

          {/* Map Markers */}
          {markers && markers.length > 0 && markers.map((marker) => {
            if (!marker.lat || !marker.lng) return null;
            return (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng] as [number, number]}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-medium">{marker.name}</div>
                    <div className="text-sm text-gray-600">
                      {marker.type === 'station' ? 'Station' : 'Vehicle'} - {marker.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4">
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
    </div>
  );
}
