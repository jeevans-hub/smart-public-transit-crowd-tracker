'use client';

import React, { useState, useEffect } from 'react';
import { CrowdLevel, ReportSource } from '@/types/crowd';
import { CROWD_LEVELS, REPORT_SOURCES, CROWD_THRESHOLDS } from '@/utils/constants';
import { X, AlertCircle } from 'lucide-react';

interface CrowdReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CrowdReportModal({ isOpen, onClose, onSuccess }: CrowdReportModalProps) {
  const [vehicleId, setVehicleId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [stationId, setStationId] = useState('');
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('MEDIUM');
  const [passengerCount, setPassengerCount] = useState<number>(25);
  const [vehicleCapacity, setVehicleCapacity] = useState<number>(50);
  const [reportSource, setReportSource] = useState<ReportSource>('USER');

  const [vehicles, setVehicles] = useState<{ _id?: string; vehicleNumber: string; routeId: string; capacity: number }[]>([]);
  const [routes, setRoutes] = useState<{ _id?: string; routeNumber: string; routeName: string }[]>([]);
  const [stations, setStations] = useState<{ _id?: string; stationCode: string; stationName: string }[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  async function fetchOptions() {
    try {
      const [vRes, rRes, sRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/routes'),
        fetch('/api/stations'),
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData.success) setVehicles(vData.data || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success) setRoutes(rData.data || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.success) setStations(sData.data || []);
      }
    } catch (err) {
      console.error('Failed to load dropdown selections:', err);
    }
  }

  // Auto calculate crowd level when passenger count or capacity changes
  useEffect(() => {
    if (vehicleCapacity > 0) {
      const pct = (passengerCount / vehicleCapacity) * 100;
      if (pct <= CROWD_THRESHOLDS.EMPTY) setCrowdLevel('EMPTY');
      else if (pct <= CROWD_THRESHOLDS.LOW) setCrowdLevel('LOW');
      else if (pct <= CROWD_THRESHOLDS.MEDIUM) setCrowdLevel('MEDIUM');
      else if (pct <= CROWD_THRESHOLDS.HIGH) setCrowdLevel('HIGH');
      else setCrowdLevel('FULL');
    }
  }, [passengerCount, vehicleCapacity]);

  // When vehicle changes, attempt auto fill route & capacity
  const handleVehicleChange = (vNum: string) => {
    setVehicleId(vNum);
    const selectedV = vehicles.find((v) => v.vehicleNumber === vNum || v._id === vNum);
    if (selectedV) {
      if (selectedV.routeId) setRouteId(selectedV.routeId);
      if (selectedV.capacity) setVehicleCapacity(selectedV.capacity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId.trim()) {
      setError('Vehicle ID is required');
      return;
    }
    if (!routeId.trim()) {
      setError('Route ID is required');
      return;
    }
    if (!stationId.trim()) {
      setError('Station ID is required');
      return;
    }
    if (passengerCount < 0) {
      setError('Passenger count cannot be negative');
      return;
    }
    if (vehicleCapacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }
    if (passengerCount > vehicleCapacity) {
      setError('Passenger count cannot exceed vehicle capacity');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleId.trim(),
          routeId: routeId.trim(),
          stationId: stationId.trim(),
          crowdLevel,
          passengerCount,
          vehicleCapacity,
          reportSource,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to submit report');
      }

      // Reset and close
      setVehicleId('');
      setRouteId('');
      setStationId('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while submitting');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Submit Crowd Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle ID / Number *
            </label>
            {vehicles.length > 0 ? (
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">-- Select or enter vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                    {v.vehicleNumber} (Cap: {v.capacity})
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              placeholder="Or type Vehicle ID (e.g. BUS-101)"
              value={vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Route Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route ID *
            </label>
            {routes.length > 0 ? (
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 mb-1"
              >
                <option value="">-- Select route --</option>
                {routes.map((r) => (
                  <option key={r._id || r.routeNumber} value={r.routeNumber}>
                    {r.routeNumber} - {r.routeName}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              placeholder="Or type Route ID (e.g. RT-5)"
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Station Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station ID *
            </label>
            {stations.length > 0 ? (
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 mb-1"
              >
                <option value="">-- Select station --</option>
                {stations.map((s) => (
                  <option key={s._id || s.stationCode} value={s.stationCode}>
                    {s.stationCode} - {s.stationName}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              placeholder="Or type Station ID (e.g. ST-CENTRAL)"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Passenger Count & Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passenger Count
              </label>
              <input
                type="number"
                min="0"
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Capacity
              </label>
              <input
                type="number"
                min="1"
                value={vehicleCapacity}
                onChange={(e) => setVehicleCapacity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Crowd Level Display / Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crowd Level Status
            </label>
            <select
              value={crowdLevel}
              onChange={(e) => setCrowdLevel(e.target.value as CrowdLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
            >
              {Object.keys(CROWD_LEVELS).map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Report Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Source
            </label>
            <select
              value={reportSource}
              onChange={(e) => setReportSource(e.target.value as ReportSource)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {Object.keys(REPORT_SOURCES).map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
