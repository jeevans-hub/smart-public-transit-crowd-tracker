'use client';

interface StatusBadgeProps {
  status: 'healthy' | 'moderate' | 'high' | 'critical' | 'active' | 'delayed';
  className?: string;
}

const statusConfig = {
  healthy: {
    label: 'Healthy',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
  moderate: {
    label: 'Moderate',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  high: {
    label: 'High',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    dotColor: 'bg-orange-500',
  },
  critical: {
    label: 'Critical',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  active: {
    label: 'Active',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  delayed: {
    label: 'Delayed',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    dotColor: 'bg-purple-500',
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className || ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
