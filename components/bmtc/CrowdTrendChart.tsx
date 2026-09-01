'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CrowdTrendPoint } from '@/types/recommendation';

export default function CrowdTrendChart({ data, demo }: { data: CrowdTrendPoint[]; demo: boolean }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4"><h2 className="font-bold text-gray-900">Route crowd trend</h2><p className="text-sm text-gray-500">{demo ? 'Demo historical pattern' : 'Historical route-hour pattern'}</p></div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 14, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Crowd score']} />
            <Line type="monotone" dataKey="crowdScore" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
