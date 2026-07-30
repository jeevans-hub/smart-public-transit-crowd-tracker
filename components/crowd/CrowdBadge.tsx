import React from 'react';
import { CrowdLevel } from '@/types/crowd';
import { CROWD_LEVEL_COLORS } from '@/utils/constants';

interface CrowdBadgeProps {
  level: CrowdLevel;
  className?: string;
}

export default function CrowdBadge({ level, className = '' }: CrowdBadgeProps) {
  const colors = CROWD_LEVEL_COLORS[level] || CROWD_LEVEL_COLORS.EMPTY;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colors.badge} ${className}`}
    >
      {level}
    </span>
  );
}
