import React from 'react';
import { IPredictionResponse } from '@/types/prediction';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface PredictionAlertsProps {
  predictions: IPredictionResponse[];
  onDismiss?: (id: string) => void;
}

export default function PredictionAlerts({ predictions, onDismiss }: PredictionAlertsProps) {
  const generateAlerts = () => {
    const alerts: {
      id: string;
      type: 'critical' | 'warning' | 'info';
      icon: React.ReactNode;
      title: string;
      message: string;
      stationId: string;
      stationName: string;
    }[] = [];

    predictions.forEach((prediction) => {
      // Critical alerts
      if (prediction.risk === 'CRITICAL') {
        alerts.push({
          id: `critical-${prediction._id}`,
          type: 'critical',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Critical Risk',
          message: `${prediction.stationName} requires immediate attention - predicted crowd: ${prediction.predictedCrowd}%`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }

      // High prediction alerts
      if (prediction.predictedCrowd > 90) {
        alerts.push({
          id: `high-crowd-${prediction._id}`,
          type: 'critical',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Overcrowding Predicted',
          message: `${prediction.stationName} will exceed 90% occupancy within ${prediction.predictionWindow} minutes`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }

      // Rapid growth alerts
      if (prediction.trend === 'RAPID_GROWTH') {
        alerts.push({
          id: `rapid-growth-${prediction._id}`,
          type: 'warning',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'Rapid Growth Detected',
          message: `${prediction.stationName} showing rapid passenger increase - prepare for surge`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }

      // High risk alerts
      if (prediction.risk === 'HIGH') {
        alerts.push({
          id: `high-risk-${prediction._id}`,
          type: 'warning',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'High Risk Level',
          message: `${prediction.stationName} operating at high risk - monitor closely`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }

      // Low confidence alerts
      if (prediction.confidence < 50) {
        alerts.push({
          id: `low-confidence-${prediction._id}`,
          type: 'warning',
          icon: <AlertCircle className="w-5 h-5" />,
          title: 'Low Prediction Confidence',
          message: `${prediction.stationName} prediction confidence only ${prediction.confidence}% - manual monitoring required`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }

      // Info alerts for peak hours
      if (prediction.algorithm === 'PEAK_HOUR_DETECTION') {
        alerts.push({
          id: `peak-hour-${prediction._id}`,
          type: 'info',
          icon: <Info className="w-5 h-5" />,
          title: 'Peak Hour Pattern',
          message: `${prediction.stationName} prediction adjusted for peak hour patterns`,
          stationId: prediction.stationId,
          stationName: prediction.stationName,
        });
      }
    });

    return alerts;
  };

  const alerts = generateAlerts();

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No active alerts</p>
          </div>
        </div>
      </div>
    );
  }

  const getAlertStyles = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
        </div>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertStyles(alert.type)}`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${getIconColor(alert.type)}`}>
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              <p className="text-sm mt-1 opacity-90">{alert.message}</p>
              <p className="text-xs mt-2 opacity-75">{alert.stationName}</p>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
