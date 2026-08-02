'use client';

import { SystemHealth } from '@/types/digitalTwin';
import { Activity, Users, Car, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/DashboardCard';

interface CityHealthCardProps {
  health: SystemHealth | null;
  loading?: boolean;
}

export default function CityHealthCard({ health, loading }: CityHealthCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>City Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>City Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">No health data available</div>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const metrics = [
    { label: 'Overall Health', value: health.overallHealthScore, icon: Activity, color: getHealthColor(health.overallHealthScore) },
    { label: 'Passenger Flow', value: health.passengerFlowIndex, icon: Users, color: getHealthColor(health.passengerFlowIndex) },
    { label: 'Fleet Availability', value: health.fleetAvailability, icon: Car, color: getHealthColor(health.fleetAvailability) },
    { label: 'Operational Efficiency', value: health.operationalEfficiency, icon: TrendingUp, color: getHealthColor(health.operationalEfficiency) },
    { label: 'Prediction Accuracy', value: health.predictionAccuracy, icon: Shield, color: getHealthColor(health.predictionAccuracy) },
    { label: 'Incident Severity', value: 100 - health.incidentSeverityIndex, icon: AlertTriangle, color: getHealthColor(100 - health.incidentSeverityIndex) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>City Health Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getHealthBg(health.overallHealthScore)}`}>
              <div>
                <div className={`text-4xl font-bold ${getHealthColor(health.overallHealthScore)}`}>
                  {health.overallHealthScore.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon size={20} className={metric.color} />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">{metric.label}</div>
                    <div className={`text-lg font-semibold ${metric.color}`}>
                      {metric.value.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Stations:</span>
                <span className="font-medium">{health.details.activeStations}/{health.details.totalStations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Vehicles:</span>
                <span className="font-medium">{health.details.activeVehicles}/{health.details.totalVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Routes:</span>
                <span className="font-medium">{health.details.activeRoutes}/{health.details.totalRoutes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Incidents:</span>
                <span className="font-medium">{health.details.activeIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Delay:</span>
                <span className="font-medium">{health.details.averageDelay.toFixed(1)}min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Speed:</span>
                <span className="font-medium">{health.details.averageSpeed.toFixed(1)}km/h</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
