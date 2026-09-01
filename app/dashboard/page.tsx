'use client';

import Link from 'next/link';
import { ArrowRight, Bus, MapPin, QrCode, Sparkles, Ticket } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import TransitDataSourceBadge from '@/components/bmtc/TransitDataSourceBadge';

export default function DashboardPage() {
  const journey = [
    { href: '/dashboard/bmtc', title: 'BMTC Tracking', text: 'Search routes and inspect vehicle crowd status.', icon: Bus, color: 'bg-blue-100 text-blue-700' },
    { href: '/dashboard/bmtc/nearby', title: 'Nearby Stops', text: 'Choose a destination and compare compatible buses.', icon: MapPin, color: 'bg-emerald-100 text-emerald-700' },
    { href: '/dashboard/bmtc/forecasts', title: 'Crowd Forecasts', text: 'Review estimated crowd, confidence, and rush context.', icon: Sparkles, color: 'bg-purple-100 text-purple-700' },
    { href: '/dashboard/tickets', title: 'Digital Tickets', text: 'Generate a signed QR ticket for the selected journey.', icon: QrCode, color: 'bg-amber-100 text-amber-700' },
  ];
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-7 p-6"><PageHeader title="Transit Dashboard" subtitle="Your BMTC crowd-tracking and ticketing journey" action={<TransitDataSourceBadge source="DEMO" />} /><section className="rounded-2xl bg-gradient-to-r from-blue-800 to-indigo-800 p-7 text-white"><p className="text-sm font-semibold text-blue-200">Recommended demonstration flow</p><h2 className="mt-2 text-2xl font-bold">Track → compare → forecast → ticket</h2><p className="mt-2 max-w-2xl text-blue-100">Start with BMTC Tracking, find a nearby stop, compare destination-compatible buses, then generate a secure digital ticket.</p><Link href="/dashboard/bmtc" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-800">Start BMTC tracking <ArrowRight size={16} /></Link></section><section><h2 className="mb-4 text-lg font-bold text-gray-900">Version 1.0 journey</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journey.map(({ href, title, text, icon: Icon, color }, index) => <Link key={href} href={href} className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><div className={`rounded-lg p-2 ${color}`}><Icon /></div><span className="text-xs font-bold text-gray-400">0{index + 1}</span></div><h3 className="mt-4 font-bold text-gray-900">{title}</h3><p className="mt-2 text-sm text-gray-600">{text}</p></Link>)}</div></section><section className="grid gap-4 md:grid-cols-2"><Link href="/dashboard/tickets/history" className="rounded-xl border bg-white p-5"><div className="flex items-center gap-3"><Ticket className="text-blue-600" /><div><h2 className="font-bold">Ticket history</h2><p className="text-sm text-gray-600">Review active and previous tickets.</p></div></div></Link><div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Current data mode</h2><p className="mt-1 text-sm text-amber-800">Demo transit data remains active until an authorized provider passes Phase 7E verification.</p></div></section></main></div></div>;
}
