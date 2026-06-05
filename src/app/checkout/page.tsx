'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, 
  ShieldCheck, 
  ChevronRight, 
  HelpCircle,
  Wallet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { mockDb, TicketTier, User, Ticket, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const eventId = searchParams.get('eventId') || '';
  const tierId = searchParams.get('tierId') || '';
  const quantity = Number(searchParams.get('quantity')) || 1;

  const [event, setEvent] = useState<Event | null>(null);
  const [tier, setTier] = useState<TicketTier | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Checkout Option States
  const [buyInsurance, setBuyInsurance] = useState(false);
  const [crmOptIn, setCrmOptIn] = useState(false);
  
  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkoutTickets, setCheckoutTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!eventId || !tierId) {
      router.push('/');
      return;
    }

    const ev = mockDb.getEvent(eventId);
    if (!ev) {
      router.push('/');
      return;
    }

    const t = ev.ticketTiers.find(x => x.id === tierId);
    if (!t) {
      router.push('/');
      return;
    }

    const user = mockDb.getActiveUser();
    
    const timer = setTimeout(() => {
      setEvent(ev);
      setTier(t);
      setCurrentUser(user);
    }, 0);

    return () => clearTimeout(timer);
  }, [eventId, tierId, router]);

  if (!event || !tier || !currentUser) return null;

  // Calculate pricing breakdown
  const ticketPrice = tier.price;
  const grossTotal = ticketPrice * quantity;
  const platformFee = Math.round(grossTotal * 0.1); // 10%
  const insuranceCost = buyInsurance ? 49 * quantity : 0;
  const grandTotal = grossTotal + platformFee + insuranceCost;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsProcessing(true);

    // Simulated short network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const res = mockDb.purchaseTickets(event.id, tier.id, quantity, buyInsurance);
    
    setIsProcessing(false);
    if (res.success) {
      setSuccess(true);
      if (res.tickets) setCheckoutTickets(res.tickets);
      
      // Update global header components
      window.dispatchEvent(new Event('mockdb-update'));

      // If CRM opt-in was selected, simulate adding to organizer email list
      if (crmOptIn) {
        console.log(`CRM Opt-in: Registered ${currentUser.name} (${currentUser.email}) to organizer ${event.creatorName}\'s list.`);
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Checkout Form */}
      <div className="lg:col-span-2 space-y-6">
        {success ? (
          /* SUCCESS SCREEN */
          <div className="glass-card p-8 text-center space-y-6 animate-fadeIn">
            <div className="inline-flex h-14 w-14 rounded-full bg-success/20 text-success items-center justify-center border border-success/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-2xl text-white">Booking Confirmed!</h3>
              <p className="text-xs text-gray-400">
                Your passes for <strong>{event.title}</strong> are successfully issued.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-2">
              <h4 className="font-semibold text-white text-xs">Summary Details:</h4>
              <div className="text-[11px] text-gray-400 space-y-1">
                <p>Attendee: {currentUser.name}</p>
                <p>Pass Type: {tier.name} (Qty: {quantity})</p>
                <p>Date: {new Date(event.startDate).toLocaleDateString()}</p>
                <p>Escrow Hold Status: {tier.price === 0 ? 'Exempt (Free event)' : 'Held Securely'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link 
                href="/my-tickets"
                className="py-2.5 px-6 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white text-xs transition-all"
              >
                View My Tickets (Get QRs)
              </Link>
              <Link 
                href="/"
                className="py-2.5 px-6 rounded-xl font-bold bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs transition-all"
              >
                Back to Explore
              </Link>
            </div>
          </div>
        ) : (
          /* PAYMENT CARD FORM */
          <form onSubmit={handlePayNow} className="space-y-6">
            
            {/* Dynamic Cancellation Protection Insurance (Phase 5) */}
            <div className={`p-5 rounded-2xl border transition-all ${buyInsurance ? 'bg-primary/5 border-primary' : 'bg-white/[0.02] border-white/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <ShieldCheck className={`h-8 w-8 shrink-0 ${buyInsurance ? 'text-primary' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="font-semibold text-white text-sm">Add Cancellation Protection</h4>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                      Get a 100% ticket refund if the event is cancelled or you submit an illness claim. Only ₹49 per pass.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBuyInsurance(!buyInsurance)}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${buyInsurance ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${buyInsurance ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Simulated Payment details card */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-display font-bold text-white text-base flex items-center gap-1.5 border-b border-white/5 pb-3">
                <CreditCard className="h-4.5 w-4.5 text-primary" /> Test-Mode Wallet Checkout
              </h4>

              {errorMsg && (
                <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl flex items-start gap-2 text-danger text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Wallet Info */}
              <div className="p-3.5 bg-white/[0.02] rounded-xl flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <span>Your Mock Wallet Balance</span>
                </div>
                <span className="font-bold text-emerald-400">₹{currentUser.walletBalance.toLocaleString()}</span>
              </div>

              {/* Mock Card form */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] text-gray-400 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <strong>Simulated Mode:</strong> Payment will deduct from your mock wallet balance above. No real credit cards or gateways are connected.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Simulated Card #</label>
                    <input type="text" placeholder="4111 2222 3333 4444" className="w-full glass-input text-xs" disabled />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Holder Name</label>
                    <input type="text" value={currentUser.name} className="w-full glass-input text-xs" disabled />
                  </div>
                </div>
              </div>
            </div>

            {/* DPDP Compliance and CRM opt-in (Phase 4) */}
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-3">
              <input 
                id="crm-opt" 
                type="checkbox"
                checked={crmOptIn}
                onChange={() => setCrmOptIn(!crmOptIn)}
                className="mt-0.5 h-4 w-4 text-primary bg-black/40 border-white/10 rounded accent-primary"
              />
              <div className="text-[10px] text-gray-400 leading-normal">
                <label htmlFor="crm-opt" className="font-semibold text-white block cursor-pointer">
                  Opt-in to {event.creatorName}&apos;s updates (CRM Compliance)
                </label>
                By checking this, you agree to share your name, email, and phone number with the creator of this event for future marketing campaigns (DPDP compliant).
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
            >
              {isProcessing ? (
                <>Processing Securely...</>
              ) : (
                <>Pay ₹{grandTotal.toLocaleString()} Now <ChevronRight className="h-4.5 w-4.5" /></>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Order Summary sidebar */}
      <div className="space-y-6">
        <div className="glass-card p-5 space-y-4">
          <h4 className="font-display font-bold text-white text-base">Order Summary</h4>
          
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <img src={event.banner} alt={event.title} className="h-12 w-20 rounded-lg object-cover" />
            <div className="flex-1 truncate">
              <h5 className="font-semibold text-xs text-white truncate">{event.title}</h5>
              <p className="text-[10px] text-gray-400 capitalize">{event.category}</p>
            </div>
          </div>

          {/* Pricing breakdowns */}
          <div className="space-y-2 border-b border-white/5 pb-3 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>{tier.name} Ticket (x{quantity})</span>
              <span className="font-semibold text-white">₹{grossTotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1" title="Used to secure transactions in escrow and manage P2P queues.">Platform Fee (10%) <HelpCircle className="h-3 w-3" /></span>
              <span className="font-semibold text-white">₹{platformFee.toLocaleString()}</span>
            </div>

            {buyInsurance && (
              <div className="flex justify-between text-primary">
                <span>Cancellation Insurance</span>
                <span className="font-semibold">₹{insuranceCost.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-white">All-In Price</span>
            <span className="text-primary font-display font-extrabold text-lg">₹{grandTotal.toLocaleString()}</span>
          </div>

          {/* Escrow assurance note */}
          {tier.price > 0 && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2 text-[10px] text-gray-400 leading-normal">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                <strong>Escrow Shield Active:</strong> Your ticket payment is held in escrow and only released to the host 24 hours after the event successfully concludes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10">
        <Suspense fallback={<div className="text-center py-20 text-xs text-gray-500">Loading checkout parameters...</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
    </div>
  );
}
