import type { TransitCrowdLevel } from '@/types/transit';

const styles: Record<TransitCrowdLevel, string> = {
  LOW: 'bg-emerald-100 text-emerald-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  VERY_HIGH: 'bg-red-100 text-red-800',
};

export default function CrowdBadge({ level }: { level: TransitCrowdLevel }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>{level.replace('_', ' ')}</span>;
}
