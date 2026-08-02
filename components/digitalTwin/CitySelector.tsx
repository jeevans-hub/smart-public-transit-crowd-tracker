'use client';

import { useState, useEffect } from 'react';
import { useCities } from '@/hooks/useDigitalTwin';
import { ChevronDown, MapPin } from 'lucide-react';

interface CitySelectorProps {
  selectedCity: string | null;
  onCitySelect: (cityId: string) => void;
}

export default function CitySelector({ selectedCity, onCitySelect }: CitySelectorProps) {
  const { cities, loading } = useCities();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCityData = cities.find(c => c._id === selectedCity);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <MapPin size={18} className="text-blue-600" />
        <span className="font-medium text-gray-900">
          {selectedCityData ? selectedCityData.cityName : 'Select City'}
        </span>
        <ChevronDown size={16} className="text-gray-500 ml-auto" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-500 text-center">Loading cities...</div>
            ) : cities.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No cities available</div>
            ) : (
              cities.map(city => (
                <button
                  key={city._id}
                  onClick={() => {
                    onCitySelect(city._id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedCity === city._id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{city.cityName}</div>
                  <div className="text-sm text-gray-500">{city.country}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
