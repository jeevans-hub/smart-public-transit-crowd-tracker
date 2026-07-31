import React from 'react';
import { useServerInfo } from '@/hooks/useRealtime';
import { Activity, Clock, Users, MessageSquare, Zap, Server } from 'lucide-react';

interface SystemHealthCardProps {
  compact?: boolean;
}

export default function SystemHealthCard({ compact = false }: SystemHealthCardProps) {
  const { serverInfo, connected, hasServerInfo } = useServerInfo();

  const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Show basic connection status even without server info
  if (!hasServerInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">System Health</h3>
          <div className={`ml-auto w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold text-gray-900">
                {connected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Server</p>
              <p className="text-sm font-semibold text-gray-900">Online</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {connected ? 'Real-time data available' : 'Login for detailed metrics'}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">System Health</h3>
          <div className={`ml-auto w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Clients</p>
              <p className="text-sm font-semibold text-gray-900">{serverInfo?.connectedClients || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Latency</p>
              <p className="text-sm font-semibold text-gray-900">{Math.round(serverInfo?.averageLatency || 0)}ms</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">System Health</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500">Socket Status</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{connected ? 'Connected' : 'Disconnected'}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Server Uptime</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {serverInfo?.uptime ? formatUptime(serverInfo.uptime) : 'N/A'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-500">Connected Clients</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{serverInfo?.connectedClients || 0}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-gray-500">Messages Sent</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(serverInfo?.messagesSent || 0)}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-500">Messages Received</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(serverInfo?.messagesReceived || 0)}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-gray-500">Average Latency</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{Math.round(serverInfo?.averageLatency || 0)}ms</p>
        </div>
      </div>

      {serverInfo?.startTime && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Server started: {new Date(serverInfo.startTime).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
