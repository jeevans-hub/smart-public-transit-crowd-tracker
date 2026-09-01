'use client';

import Link from 'next/link';
import { Activity, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import Sidebar from '@/components/dashboard/Sidebar';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';
import type { TransitFeedHealth } from '@/types/transit';
import { useAuth } from '@/hooks/useAuth';

interface DiagnosticsResponse {
  health: TransitFeedHealth;
  etaValidation: { available: boolean; sampleCount: number; meanAbsoluteErrorMinutes: number | null; medianAbsoluteErrorMinutes: number | null; p90AbsoluteErrorMinutes: number | null };
  crowdValidation: { available: boolean; sampleCount: number; exactAgreementPercent: number | null };
  recommendationValidation: { sampleCount: number; status: string };
  reliability: { totalCycles: number; successfulCycles: number; uptimePercent: number | null; rateLimitFailures: number; timeoutFailures: number; authenticationFailures: number; staleFailures: number; averageLatencyMs: number | null };
}

const value = (input: number | null | undefined, suffix = '') => input === null || input === undefined ? 'Unavailable' : `${input}${suffix}`;

export default function BmtcDiagnosticsPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (loading) return;
    if (currentUser?.role !== 'admin') { router.replace('/dashboard'); return; }
    void fetch('/api/bmtc/diagnostics').then(async (response) => {
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message || 'Diagnostics are unavailable');
      setData(body.data);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Diagnostics are unavailable'));
  }, [currentUser, loading, router]);
  if (loading || currentUser?.role !== 'admin') return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">Checking administrator access…</div>;
  const health = data?.health;
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6">
    <PageHeader title="BMTC Live Feed Diagnostics" subtitle="Phase 7E activation, identity, freshness, and quality gates" action={health ? <TransitDataSourceBadge source={health.realFeedVerified ? 'BMTC_REALTIME' : 'DEMO'} status={health.status} provider={health.provider} verificationStatus={health.verificationStatus} fallbackActive={health.fallbackActive} activationState={health.activation?.state} /> : <TransitDataSourceBadge />} />
    <Link href="/dashboard/bmtc" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft size={16} /> Back to BMTC tracking</Link>
    {!data && !error ? <LoadingSpinner /> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div> : health && <>
      {health.activation?.shadowMode && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 font-semibold text-blue-900">SHADOW MODE — live feed checks may run, but the main user interface remains on deterministic demo data.</div>}
      <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="text-blue-600" /><h2 className="font-bold">Activation gate</h2></div><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Provider" value={health.provider} /><Metric label="Activation state" value={health.activation?.state ?? 'NOT_CONFIGURED'} /><Metric label="Decision" value={health.activation?.decision ?? 'FALLBACK_DEMO'} /><Metric label="Stable cycles" value={`${health.activation?.successfulCycles ?? 0}/${health.activation?.requiredSuccessfulCycles ?? 10}`} />
        <Metric label="Identity" value={health.verificationStatus} /><Metric label="Vehicles" value={String(health.vehicleCount)} /><Metric label="Trip updates" value={String(health.tripUpdateCount)} /><Metric label="Latency" value={value(health.feedLatencyMs, ' ms')} />
      </div><div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{(health.activation?.reasons ?? []).join(' · ') || 'Live provider status is unavailable; demo mode remains active.'}</div></section>
      <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Activity className="text-emerald-600" /><h2 className="font-bold">Feed quality</h2></div><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Mapping coverage" value={value(health.activation?.mapping?.overallPercent, '%')} /><Metric label="Mapping grade" value={health.activation?.mapping?.grade || 'Unavailable'} /><Metric label="Fresh records" value={value(health.activation?.freshness?.freshPercent, '%')} /><Metric label="Median age" value={value(health.activation?.freshness?.medianAgeSeconds, ' s')} />
        <Metric label="Oldest age" value={value(health.activation?.freshness?.oldestAgeSeconds, ' s')} /><Metric label="Invalid positions" value={value(health.activation?.positions?.invalidCount)} /><Metric label="Suspicious positions" value={value(health.activation?.positions?.suspiciousCount)} /><Metric label="Fallback" value={health.fallbackActive ? 'DEMO active' : 'Not active'} />
      </div></section>
      <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold">Provider reliability history (current process)</h2><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><Metric label="Successful cycles" value={`${data.reliability?.successfulCycles ?? 0}/${data.reliability?.totalCycles ?? 0}`} /><Metric label="Uptime" value={value(data.reliability?.uptimePercent, '%')} /><Metric label="Average latency" value={value(data.reliability?.averageLatencyMs, ' ms')} /><Metric label="Rate limits (429)" value={String(data.reliability?.rateLimitFailures ?? 0)} /><Metric label="Timeouts" value={String(data.reliability?.timeoutFailures ?? 0)} /><Metric label="Auth failures" value={String(data.reliability?.authenticationFailures ?? 0)} /><Metric label="Stale failures" value={String(data.reliability?.staleFailures ?? 0)} /></div></section>
      <section className="grid gap-4 md:grid-cols-3"><QualityCard title="ETA validation" available={data?.etaValidation.available ?? false} samples={data?.etaValidation.sampleCount ?? 0} detail={data?.etaValidation.available ? `MAE ${value(data.etaValidation.meanAbsoluteErrorMinutes, ' min')} · P90 ${value(data.etaValidation.p90AbsoluteErrorMinutes, ' min')}` : 'No observed arrivals; no accuracy claim is made.'} /><QualityCard title="Crowd validation" available={data?.crowdValidation.available ?? false} samples={data?.crowdValidation.sampleCount ?? 0} detail={data?.crowdValidation.available ? `Exact agreement ${value(data.crowdValidation.exactAgreementPercent, '%')}` : 'Live occupancy truth is unavailable.'} /><QualityCard title="Recommendations" available={(data?.recommendationValidation.sampleCount ?? 0) > 0} samples={data?.recommendationValidation.sampleCount ?? 0} detail={data?.recommendationValidation.status ?? 'Unavailable'} /></section>
    </>}
  </main></div></div>;
}

function Metric({ label, value: display }: { label: string; value: string }) { return <div><p className="text-gray-500">{label}</p><p className="mt-1 font-semibold text-gray-900">{display}</p></div>; }
function QualityCard({ title, available, samples, detail }: { title: string; available: boolean; samples: number; detail: string }) { return <div className="rounded-xl border bg-white p-5"><h2 className="font-bold text-gray-900">{title}</h2><p className={`mt-2 text-sm font-semibold ${available ? 'text-emerald-700' : 'text-amber-700'}`}>{available ? 'Available' : 'Unavailable'} · {samples} samples</p><p className="mt-2 text-sm text-gray-600">{detail}</p></div>; }
