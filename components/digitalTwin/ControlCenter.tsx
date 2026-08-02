'use client';

import { useState, useEffect } from 'react';
import { useDigitalTwin } from '@/hooks/useDigitalTwin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/DashboardCard';
import { ResourceRecommendation } from '@/types/digitalTwin';
import { AlertTriangle, CheckCircle, Clock, Zap, Users, Wrench } from 'lucide-react';

export default function ControlCenter() {
  const { state, getResourceRecommendations } = useDigitalTwin();
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state?.selectedCity) {
      fetchRecommendations(state.selectedCity._id);
    }
  }, [state?.selectedCity]);

  const fetchRecommendations = async (cityId: string) => {
    setLoading(true);
    const data = await getResourceRecommendations(cityId);
    if (data) {
      setRecommendations(data);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vehicleRedistribution':
        return <Users size={18} />;
      case 'emergencyAllocation':
        return <AlertTriangle size={18} />;
      case 'maintenanceScheduling':
        return <Wrench size={18} />;
      default:
        return <Zap size={18} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Command Center</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {state?.systemHealth && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat
                label="Active Incidents"
                value={state.systemHealth.details.activeIncidents}
                icon={<AlertTriangle size={18} className="text-red-600" />}
              />
              <QuickStat
                label="Active Vehicles"
                value={state.systemHealth.details.activeVehicles}
                icon={<CheckCircle size={18} className="text-green-600" />}
              />
              <QuickStat
                label="System Reliability"
                value={`${state.systemHealth.systemReliability.toFixed(0)}%`}
                icon={<Clock size={18} className="text-blue-600" />}
              />
              <QuickStat
                label="Resource Utilization"
                value={`${state.systemHealth.resourceUtilization.toFixed(0)}%`}
                icon={<Zap size={18} className="text-yellow-600" />}
              />
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-3">AI Recommendations</h3>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No recommendations at this time</div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 5).map(rec => (
                  <div
                    key={rec.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(rec.type)}
                        <span className="font-medium text-sm">{rec.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Impact: +{rec.estimatedImpact.improvement}% {rec.estimatedImpact.metric}</span>
                      <span>Confidence: {(rec.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state?.fleetDistribution && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Fleet Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Fleet</span>
                  <span className="font-medium">{state.fleetDistribution.totalVehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="font-medium text-green-600">{state.fleetDistribution.activeVehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Maintenance</span>
                  <span className="font-medium text-yellow-600">{state.fleetDistribution.maintenanceVehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inactive</span>
                  <span className="font-medium text-red-600">{state.fleetDistribution.inactiveVehicles}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {icon}
      <div>
        <div className="text-xs text-gray-600">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}
