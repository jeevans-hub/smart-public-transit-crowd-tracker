import React from 'react';
import { useConnectionState } from '@/hooks/useRealtime';
import { getConnectionStateColor, getConnectionStateLabel } from '@/utils/connectionState';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { ConnectionState } from '@/types/socket';

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export default function ConnectionStatus({ showDetails = true, compact = false }: ConnectionStatusProps) {
  const { state, connected, connecting, latency, connectionDuration, formattedLatency, formattedDuration } = useConnectionState();

  const getStatusColor = () => {
    const color = getConnectionStateColor(state);
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (state) {
      case 'CONNECTED':
        return <Wifi className="w-4 h-4" />;
      case 'CONNECTING':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'RECONNECTING':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'DISCONNECTED':
        return <WifiOff className="w-4 h-4" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusTextColor = () => {
    const color = getConnectionStateColor(state);
    switch (color) {
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'orange':
        return 'text-orange-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className={`text-xs font-medium ${getStatusTextColor()}`}>
          {getConnectionStateLabel(state)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${getStatusColor()} bg-opacity-10`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Connection Status</h3>
            <p className={`text-sm ${getStatusTextColor()}`}>
              {getConnectionStateLabel(state)}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Latency</p>
            <p className="text-sm font-semibold text-gray-900">{formattedLatency}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Connection Duration</p>
            <p className="text-sm font-semibold text-gray-900">{formattedDuration}</p>
          </div>
        </div>
      )}

      {connecting && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Attempting to reconnect...</p>
        </div>
      )}
    </div>
  );
}
