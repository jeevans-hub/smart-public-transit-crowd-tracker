'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, MapPin, QrCode, Ticket as TicketIcon, Users } from 'lucide-react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import { Route } from '@/types/route';
import { CreateTicketInput, Ticket } from '@/types/ticket';

const fallbackRoutes: Route[] = [
  { _id: 'purple-line', agencyId: 'bmtc', routeNumber: 'MG-1', routeName: 'Purple Line', transportType: 'METRO', originStation: 'Majestic', destinationStation: 'Baiyappanahalli', stops: [], active: true },
  { _id: 'green-line', agencyId: 'bmtc', routeNumber: 'GW-1', routeName: 'Green Line', transportType: 'METRO', originStation: 'Majestic', destinationStation: 'Nagasandra', stops: [], active: true },
  { _id: 'vajra-500', agencyId: 'bmtc', routeNumber: 'BMTC-500', routeName: 'Vajra', transportType: 'BUS', originStation: 'Electronic City', destinationStation: 'Majestic', stops: [], active: true },
];

function calculateFare(route: Route | undefined, passengers: number) {
  const baseFare = route?.transportType === 'TRAIN' ? 80 : route?.transportType === 'METRO' ? 35 : 25;
  return baseFare * passengers;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function TicketCode({ value }: { value: string }) {
  const cells = useMemo(() => {
    const hash = Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
    return Array.from({ length: 121 }, (_, index) => {
      const row = Math.floor(index / 11);
      const column = index % 11;
      const finder = (row < 3 && column < 3) || (row < 3 && column > 7) || (row > 7 && column < 3);
      return finder ? (row === 1 || column === 1 ? 1 : 0) : (hash + index * 17 + row * column) % 3 === 0 ? 1 : 0;
    });
  }, [value]);

  return (
    <div className="rounded-xl bg-white p-3 shadow-inner" aria-label={`Ticket code ${value}`}>
      <div className="grid grid-cols-11 gap-0.5" aria-hidden="true">
        {cells.map((cell, index) => <span key={index} className={`aspect-square ${cell ? 'bg-slate-900' : 'bg-white'}`} />)}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [latestTicket, setLatestTicket] = useState<Ticket | null>(null);

  const selectedRoute = routes.find(route => route._id === selectedRouteId);
  const fare = calculateFare(selectedRoute, passengerCount);

  useEffect(() => {
    const load = async () => {
      try {
        const [routesResponse, ticketsResponse] = await Promise.all([fetch('/api/routes'), fetch('/api/tickets')]);
        const routesData = await routesResponse.json();
        const ticketsData = await ticketsResponse.json();
        const availableRoutes = routesData.success && routesData.data?.length ? routesData.data : fallbackRoutes;
        setRoutes(availableRoutes);
        setSelectedRouteId(availableRoutes[0]?._id || '');
        setOrigin(availableRoutes[0]?.originStation || availableRoutes[0]?.stops[0]?.stationName || '');
        setDestination(availableRoutes[0]?.destinationStation || availableRoutes[0]?.stops[availableRoutes[0].stops.length - 1]?.stationName || '');
        if (ticketsData.success) setTickets(ticketsData.data || []);
      } catch {
        setRoutes(fallbackRoutes);
        setSelectedRouteId(fallbackRoutes[0]._id || '');
        setError('Ticket history could not be loaded. You can still create a demo ticket.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const purchaseTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRoute?._id || !origin.trim() || !destination.trim()) {
      setError('Choose a route and enter both journey points.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    const payload: CreateTicketInput = {
      routeId: selectedRoute._id,
      routeName: selectedRoute.routeName,
      routeNumber: selectedRoute.routeNumber,
      transportType: selectedRoute.transportType,
      origin: origin.trim(),
      destination: destination.trim(),
      passengerCount,
      fare,
    };

    try {
      const response = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not create ticket');
      setLatestTicket(data.data);
      setTickets(previous => [data.data, ...previous]);
      setSuccess('Ticket issued successfully. Show the ticket code when boarding.');
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : 'Could not create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72"><Navbar /><main className="p-6">
        <PageHeader title="Digital Tickets" subtitle="Buy a transit ticket and keep it ready on your phone." />
        {loading ? <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div> : <>
          {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {success && <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"><CheckCircle2 size={18} />{success}</div>}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <form onSubmit={purchaseTicket} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-3 text-blue-700"><TicketIcon /></div><div><h2 className="text-lg font-semibold text-gray-900">Plan your journey</h2><p className="text-sm text-gray-500">Demo checkout — no payment is charged.</p></div></div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Route</label>
              <select value={selectedRouteId} onChange={event => { const route = routes.find(item => item._id === event.target.value); setSelectedRouteId(event.target.value); setOrigin(route?.originStation || route?.stops[0]?.stationName || ''); setDestination(route?.destinationStation || route?.stops[route.stops.length - 1]?.stationName || ''); }} className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {routes.map(route => <option key={route._id} value={route._id}>{route.routeNumber} · {route.routeName} ({route.transportType})</option>)}
              </select>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className="mb-2 block text-sm font-medium text-gray-700">From</label><div className="relative"><MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} /><input value={origin} onChange={event => setOrigin(event.target.value)} className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Origin station" /></div></div>
                <div><label className="mb-2 block text-sm font-medium text-gray-700">To</label><div className="relative"><MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} /><input value={destination} onChange={event => setDestination(event.target.value)} className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Destination station" /></div></div>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4"><div className="flex items-center gap-3"><Users className="text-gray-500" size={19} /><div><p className="text-sm font-medium text-gray-800">Passengers</p><p className="text-xs text-gray-500">Up to 6 people per ticket</p></div></div><select value={passengerCount} onChange={event => setPassengerCount(Number(event.target.value))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">{[1, 2, 3, 4, 5, 6].map(number => <option key={number} value={number}>{number}</option>)}</select></div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5"><div><p className="text-sm text-gray-500">Estimated fare</p><p className="text-2xl font-bold text-gray-900">₹{fare}</p></div><button disabled={submitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><CreditCard size={18} />{submitting ? 'Issuing…' : 'Issue digital ticket'}</button></div>
            </form>

            {latestTicket ? <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-lg"><div className="mb-6 flex items-start justify-between"><div><p className="text-sm text-blue-200">Active ticket</p><h2 className="mt-1 text-xl font-bold">{latestTicket.routeNumber}</h2></div><QrCode className="text-blue-200" /></div><div className="mb-5 flex items-center justify-center"><TicketCode value={latestTicket.ticketNumber} /></div><p className="mb-5 text-center font-mono text-sm tracking-widest text-blue-100">{latestTicket.ticketNumber}</p><div className="space-y-3 border-t border-white/20 pt-5 text-sm"><div className="flex justify-between gap-4"><span className="text-blue-200">Journey</span><span className="text-right font-medium">{latestTicket.origin} → {latestTicket.destination}</span></div><div className="flex justify-between"><span className="text-blue-200">Valid until</span><span className="font-medium">{formatDate(latestTicket.validUntil)}</span></div><div className="flex justify-between"><span className="text-blue-200">Fare</span><span className="font-medium">₹{latestTicket.fare}</span></div></div></div> : <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center"><QrCode className="mb-4 text-gray-300" size={56} /><h2 className="font-semibold text-gray-800">Your ticket appears here</h2><p className="mt-2 max-w-xs text-sm text-gray-500">Issue a ticket to get a reference code and boarding-ready ticket.</p></div>}
          </div>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-gray-900">Ticket history</h2><p className="text-sm text-gray-500">Your most recent digital tickets</p></div><Clock3 className="text-gray-400" /></div>{tickets.length === 0 ? <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">No tickets yet.</p> : <div className="space-y-3">{tickets.map(ticket => <div key={ticket._id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{ticket.routeNumber}</span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{ticket.status}</span></div><p className="mt-1 text-sm text-gray-600">{ticket.origin} → {ticket.destination} · {ticket.passengerCount} passenger{ticket.passengerCount > 1 ? 's' : ''}</p><p className="mt-1 font-mono text-xs text-gray-400">{ticket.ticketNumber}</p></div><div className="text-left sm:text-right"><p className="font-semibold text-gray-900">₹{ticket.fare}</p><p className="text-xs text-gray-500">{formatDate(ticket.createdAt)}</p></div></div>)}</div>}</section>
        </>}
      </main></div>
    </div>
  );
}
