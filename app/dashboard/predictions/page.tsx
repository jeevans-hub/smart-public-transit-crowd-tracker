'use client';

import { useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import { useCrowdPrediction } from '@/hooks/useCrowdPrediction';
import PredictionSummary from '@/components/prediction/PredictionSummary';
import PredictionChart from '@/components/prediction/PredictionChart';
import PredictionCard from '@/components/prediction/PredictionCard';
import PredictionTable from '@/components/prediction/PredictionTable';
import PredictionConfidence from '@/components/prediction/PredictionConfidence';
import PredictionInsights from '@/components/prediction/PredictionInsights';
import PredictionAlerts from '@/components/prediction/PredictionAlerts';
import PredictionMetrics from '@/components/prediction/PredictionMetrics';
import PredictionHistory from '@/components/prediction/PredictionHistory';
import { PredictionLineChart, ConfidenceTrendChart } from '@/components/prediction/PredictionChart';
import { Brain, RefreshCw, BarChart3 } from 'lucide-react';

export default function PredictionsPage() {
  const [selectedWindow, setSelectedWindow] = useState<'15' | '30' | '60'>('30');
  const { predictions, metrics, loading, error, refresh, generatePrediction, deletePrediction } = useCrowdPrediction({
    autoRefresh: true,
    refreshInterval: 30000,
    window: selectedWindow,
  });

  const handleGeneratePrediction = async () => {
    // For demo purposes, generate a prediction for a sample station
    // In production, this would be based on actual station selection
    await generatePrediction('sample-station-1', 'Central Station', selectedWindow);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-72">
          <Navbar />
          <main className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Predictions</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading && predictions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-72">
          <Navbar />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-8 h-8 text-purple-600" />
                AI Crowd Prediction
              </h1>
              <p className="text-gray-600 mt-1">Intelligent crowd forecasting and decision support</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedWindow}
                onChange={(e) => setSelectedWindow(e.target.value as '15' | '30' | '60')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
              <button
                onClick={refresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleGeneratePrediction}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Prediction
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6">
            <PredictionSummary predictions={predictions} metrics={metrics} />
          </div>

          {/* Alerts and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PredictionAlerts predictions={predictions} />
            <PredictionInsights predictions={predictions} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PredictionChart predictions={predictions} />
            <PredictionLineChart predictions={predictions} />
          </div>

          {/* Confidence Trend */}
          <div className="mb-6">
            <ConfidenceTrendChart predictions={predictions} />
          </div>

          {/* Prediction Cards */}
          {predictions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Predictions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.slice(0, 6).map((prediction) => (
                  <PredictionCard key={prediction._id} prediction={prediction} />
                ))}
              </div>
            </div>
          )}

          {/* Confidence Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <PredictionConfidence predictions={predictions} />
            {metrics && <PredictionMetrics metrics={metrics} />}
          </div>

          {/* Prediction Table */}
          <div className="mb-6">
            <PredictionTable 
              predictions={predictions} 
              onDelete={deletePrediction}
            />
          </div>

          {/* Prediction History */}
          <div>
            <PredictionHistory predictions={predictions} />
          </div>
        </main>
      </div>
    </div>
  );
}
