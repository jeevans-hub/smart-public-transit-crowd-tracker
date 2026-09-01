'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, MapPin, QrCode, Route, ShieldCheck, Users } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [authView, setAuthView] = useState<'login' | 'register' | null>(null);
  useEffect(() => { if (currentUser) router.push('/dashboard'); }, [currentUser, router]);
  if (loading || currentUser) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">{loading ? 'Loading…' : 'Opening dashboard…'}</div>;
  if (authView === 'login') return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4"><LoginForm onClose={() => setAuthView(null)} onRegisterClick={() => setAuthView('register')} /></div>;
  if (authView === 'register') return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4"><RegisterForm onClose={() => setAuthView(null)} onLoginClick={() => setAuthView('login')} /></div>;
  const features = [
    { icon: Bus, title: 'BMTC crowd tracking', text: 'Explore Bengaluru routes, buses, and transparent demo or live-data status.' },
    { icon: MapPin, title: 'Nearby stops', text: 'Compare upcoming buses by ETA, crowd level, direction, and destination compatibility.' },
    { icon: Users, title: 'Crowd forecasts', text: 'See estimated crowd levels, confidence, rush context, and the source behind each estimate.' },
    { icon: Route, title: 'Smart recommendations', text: 'Choose a suitable less-crowded bus without recommending a wrong-direction service.' },
    { icon: QrCode, title: 'Secure digital tickets', text: 'Generate signed QR tickets and follow their active, used, expired, or cancelled lifecycle.' },
    { icon: ShieldCheck, title: 'Source transparency', text: 'Clearly distinguish demo, shadow, verified, degraded, and unverified transit data.' },
  ];
  return <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-16 text-white"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-4xl text-center"><p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-blue-300">Focused Version 1.0</p><h1 className="text-4xl font-black sm:text-6xl">Smart Public Transit Crowd Tracker</h1><p className="mx-auto mt-6 max-w-3xl text-lg text-blue-100">A BMTC-focused application for crowd forecasts, nearby-bus recommendations, secure digital QR tickets, and transit-provider transparency.</p><div className="mt-8 flex justify-center gap-3"><button onClick={() => setAuthView('login')} className="rounded-lg bg-blue-600 px-7 py-3 font-semibold hover:bg-blue-500">Login</button><button onClick={() => setAuthView('register')} className="rounded-lg border border-blue-300 px-7 py-3 font-semibold hover:bg-white/10">Register</button></div></div><section className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur"><Icon className="text-blue-300" /><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-blue-100">{text}</p></article>)}</section><p className="mt-10 text-center text-sm text-blue-200">The current provider may operate in clearly labelled DEMO mode. Payment processing is outside Version 1.0.</p></div></main>;
}
