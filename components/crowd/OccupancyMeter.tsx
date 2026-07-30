import React from 'react';

interface OccupancyMeterProps {
  percentage: number;
  passengerCount?: number;
  capacity?: number;
  showLabels?: boolean;
  className?: string;
}

export default function OccupancyMeter({
  percentage,
  passengerCount,
  capacity,
  showLabels = true,
  className = '',
}: OccupancyMeterProps) {
  const getBarColor = (pct: number) => {
    if (pct <= 25) return 'bg-emerald-500';
    if (pct <= 50) return 'bg-green-500';
    if (pct <= 75) return 'bg-yellow-500';
    if (pct <= 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1">
          <span>Occupancy</span>
          <span>
            {clampedPercentage}%
            {passengerCount !== undefined && capacity !== undefined
              ? ` (${passengerCount}/${capacity})`
              : ''}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(
            clampedPercentage
          )}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
