'use client';

import DigitalTwinOverview from '@/components/digitalTwin/DigitalTwinOverview';
import CityComparison from '@/components/digitalTwin/CityComparison';
import SimulationPanel from '@/components/digitalTwin/SimulationPanel';
import ControlCenter from '@/components/digitalTwin/ControlCenter';
import { useState } from 'react';
import { LayoutGrid, BarChart3, Play, Command } from 'lucide-react';

export default function DigitalTwinPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'simulation' | 'command'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'comparison' as const, label: 'City Comparison', icon: BarChart3 },
    { id: 'simulation' as const, label: 'Simulation', icon: Play },
    { id: 'command' as const, label: 'Command Center', icon: Command },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Digital Twin</h1>
        <p className="text-gray-600 mt-1">Smart City Digital Twin & Multi-City Operations Platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && <DigitalTwinOverview />}
        {activeTab === 'comparison' && <CityComparison />}
        {activeTab === 'simulation' && <SimulationPanel />}
        {activeTab === 'command' && <ControlCenter />}
      </div>
    </div>
  );
}
