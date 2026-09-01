'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Bus, ChartNoAxesCombined, History, LayoutDashboard, MapPin, Menu, QrCode, ScanLine, ShieldCheck, Ticket, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getNavigationForRole } from '@/utils/navigation';
import type { AppRole } from '@/utils/authorization';

const icons = { Dashboard: LayoutDashboard, 'BMTC Tracking': Bus, 'Nearby Stops': MapPin, 'Crowd Forecasts': ChartNoAxesCombined, 'Digital Tickets': Ticket, 'Ticket History': History, 'Ticket Validation': ScanLine, 'Provider Diagnostics': Activity };

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const role: AppRole = currentUser?.role === 'admin' ? 'admin' : 'user';
  const navigation = getNavigationForRole(role);
  const handleLogout = async () => { await logout(); router.push('/'); };

  return <>
    <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle navigation" className="fixed left-4 top-4 z-50 rounded-lg border bg-white p-2 shadow-md lg:hidden">{isOpen ? <X size={24} /> : <Menu size={24} />}</button>
    <aside className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="border-b border-gray-200 p-6"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800"><QrCode className="text-white" /></div><div><h1 className="text-lg font-bold text-gray-900">BMTC Transit</h1><p className="text-xs text-gray-500">Crowd tracker and tickets</p></div></div></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item, index) => {
          const Icon = icons[item.label as keyof typeof icons] ?? ShieldCheck;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const showAdminHeading = item.privileged && !navigation[index - 1]?.privileged;
          return <div key={item.href}>{showAdminHeading && <p className="mb-2 mt-5 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Admin</p>}<Link href={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}><Icon size={19} /><div><span className="block text-sm">{item.label}</span><span className="block text-xs font-normal text-gray-500">{item.description}</span></div></Link></div>;
        })}
      </nav>
      <div className="border-t bg-gray-50 p-4"><div className="mb-3 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 font-semibold text-white">{currentUser?.username?.slice(0, 2).toUpperCase() || 'U'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{currentUser?.username || 'User'}</p><p className="text-xs capitalize text-gray-500">{role}</p></div></div><button onClick={handleLogout} className="w-full rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600">Logout</button></div>
    </aside>
    {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />}
  </>;
}
