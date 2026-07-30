'use client';

import { LiveVehicleStatus } from '@/types/vehicle';
import { Search, Filter } from 'lucide-react';

interface VehicleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: LiveVehicleStatus | '' | undefined;
  onStatusChange: (value: LiveVehicleStatus | '' | undefined) => void;
  route: string;
  onRouteChange: (value: string) => void;
  vehicleType: string;
  onVehicleTypeChange: (value: string) => void;
  sortField: 'vehicleNumber' | 'speed' | 'currentPassengers' | 'lastUpdated';
  onSortFieldChange: (value: 'vehicleNumber' | 'speed' | 'currentPassengers' | 'lastUpdated') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export default function VehicleFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  route,
  onRouteChange,
  vehicleType,
  onVehicleTypeChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
}: VehicleFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicle, driver, route..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as LiveVehicleStatus | '')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="MOVING">Moving</option>
          <option value="STOPPED">Stopped</option>
          <option value="DELAYED">Delayed</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
        <input
          type="text"
          placeholder="Filter by route..."
          value={route}
          onChange={(e) => onRouteChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
        <input
          type="text"
          placeholder="Filter by type..."
          value={vehicleType}
          onChange={(e) => onVehicleTypeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="pt-4 border-t">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
        <div className="flex gap-2">
          <select
            value={sortField}
            onChange={(e) => onSortFieldChange(e.target.value as any)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lastUpdated">Last Updated</option>
            <option value="vehicleNumber">Vehicle Number</option>
            <option value="speed">Speed</option>
            <option value="currentPassengers">Passengers</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
}
