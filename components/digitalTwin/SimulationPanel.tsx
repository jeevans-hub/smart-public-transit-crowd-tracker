'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/DashboardCard';
import { useSimulation } from '@/hooks/useDigitalTwin';
import { SimulationParameters, SimulationState } from '@/types/digitalTwin';
import { Play, Square, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function SimulationPanel() {
  const { simulations, startSimulation, stopSimulation, loading } = useSimulation();
  const [selectedScenario, setSelectedScenario] = useState<string>('passengerSurge');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [duration, setDuration] = useState(60);

  const scenarios = [
    { value: 'passengerSurge', label: 'Passenger Surge', description: 'Simulate sudden increase in passenger demand' },
    { value: 'vehicleBreakdown', label: 'Vehicle Breakdown', description: 'Simulate vehicle failure scenarios' },
    { value: 'stationClosure', label: 'Station Closure', description: 'Simulate station closure impact' },
    { value: 'emergencyIncident', label: 'Emergency Incident', description: 'Simulate emergency response scenarios' },
    { value: 'weatherImpact', label: 'Weather Impact', description: 'Simulate weather-related disruptions' },
    { value: 'routeDiversion', label: 'Route Diversion', description: 'Simulate route changes and detours' },
    { value: 'fleetExpansion', label: 'Fleet Expansion', description: 'Simulate adding new vehicles' },
    { value: 'peakHour', label: 'Peak Hour', description: 'Simulate rush hour conditions' },
  ];

  const handleStartSimulation = async () => {
    const parameters: SimulationParameters = {
      scenario: selectedScenario,
      severity,
      duration,
      affectedEntities: {},
    };

    await startSimulation(parameters);
  };

  const getStatusIcon = (status: SimulationState['status']) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className="text-blue-600" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-red-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {scenarios.map(scenario => (
                  <option key={scenario.value} value={scenario.value}>
                    {scenario.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {scenarios.find(s => s.value === selectedScenario)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      severity === level
                        ? level === 'critical'
                          ? 'bg-red-600 text-white'
                          : level === 'high'
                          ? 'bg-orange-600 text-white'
                          : level === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleStartSimulation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={18} />
              Start Simulation
            </button>
          </div>

          {simulations.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Active Simulations</h3>
              <div className="space-y-2">
                {simulations.map(simulation => (
                  <div
                    key={simulation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(simulation.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {scenarios.find(s => s.value === simulation.type)?.label || simulation.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(simulation.startTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {simulation.status === 'running' && (
                      <button
                        onClick={() => stopSimulation(simulation.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Square size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {simulations.some(s => s.status === 'completed') && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Latest Results</h3>
              {simulations
                .filter(s => s.status === 'completed')
                .slice(-1)
                .map(simulation => (
                  <div key={simulation.id} className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Predicted Crowd:</span>
                        <span className="ml-2 font-medium">
                          {simulation.results.predictedCrowd.length > 0
                            ? Math.round(
                                simulation.results.predictedCrowd.reduce((a, b) => a + b, 0) /
                                  simulation.results.predictedCrowd.length
                              )
                            : 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Affected Vehicles:</span>
                        <span className="ml-2 font-medium">
                          {simulation.results.vehicleImpact.affectedVehicles}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Delay:</span>
                        <span className="ml-2 font-medium">
                          {simulation.results.delay.averageDelay.toFixed(1)} min
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Affected Routes:</span>
                        <span className="ml-2 font-medium">
                          {simulation.results.routeImpact.affectedRoutes}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 text-sm">Recommendations:</span>
                      <ul className="mt-2 space-y-1">
                        {simulation.results.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
