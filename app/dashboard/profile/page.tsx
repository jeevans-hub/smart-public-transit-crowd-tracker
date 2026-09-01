'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import { Mail, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6"><PageHeader title="Profile" subtitle="Your transit account" /><section className="mx-auto max-w-2xl rounded-2xl border bg-white p-7 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"><UserCircle size={36} className="text-blue-700" /></div><div><h2 className="text-xl font-bold text-gray-900">{currentUser?.username || 'User'}</h2><p className="capitalize text-gray-500">{currentUser?.role || 'user'} account</p></div></div><div className="mt-7 space-y-4 border-t pt-6"><div className="flex items-center gap-3"><Mail className="text-gray-400" /><div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{currentUser?.email || 'Unavailable'}</p></div></div><div className="flex items-center gap-3"><Shield className="text-gray-400" /><div><p className="text-xs text-gray-500">Access</p><p className="font-medium">{currentUser?.role === 'admin' ? 'Passenger and administrator tools' : 'Passenger tools'}</p></div></div></div></section></main></div></div>;
}
