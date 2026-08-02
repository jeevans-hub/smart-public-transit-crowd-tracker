'use client';

import { ReactNode } from 'react';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function DashboardCard({ children, className = '', title, action }: DashboardCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Export named components for compatibility
export const Card = DashboardCard;
export const CardHeader = ({ children }: { children: ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">{children}</div>
);
export const CardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
);
export const CardContent = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={`p-6 ${className || ''}`}>{children}</div>
);
