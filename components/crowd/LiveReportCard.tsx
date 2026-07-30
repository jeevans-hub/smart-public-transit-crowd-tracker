import React from 'react';
import { ICrowdReportResponse } from '@/types/crowd';
import CrowdBadge from './CrowdBadge';
import OccupancyMeter from './OccupancyMeter';
import { Car, Route, MapPin, Clock, User, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface LiveReportCardProps {
  report: ICrowdReportResponse;
  onDelete?: (reportId: string) => void;
}

export default function LiveReportCard({ report, onDelete }: LiveReportCardProps) {
  const formattedDate = new Date(report.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CrowdBadge level={report.crowdLevel} />
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium uppercase">
            {report.reportSource}
          </span>
          {report.verified ? (
            <span className="flex items-center text-xs text-emerald-600 gap-1 font-medium">
              <CheckCircle2 size={14} /> Verified
            </span>
          ) : (
            <span className="flex items-center text-xs text-amber-600 gap-1 font-medium">
              <AlertCircle size={14} /> Unverified
            </span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(report._id)}
            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
            title="Delete report"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Car size={16} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-gray-900">Vehicle:</span>
          <span>{report.vehicleId}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Route size={16} className="text-purple-600 shrink-0" />
          <span className="font-semibold text-gray-900">Route:</span>
          <span>{report.routeId}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold text-gray-900">Station:</span>
          <span>{report.stationId}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <OccupancyMeter
          percentage={report.occupancyPercentage}
          passengerCount={report.passengerCount}
          capacity={report.vehicleCapacity}
        />
      </div>

      <div className="flex justify-between items-center mt-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <User size={12} />
          Reported by: <span className="font-medium text-gray-700">{report.reportedBy}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
