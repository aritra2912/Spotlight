'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Ticket as TicketIcon, 
  Calendar, 
  MapPin, 
  QrCode, 
  ShieldCheck, 
  CornerDownLeft,
  XCircle
} from 'lucide-react';
import { mockDb, Ticket } from '@/lib/mockDb';
import Header from '@/components/Header';
import QRCode from 'qrcode';

// Sub-component for individual Ticket Card to handle local QR code generation cleanly
function TicketCard({ ticket, now, onRefund, onResale }: { ticket: Ticket; now: number; onRefund: (tktId: string) => void; onResale: (tktId: string) => void }) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  useEffect(() => {
    // Generate QR code data URL using qrcode library
    QRCode.toDataURL(ticket.qrCode, { margin: 2, scale: 4 })
      .then(url => setQrSrc(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [ticket.qrCode]);

  const eventEnd = new Date(ticket.eventDate).getTime();
  const isPast = now > 0 ? now > eventEnd : false;

  // 48h validation check for resale list
  const hoursLeft = now > 0 ? (new Date(ticket.eventDate).getTime() - now) / (1000 * 60 * 60) : 0;
  const canResell = hoursLeft >= 48;

  // Status badge styling resolver
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'checked-in':
        return <span className="px-2 py-0.5 rounded-md bg-success/20 text-success text-[10px] font-bold">Checked In</span>;
      case 'resale-pool':
        return <span className="px-2 py-0.5 rounded-md bg-warning/20 text-warning text-[10px] font-bold animate-pulse">In Resale Pool</span>;
      case 'resold':
        return <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-400 text-[10px] font-bold">Resold (Refunded)</span>;
      case 'refunded':
        return <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-[10px] font-bold">Refunded</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold">Valid Pass</span>;
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Top section */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">
            {ticket.tierName} Entry
          </span>
          <h4 className="font-display font-extrabold text-white text-base leading-snug">
            {ticket.eventTitle}
          </h4>
        </div>
        {getStatusBadge()}
      </div>

      {/* Timing and Address */}
      <div className="text-xs text-gray-400 space-y-1">
        <p className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{new Date(ticket.eventDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="h-1 w-1 rounded-full bg-gray-700 mx-1"></span>
          <span>{new Date(ticket.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{ticket.gateLabel ? `${ticket.gateLabel}` : 'Gate details will sync'}</span>
        </p>
      </div>

      {/* Ticket QR dropdown trigger */}
      {ticket.status === 'valid' && (
        <button
          onClick={() => setShowQrCode(!showQrCode)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-all"
        >
          <QrCode className="h-4 w-4 text-primary" /> 
          {showQrCode ? 'Hide Ticket QR Code' : 'Display Ticket QR Code'}
        </button>
      )}

      {/* QR Code expander */}
      {showQrCode && qrSrc && ticket.status === 'valid' && (
        <div className="py-4 bg-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-white/5 animate-fadeIn">
          <img src={qrSrc} alt="Ticket QR code pass" className="w-40 aspect-square rounded-xl border border-white/10 shadow-lg" />
          <p className="text-[9px] text-gray-500 font-mono tracking-widest">{ticket.qrCode}</p>
          <p className="text-[10px] text-primary font-bold">Present at gate for scanning</p>
        </div>
      )}

      {/* Checked in Scan Timestamp */}
      {ticket.status === 'checked-in' && (
        <div className="p-3 bg-success/5 border border-success/15 rounded-xl text-center text-xs text-success leading-relaxed">
          Scanned successfully. Enjoy the show!
        </div>
      )}

      {/* Return & Insurance claims options */}
      {ticket.status === 'valid' && !isPast && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          {/* Resale list button */}
          {canResell ? (
            <button
              onClick={() => onResale(ticket.id)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-warning/30 text-warning bg-warning/5 hover:bg-warning/10 text-[10px] font-bold transition-all text-center"
            >
              <CornerDownLeft className="h-3.5 w-3.5" /> Return (Resale Pool)
            </button>
          ) : (
            <span 
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/5 bg-white/[0.01] text-gray-500 text-[10px] font-bold cursor-not-allowed"
              title="Resale lock active 48h before show."
            >
              <CornerDownLeft className="h-3.5 w-3.5" /> Resale Locked
            </span>
          )}

          {/* Refund or illness claim */}
          {ticket.insuranceBought ? (
            claimSubmitted ? (
              <span className="py-1.5 px-3 rounded-lg bg-success/15 border border-success/20 text-success text-[10px] font-bold text-center">
                Claim Filed
              </span>
            ) : (
              <button
                onClick={() => {
                  onRefund(ticket.id);
                  setClaimSubmitted(true);
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-[10px] font-bold transition-all text-center"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Claim Insurance
              </button>
            )
          ) : (
            <button
              onClick={() => onRefund(ticket.id)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 text-[10px] font-bold transition-all text-center"
            >
              <XCircle className="h-3.5 w-3.5" /> Request Refund
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [now, setNow] = useState<number>(0);

  const loadTickets = () => {
    const user = mockDb.getActiveUser();
    const list = mockDb.getTickets().filter(t => t.purchaserId === user.id);
    setTickets(list);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
      setNow(Date.now());
    }, 0);
    
    const handleDbUpdate = () => {
      loadTickets();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, []);

  const handleRefund = (ticketId: string) => {
    const res = mockDb.refundTicket(ticketId);
    alert(res.message);
    loadTickets();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleResale = (ticketId: string) => {
    const res = mockDb.listTicketForResale(ticketId);
    alert(res.message);
    loadTickets();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Sort upcoming vs past
  const filteredTickets = tickets.filter(tkt => {
    const eventTime = new Date(tkt.eventDate).getTime();
    const isPast = now > 0 ? now > eventTime : false;
    
    // Checked in, refunded, or resold tickets are visible under past if show ended
    if (activeTab === 'upcoming') {
      return !isPast && tkt.status !== 'refunded' && tkt.status !== 'resold';
    } else {
      return isPast || tkt.status === 'refunded' || tkt.status === 'resold';
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <TicketIcon className="h-6 w-6 text-primary" />
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">My Admission Passes</h2>
        </div>

        {/* Tab selection */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all ${
              activeTab === 'upcoming' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Upcoming Passes ({tickets.filter(t => (now > 0 ? new Date(t.eventDate).getTime() > now : false) && t.status !== 'refunded' && t.status !== 'resold').length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all ${
              activeTab === 'past' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Past & Refunded History ({tickets.filter(t => (now > 0 ? new Date(t.eventDate).getTime() <= now : false) || t.status === 'refunded' || t.status === 'resold').length})
          </button>
        </div>

        {/* Tickets Lists */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 glass-card space-y-3">
            <TicketIcon className="h-10 w-10 text-gray-500 mx-auto" />
            <h4 className="font-semibold text-white text-sm">No passes found</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
              {activeTab === 'upcoming' 
                ? "You don't have any active event passes. Explore the homepage to book tickets." 
                : "You don't have any past ticket history."}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/"
                className="inline-block py-2 px-4 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-md shadow-primary/10"
              >
                Browse Live Events
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map(tkt => (
              <TicketCard 
                key={tkt.id} 
                ticket={tkt} 
                now={now}
                onRefund={handleRefund} 
                onResale={handleResale} 
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
