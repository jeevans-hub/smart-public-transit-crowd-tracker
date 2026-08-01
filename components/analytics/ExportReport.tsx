import React, { useState } from 'react';
import { AnalyticsFilters, ExportOptions, ExportSection } from '@/types/analytics';

interface ExportReportProps {
  filters: AnalyticsFilters;
  onExport?: (options: ExportOptions) => void;
}

export const ExportReport: React.FC<ExportReportProps> = ({ filters, onExport }) => {
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ExportSection[]>([
    'OVERVIEW',
    'KPI',
    'TRENDS',
    'STATIONS',
    'ROUTES',
    'VEHICLES',
  ]);

  const sections: { value: ExportSection; label: string }[] = [
    { value: 'OVERVIEW', label: 'Overview' },
    { value: 'KPI', label: 'KPI Dashboard' },
    { value: 'TRENDS', label: 'Trend Analysis' },
    { value: 'STATIONS', label: 'Station Analytics' },
    { value: 'ROUTES', label: 'Route Analytics' },
    { value: 'VEHICLES', label: 'Vehicle Analytics' },
    { value: 'PEAK_HOURS', label: 'Peak Hour Analysis' },
    { value: 'RECOMMENDATIONS', label: 'AI Recommendations' },
  ];

  const toggleSection = (section: ExportSection) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleExport = () => {
    const options: ExportOptions = {
      format,
      dateRange: filters.dateRange,
      includeCharts,
      includeRawData,
      sections: selectedSections,
    };
    onExport?.(options);
  };

  const isExportDisabled = selectedSections.length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
      
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <div className="flex gap-3">
            {(['PDF', 'EXCEL', 'CSV'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  format === fmt
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Options</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">Include Charts</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRawData}
              onChange={(e) => setIncludeRawData(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">Include Raw Data</span>
          </label>
        </div>

        {/* Sections */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Sections</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sections.map((section) => (
              <label
                key={section.value}
                className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.value)}
                  onChange={() => toggleSection(section.value)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date Range:</span> {filters.dateRange.range}
            {filters.dateRange.startDate && (
              <span className="ml-2">
                ({filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate?.toLocaleDateString()})
              </span>
            )}
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExportDisabled}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isExportDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Export Report
        </button>
      </div>
    </div>
  );
};
