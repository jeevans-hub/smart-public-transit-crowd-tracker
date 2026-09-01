'use client';

import { useEffect, useState } from 'react';
import { History, Ticket as TicketIcon } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import type { Ticket } from '@/types/ticket';

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void fetch('/api/tickets').then(async (response) => { const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.error || 'Unable to load ticket history'); setTickets(body.data || []); }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load ticket history')).finally(() => setLoading(false)); }, []);
  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="space-y-6 p-6"><PageHeader title="Ticket History" subtitle="Your active and previous digital transit tickets" />{loading ? <LoadingSpinner /> : error ? <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div> : tickets.length === 0 ? <div className="rounded-xl border bg-white p-12 text-center text-gray-500"><History className="mx-auto mb-3" size={42} /><p>No tickets have been generated yet.</p></div> : <div className="space-y-3">{tickets.map((ticket) => <article key={ticket._id} className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><TicketIcon className="mt-1 text-blue-600" /><div><div className="flex items-center gap-2"><h2 className="font-bold text-gray-900">Route {ticket.routeNumber}</h2><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{ticket.status}</span></div><p className="mt-1 text-sm text-gray-600">{ticket.origin} → {ticket.destination}</p><p className="mt-1 font-mono text-xs text-gray-400">{ticket.ticketNumber}</p></div></div><div className="text-sm sm:text-right"><p className="font-semibold">₹{ticket.fare} · {ticket.passengerCount} passenger{ticket.passengerCount === 1 ? '' : 's'}</p><p className="text-gray-500">Created {formatDate(ticket.createdAt)}</p><p className="text-gray-500">Valid until {formatDate(ticket.validUntil)}</p></div></article>)}</div>}</main></div></div>;
}
