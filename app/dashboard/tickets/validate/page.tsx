'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, ScanLine, Ticket as TicketIcon } from 'lucide-react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import PageHeader from '@/components/dashboard/PageHeader';
import { Ticket } from '@/types/ticket';

export default function ValidateTicketsPage() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const validate = async () => {
    if (!ticketNumber.trim() && !qrPayload.trim()) {
      setValid(false);
      setMessage('Enter a ticket number or paste the QR payload.');
      return;
    }
    setChecking(true);
    setTicket(null);
    setMessage('');
    try {
      const response = await fetch('/api/tickets/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketNumber, qrPayload }) });
      const data = await response.json();
      setValid(Boolean(data.valid));
      setMessage(data.message || data.error || 'Validation complete');
      if (data.data?._id) setTicket(data.data);
    } catch {
      setValid(false);
      setMessage('Validation service is unavailable.');
    } finally {
      setChecking(false);
    }
  };

  return <div className="min-h-screen bg-gray-50"><Sidebar /><div className="lg:ml-72"><Navbar /><main className="p-6">
    <PageHeader title="Validate Tickets" subtitle="Verify a passenger ticket before boarding." />
    <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-indigo-100 p-3 text-indigo-700"><ScanLine /></div><div><h2 className="text-lg font-semibold text-gray-900">Ticket checker</h2><p className="text-sm text-gray-500">Use the reference number or paste scanned QR data.</p></div></div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Ticket number</label>
        <input value={ticketNumber} onChange={event => setTicketNumber(event.target.value)} placeholder="TT-..." className="mb-5 w-full rounded-lg border border-gray-300 px-3 py-3 font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wider text-gray-400"><span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" /></div>
        <label className="mb-2 block text-sm font-medium text-gray-700">QR payload</label>
        <textarea value={qrPayload} onChange={event => setQrPayload(event.target.value)} rows={4} placeholder="Paste the scanned QR value here" className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={validate} disabled={checking} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"><TicketIcon size={18} />{checking ? 'Checking…' : 'Validate ticket'}</button>
        {message && <div className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-sm ${valid ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{valid ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{message}</span></div>}
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-lg font-semibold text-gray-900">Validation result</h2>{ticket ? <div className="space-y-4 text-sm"><div><p className="text-gray-500">Ticket</p><p className="font-mono font-semibold text-gray-900">{ticket.ticketNumber}</p></div><div><p className="text-gray-500">Journey</p><p className="font-medium text-gray-900">{ticket.origin} → {ticket.destination}</p></div><div className="flex justify-between"><span className="text-gray-500">Route</span><span className="font-medium text-gray-900">{ticket.routeNumber}</span></div><div className="flex justify-between"><span className="text-gray-500">Passengers</span><span className="font-medium text-gray-900">{ticket.passengerCount}</span></div><div className="flex justify-between"><span className="text-gray-500">Fare</span><span className="font-medium text-gray-900">₹{ticket.fare}</span></div><div className="flex justify-between border-t border-gray-100 pt-4"><span className="text-gray-500">Status</span><span className={`font-semibold ${ticket.status === 'USED' ? 'text-indigo-600' : valid ? 'text-green-600' : 'text-red-600'}`}>{ticket.status}</span></div></div> : <div className="flex min-h-64 flex-col items-center justify-center text-center text-gray-400"><ScanLine size={48} className="mb-4" /><p className="text-sm">Ticket details will appear after validation.</p></div>}</section>
    </div>
  </main></div></div>;
}
