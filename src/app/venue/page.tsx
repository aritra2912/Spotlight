'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, 
  Calendar, 
  DollarSign, 
  X, 
  Clock, 
  Users, 
  ShieldCheck, 
  TrendingUp,
  Inbox
} from 'lucide-react';
import { mockDb, VenueBooking, User, EscrowEntry, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

export default function VenueOwnerDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Dashboard lists
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [walletHistory, setWalletHistory] = useState<EscrowEntry[]>([]);

  // Block date inputs
  const [newBlockDate, setNewBlockDate] = useState('');
  
  // Counter offer input fields
  const [counterBookingId, setCounterBookingId] = useState<string | null>(null);
  const [counterPercent, setCounterPercent] = useState<number>(25);

  const loadVenueData = useCallback(() => {
    const user = mockDb.getActiveUser();
    setCurrentUser(user);

    if (user.activeRole !== 'venue') {
      router.push('/');
      return;
    }

    const bks = mockDb.getBookingsForVenue(user.id);
    setBookings(bks);

    setBlockedDates(user.venueBlockedDates || []);

    // Simulated wallet history: find completed events involving this venue
    const completedEscrows = mockDb.getEscrows().filter(esc => {
      const ev = mockDb.getEvent(esc.eventId);
      return ev?.venueId === user.id && esc.status === 'released';
    });
    setWalletHistory(completedEscrows);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadVenueData();
    }, 0);

    const handleDbUpdate = () => {
      loadVenueData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadVenueData]);

  if (!currentUser) return null;

  // Accept booking proposal
  const handleAccept = (bookingId: string) => {
    mockDb.respondToBooking(bookingId, 'accepted');
    loadVenueData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Decline booking proposal
  const handleDecline = (bookingId: string) => {
    mockDb.respondToBooking(bookingId, 'declined');
    loadVenueData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Submit counter split percentage
  const handleCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterBookingId) return;

    mockDb.respondToBooking(counterBookingId, 'countered', counterPercent);
    setCounterBookingId(null);
    loadVenueData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Block out a calendar date
  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate) return;

    const updatedDates = [...blockedDates, new Date(newBlockDate).toISOString()];
    const updatedUser = {
      ...currentUser,
      venueBlockedDates: updatedDates
    };
    mockDb.updateUser(updatedUser);
    setNewBlockDate('');
    loadVenueData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleRemoveBlockedDate = (dateStr: string) => {
    const updatedDates = blockedDates.filter(d => d !== dateStr);
    const updatedUser = {
      ...currentUser,
      venueBlockedDates: updatedDates
    };
    mockDb.updateUser(updatedUser);
    loadVenueData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Compute metrics
  const activeBookingsCount = bookings.filter(b => b.status === 'accepted').length;
  const pendingRequestsCount = bookings.filter(b => b.status === 'pending' || b.status === 'countered').length;
  const totalSharesReceived = walletHistory.reduce((sum, esc) => sum + Math.round(esc.netRevenue * 0.2), 0); // Assuming average 20% split

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        
        {/* Page Head */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Venue Manager</h2>
              <p className="text-xs text-gray-400 mt-0.5">{currentUser.venueName} • Capacity: {currentUser.venueCapacity} guests</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-success/15 border border-success/20 text-xs font-semibold text-success flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Active Host
          </span>
        </div>

        {/* Metrics Rows */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Confirmed Gigs</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">{activeBookingsCount} bookings</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pending Offers</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">{pendingRequestsCount} proposals</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Earnings Share</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">₹{totalSharesReceived.toLocaleString()}</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Wallet</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">₹{currentUser.walletBalance.toLocaleString()}</h4>
            </div>
          </div>
        </section>

        {/* Main layout divided into column panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: INCOMING BOOKING PROPOSALS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-white text-base">Booking Requests & Negotiations</h3>
              <p className="text-xs text-gray-400">Review, negotiate splits, or accept bookings from creative organizers.</p>
            </div>

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <Inbox className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No booking requests submitted yet.</p>
                </div>
              ) : (
                bookings.map(bk => {
                  const ev = mockDb.getEvent(bk.eventId);
                  if (!ev) return null;

                  return (
                    <div key={bk.id} className="glass-card p-5 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-[9px] font-bold text-primary uppercase tracking-wider inline-block">
                            {ev.category}
                          </span>
                          <h4 className="font-semibold text-white text-sm leading-snug">{bk.eventTitle}</h4>
                        </div>

                        {/* Status Label */}
                        <div>
                          {bk.status === 'accepted' ? (
                            <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[9px] font-bold">Accepted & Locked</span>
                          ) : bk.status === 'declined' ? (
                            <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[9px] font-bold">Declined</span>
                          ) : bk.status === 'countered' ? (
                            <span className="px-2 py-0.5 rounded bg-warning/20 text-warning text-[9px] font-bold">Counter Split Proposed</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-400 text-[9px] font-bold">Pending Review</span>
                          )}
                        </div>
                      </div>

                      {/* Event Meta details */}
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 border-t border-b border-white/5 py-3">
                        <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary" /> {new Date(ev.startDate).toLocaleDateString()}</p>
                        <p className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Expected: {ev.ticketTiers.reduce((s,t)=>s+t.capacity,0)} guests</p>
                      </div>

                      {/* Proposals and Split Negotiations */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs">
                          <span className="text-gray-500 block">Proposed revenue split cut:</span>
                          <span className="font-bold text-white text-sm">{bk.proposedSplit}% of ticket sales</span>
                        </div>

                        {/* Action buttons (active only if pending or countered) */}
                        {(bk.status === 'pending' || bk.status === 'countered') && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setCounterBookingId(bk.id);
                                setCounterPercent(bk.proposedSplit);
                              }}
                              className="py-1.5 px-3 rounded-lg border border-white/10 text-gray-300 hover:text-white text-xs font-semibold"
                            >
                              Counter Split
                            </button>
                            <button
                              onClick={() => handleDecline(bk.id)}
                              className="py-1.5 px-3 rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-bold"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAccept(bk.id)}
                              className="py-1.5 px-4 rounded-lg bg-success text-white hover:bg-success/90 text-xs font-bold"
                            >
                              Accept & Book
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: BLOCKED CALENDAR DATES */}
          <div className="space-y-6">
            
            {/* Block calendar dates panel */}
            <div className="glass-card p-5 space-y-4">
              <h4 className="font-display font-bold text-white text-base">Calendar Availability</h4>
              <p className="text-[10px] text-gray-400">Block specific dates to mark your loft unavailable for creator inquiries.</p>

              {/* Add blocked date form */}
              <form onSubmit={handleAddBlockedDate} className="flex gap-2">
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="flex-1 glass-input text-xs py-1.5 bg-background"
                  required
                />
                <button
                  type="submit"
                  className="py-2 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
                >
                  Block Date
                </button>
              </form>

              {/* Blocked Dates List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {blockedDates.length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-2">No dates currently blocked.</p>
                ) : (
                  blockedDates.map(dateStr => (
                    <div key={dateStr} className="flex justify-between items-center text-xs p-2 bg-white/[0.01] rounded-lg border border-white/[0.03]">
                      <span className="text-gray-300 font-semibold">{new Date(dateStr).toLocaleDateString([], { weekday:'short', month:'short', day:'numeric', year:'numeric' })}</span>
                      <button
                        onClick={() => handleRemoveBlockedDate(dateStr)}
                        className="text-gray-500 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Simulated Wallet Ledger payouts */}
            <div className="glass-card p-5 space-y-4">
              <h4 className="font-display font-bold text-white text-base">Revenue Disbursals</h4>
              <p className="text-[10px] text-gray-400">Ledger of processed payouts credited to your balance post-event.</p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {walletHistory.length === 0 ? (
                  <p className="text-[10px] text-gray-500 text-center py-2">No disbursal payouts processed yet.</p>
                ) : (
                  walletHistory.map(esc => {
                    const share = Math.round(esc.netRevenue * 0.2); // 20%
                    return (
                      <div key={esc.eventId} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <h6 className="font-semibold text-white truncate max-w-[130px]">{esc.eventTitle}</h6>
                          <span className="text-[9px] text-gray-500 block mt-0.5">Disbursed: {new Date(esc.releaseTime).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-emerald-400">+₹{share.toLocaleString()}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* COUNTER OFFER SPLIT PROPOSAL MODAL */}
      {counterBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card p-6 border border-white/10 relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-1.5 mb-2">
              <DollarSign className="text-primary h-5 w-5" /> Propose Counter Offer
            </h4>
            <p className="text-xs text-gray-400 leading-normal mb-4">
              Propose a different ticket revenue split percentage. Organizers must agree or submit counter offers.
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Counter Split %</label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={counterPercent}
                  onChange={(e) => setCounterPercent(Number(e.target.value))}
                  className="w-full glass-input text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCounterBookingId(null)}
                  className="py-1.5 px-3 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover"
                >
                  Submit Counter Split
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
