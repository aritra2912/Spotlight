'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  ChevronLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Users, 
  Search, 
  Check, 
  QrCode 
} from 'lucide-react';
import { mockDb, Ticket, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';
import QrScanner from '@/components/QrScanner';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function ScannerConsolePage({ params }: PageProps) {
  const router = useRouter();
  const { eventId } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  // Scanner Results
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scannedGuest, setScannedGuest] = useState<Ticket | null>(null);

  // Manual Lookup Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGate, setSelectedGate] = useState('Gate A');

  const loadScannerData = useCallback(() => {
    const ev = mockDb.getEvent(eventId);
    if (!ev) {
      router.push('/creator');
      return;
    }
    setEvent(ev);

    const tkts = mockDb.getTickets().filter(t => t.eventId === eventId);
    setTickets(tkts);
  }, [eventId, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadScannerData();
    }, 0);

    const handleDbUpdate = () => {
      loadScannerData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadScannerData]);

  if (!event) return null;

  const totalSold = tickets.filter(t => t.status !== 'refunded' && t.status !== 'resold').length;
  const checkedInCount = tickets.filter(t => t.status === 'checked-in').length;

  // Scan success trigger
  const handleQrScanSuccess = (decodedQr: string) => {
    // Run ticket scan logic
    const res = mockDb.checkInTicket(decodedQr, selectedGate);
    
    if (res.success && res.ticket) {
      setScanStatus('success');
      setScanMessage(res.message);
      setScannedGuest(res.ticket);
    } else if (!res.success && res.ticket) {
      setScanStatus('warning');
      setScanMessage(res.message);
      setScannedGuest(res.ticket);
    } else {
      setScanStatus('error');
      setScanMessage(res.message);
      setScannedGuest(null);
    }

    // Reload database state
    loadScannerData();
    window.dispatchEvent(new Event('mockdb-update'));

    // Clear alert after 6 seconds
    setTimeout(() => {
      setScanStatus('idle');
      setScanMessage('');
      setScannedGuest(null);
    }, 6000);
  };

  // Manual Check in bypass (Loophole #12 fallback)
  const handleManualCheckIn = (ticketId: string) => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;

    const res = mockDb.checkInTicket(tkt.qrCode, selectedGate);
    alert(res.message);
    
    loadScannerData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Filtered manual check-in list
  const filteredTickets = tickets.filter(tkt => {
    if (tkt.status === 'refunded' || tkt.status === 'resold') return false;
    if (!searchQuery.trim()) return true;
    
    const q = searchQuery.toLowerCase();
    return tkt.purchaserName.toLowerCase().includes(q) || tkt.qrCode.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        
        {/* Navigation back */}
        <div>
          <Link href="/creator" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Creator Dashboard
          </Link>
        </div>

        {/* Head details and counters */}
        <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">QR Check-in Console</span>
            <h3 className="font-display font-extrabold text-white text-lg">{event.title}</h3>
          </div>

          <div className="flex gap-4 items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Guests Checked In</span>
              <span className="font-display font-bold text-white text-sm">{checkedInCount} / {totalSold}</span>
            </div>
          </div>
        </div>

        {/* Core Scanner Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: WEBCAM CAMERA SCANNER */}
          <div className="glass-card p-6 flex flex-col items-center space-y-6">
            <div className="text-center">
              <h4 className="font-display font-bold text-white text-base">QR Scanner Lens</h4>
              <p className="text-[10px] text-gray-400 mt-1">Select entry point and position the ticket QR code in front of the lens.</p>
            </div>

            {/* Entry Gate Label select */}
            <div className="w-full max-w-[320px]">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Scanning Entry Point</label>
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="w-full glass-input text-xs py-2 bg-background"
              >
                <option value="Gate A" className="bg-background text-white">Gate A (General)</option>
                <option value="Gate B" className="bg-background text-white">Gate B (VIP)</option>
                <option value="VIP Entrance" className="bg-background text-white">VIP Entrance</option>
              </select>
            </div>

            {/* Camera Component */}
            <QrScanner onScanSuccess={handleQrScanSuccess} />

            {/* Scan results status box */}
            {scanStatus !== 'idle' && (
              <div className={`w-full max-w-[320px] p-4 rounded-2xl border text-xs leading-relaxed animate-fadeIn ${
                scanStatus === 'success' 
                  ? 'bg-success/10 border-success/30 text-success' 
                  : scanStatus === 'warning' 
                    ? 'bg-warning/10 border-warning/30 text-warning' 
                    : 'bg-danger/10 border-danger/30 text-danger'
              }`}>
                <div className="flex items-start gap-2.5">
                  {scanStatus === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
                  {scanStatus === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0" />}
                  {scanStatus === 'error' && <XCircle className="h-5 w-5 shrink-0" />}
                  
                  <div>
                    <h5 className="font-bold uppercase tracking-wider text-[10px] mb-0.5">
                      {scanStatus === 'success' ? 'Access Granted' : scanStatus === 'warning' ? 'Scan Warning' : 'Access Denied'}
                    </h5>
                    <p className="text-[11px] font-medium">{scanMessage}</p>
                    
                    {scannedGuest && (
                      <div className="mt-2 text-[10px] opacity-80 space-y-0.5">
                        <p>Guest: {scannedGuest.purchaserName}</p>
                        <p>Pass: {scannedGuest.tierName}</p>
                        <p>Ticket ID: {scannedGuest.id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: MANUAL LOOKUP SEARCH */}
          <div className="glass-card p-6 flex flex-col space-y-4 h-[500px] overflow-hidden">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-white text-base">Guestlist Fallback</h4>
              <p className="text-[10px] text-gray-400">Search guests by name or ticket code. Manually mark them checked-in.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search attendee guestlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-10 text-xs py-2"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredTickets.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No matching attendees found.</p>
              ) : (
                filteredTickets.map(tkt => (
                  <div key={tkt.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-semibold text-white">{tkt.purchaserName}</h5>
                      <span className="text-[9px] text-gray-500 uppercase block mt-0.5">{tkt.tierName} • {tkt.id}</span>
                    </div>

                    {tkt.status === 'checked-in' ? (
                      <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                        <Check className="h-3 w-3" /> In ({tkt.gateLabel || 'Scanned'})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleManualCheckIn(tkt.id)}
                        className="py-1 px-2.5 rounded bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30 transition-all shrink-0"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
