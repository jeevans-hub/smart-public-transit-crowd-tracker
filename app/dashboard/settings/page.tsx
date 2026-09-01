'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import { Bell, Languages, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6"><PageHeader title="Settings" subtitle="Version 1.0 account and notification preferences" /><div className="grid gap-4 md:grid-cols-3"><Card icon={Bell} title="In-app crowd alerts" text="Crowd alerts appear inside the application with route, stop, threshold, compatibility, and cooldown checks." /><Card icon={Languages} title="Language" text="Version 1.0 uses an English interface; additional language controls are future scope." /><Card icon={ShieldCheck} title="Security" text="Authentication protects passenger data, while validation and diagnostics require administrator access." /></div><div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">SMS and phone verification are postponed for Version 1.0. No Twilio credentials are required.</div></main></div></div>;
}

function Card({ icon: Icon, title, text }: { icon: typeof Bell; title: string; text: string }) { return <section className="rounded-xl border bg-white p-5 shadow-sm"><Icon className="text-blue-600" /><h2 className="mt-3 font-bold">{title}</h2><p className="mt-2 text-sm text-gray-600">{text}</p></section>; }
