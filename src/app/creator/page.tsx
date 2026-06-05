'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sliders, 
  Plus, 
  Calendar, 
  MapPin, 
  Ticket as TicketIcon, 
  DollarSign, 
  Sparkles, 
  Users, 
  FileSpreadsheet,
  Trash2,
  Edit2,
  Copy,
  AlertTriangle,
  CheckCircle,
  HelpCircle, 
  Video, 
  Inbox, 
  Info,
  UserPlus
} from 'lucide-react';
import { mockDb, Ticket, EscrowEntry, User, VibeClip, TicketTier, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

const CATEGORIES = ['Comedy', 'Music', 'Art', 'Theatre', 'Sports', 'Wellness', 'Food', 'Workshop'];

export default function CreatorDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'events' | 'escrow' | 'builder' | 'bookings' | 'clips'>('events');
  const [eventFilter, setEventFilter] = useState<'draft' | 'published' | 'past'>('published');
  
  // DB Lists
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [escrows, setEscrows] = useState<EscrowEntry[]>([]);
  const [clips, setClips] = useState<VibeClip[]>([]);
  const [venues, setVenues] = useState<User[]>([]);

  // Event Builder Form State
  const [isEditing, setIsEditing] = useState<string | null>(null); // Event ID if editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800');
  const [category, setCategory] = useState('Comedy');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [venueId, setVenueId] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [is18Plus, setIs18Plus] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'half' | 'none'>('full');
  const [refundCutoff, setRefundCutoff] = useState(3);
  const [tiers, setTiers] = useState<TicketTier[]>([
    { id: 'tier_1', name: 'General Admission', price: 499, capacity: 100, soldCount: 0, description: 'Standard entry pass' }
  ]);
  const [now, setNow] = useState<number>(0);

  // AI Description Modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVariants, setAiVariants] = useState<string[]>([]);

  // Split management state
  const [selectedEventForSplit, setSelectedEventForSplit] = useState<Event | null>(null);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabShare, setCollabShare] = useState(10);
  const [splitError, setSplitError] = useState('');

  const loadCreatorData = () => {
    const user = mockDb.getActiveUser();
    setCurrentUser(user);
    
    if (user.activeRole !== 'creator') {
      router.push('/');
      return;
    }

    const allEvents = mockDb.getEvents().filter(e => e.creatorId === user.id);
    setEvents(allEvents);

    const allTickets = mockDb.getTickets();
    setTickets(allTickets);

    const allEscrows = mockDb.getEscrows().filter(e => e.creatorId === user.id);
    setEscrows(allEscrows);

    const pendingClips = mockDb.getPendingClips(user.id);
    setClips(pendingClips);

    const allUsers = mockDb.getUsers();
    setVenues(allUsers.filter(u => u.roles.includes('venue')));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCreatorData();
      setNow(Date.now());
    }, 0);
    
    const handleDbUpdate = () => {
      loadCreatorData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, []);

  // Compute stats
  const creatorEventIds = events.map(e => e.id);
  const creatorTickets = tickets.filter(t => creatorEventIds.includes(t.eventId) && t.status !== 'refunded' && t.status !== 'resold');
  
  const totalTicketsSold = creatorTickets.length;
  const totalGrossRevenue = creatorTickets.reduce((sum, t) => sum + t.purchasePrice, 0);
  const checkedInCount = creatorTickets.filter(t => t.status === 'checked-in').length;
  const attendanceRate = totalTicketsSold > 0 ? Math.round((checkedInCount / totalTicketsSold) * 100) : 0;

  // Filter events list
  const filteredEvents = events.filter(e => {
    const isPast = now > 0 ? new Date(e.endDate).getTime() < now : false;
    if (eventFilter === 'draft') return e.status === 'draft';
    if (eventFilter === 'published') return e.status === 'published' && !isPast;
    return isPast && e.status === 'published';
  });

  // Export Attendees CSV (Phase 4)
  const handleExportCSV = (event: Event) => {
    const eventTkts = tickets.filter(t => t.eventId === event.id && (t.status === 'valid' || t.status === 'checked-in'));
    if (eventTkts.length === 0) {
      alert('No tickets sold for this event yet.');
      return;
    }

    // DPDP-compliant CSV header and rows
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Ticket ID,Name,Email,Checked In,Check-In Time,Insurance Bought\n';
    
    eventTkts.forEach(t => {
      const isChecked = t.status === 'checked-in' ? 'YES' : 'NO';
      const scanTime = t.checkInTime ? new Date(t.checkInTime).toLocaleString() : 'N/A';
      const ins = t.insuranceBought ? 'YES' : 'NO';
      
      // Sanitizing fields
      const nameEscaped = `"${t.purchaserName.replace(/"/g, '""')}"`;
      const emailEscaped = `"${t.purchaserId === 'user_arjun' ? 'arjun@gmail.com' : 'simulated_attendee@gmail.com'}"`; // Masking for demo privacy unless checked
      
      csvContent += `${t.id},${nameEscaped},${emailEscaped},${isChecked},${scanTime},${ins}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_${event.title.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add / Remove Ticket Tier inside builder
  const handleAddTier = () => {
    if (tiers.length >= 5) return;
    setTiers(prev => [
      ...prev,
      { id: 'tier_' + Math.random().toString(36).substring(2, 9), name: 'New Tier', price: 499, capacity: 50, soldCount: 0, description: '' }
    ]);
  };

  const handleRemoveTier = (id: string) => {
    if (tiers.length <= 1) return;
    setTiers(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTierField = (id: string, field: keyof TicketTier, val: string | number) => {
    setTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // AI copywriting modal actions
  const handleGenerateAiDescription = async () => {
    if (!title) {
      alert('Please enter an event title first.');
      return;
    }
    setAiLoading(true);
    setAiVariants([]);

    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success) {
        setAiVariants(data.variants);
      } else {
        alert('Failed to generate description: ' + data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Network error generating description.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectAiVariant = (variantText: string) => {
    setDescription(variantText);
    setShowAiModal(false);
    setAiPrompt('');
  };

  // Save Event
  const handleSaveEvent = (publish: boolean) => {
    if (!title || !startDate || !endDate) {
      alert('Title, Start Date, and End Date are required.');
      return;
    }

    const eventData = {
      title,
      description,
      banner,
      category,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isMultiDay,
      venueId: venueId || undefined,
      customAddress: venueId ? undefined : customAddress,
      coordinates: [22.5726, 88.3639] as [number, number], // Kolkata default coords
      ticketTiers: tiers,
      refundPolicy: { type: refundType, daysCutoff: refundCutoff },
      is18Plus,
      status: (publish ? 'published' : 'draft') as 'published' | 'draft'
    };

    if (isEditing) {
      const original = mockDb.getEvent(isEditing);
      if (original) {
        const updated = {
          ...original,
          ...eventData,
          status: publish ? 'published' : original.status // Don't override status back to draft if already published
        };
        mockDb.updateEvent(updated);
      }
    } else {
      mockDb.createEvent(eventData);
    }

    // Trigger Notification for followers
    if (publish && !isEditing) {
      // Notify Arjun (follows Vimoh)
      mockDb.addNotification(
        'user_arjun',
        'New Event Published!',
        `Vimoh the Creator has published a new event: "${title}". Book early!`,
        'event_publish'
      );
    }

    // Reset Builder Form
    handleResetBuilder();
    setActiveTab('events');
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleResetBuilder = () => {
    setIsEditing(null);
    setTitle('');
    setDescription('');
    setCategory('Comedy');
    setStartDate('');
    setEndDate('');
    setIsMultiDay(false);
    setVenueId('');
    setCustomAddress('');
    setIs18Plus(false);
    setRefundType('full');
    setRefundCutoff(3);
    setTiers([{ id: 'tier_1', name: 'General Admission', price: 499, capacity: 100, soldCount: 0, description: 'Standard entry pass' }]);
  };

  const handleEditClick = (ev: Event) => {
    setIsEditing(ev.id);
    setTitle(ev.title);
    setDescription(ev.description);
    setBanner(ev.banner);
    setCategory(ev.category);
    // Format dates to local datetime input string
    const formatDt = (iso: string) => {
      const d = new Date(iso);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setStartDate(formatDt(ev.startDate));
    setEndDate(formatDt(ev.endDate));
    setIsMultiDay(ev.isMultiDay);
    setVenueId(ev.venueId || '');
    setCustomAddress(ev.customAddress || '');
    setIs18Plus(ev.is18Plus);
    setRefundType(ev.refundPolicy.type);
    setRefundCutoff(ev.refundPolicy.daysCutoff);
    setTiers(ev.ticketTiers);
    setActiveTab('builder');
  };

  // Duplicate Event Template (Phase 4)
  const handleDuplicateClick = (ev: Event) => {
    const duplicated: Omit<Event, 'id' | 'creatorId' | 'creatorName' | 'priceLocked' | 'collaborators'> = {
      title: `${ev.title} (Duplicate)`,
      description: ev.description,
      banner: ev.banner,
      category: ev.category,
      startDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days in future
      endDate: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
      isMultiDay: ev.isMultiDay,
      venueId: ev.venueId,
      customAddress: ev.customAddress,
      coordinates: ev.coordinates,
      ticketTiers: ev.ticketTiers.map(t => ({ ...t, soldCount: 0 })), // Reset sold counts
      refundPolicy: ev.refundPolicy,
      is18Plus: ev.is18Plus,
      status: 'draft'
    };
    
    mockDb.createEvent(duplicated);
    window.dispatchEvent(new Event('mockdb-update'));
    alert('Event template duplicated as a Draft!');
  };

  // Split calculations (Loophole #7, #12)
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    setSplitError('');
    if (!selectedEventForSplit || !collabEmail) return;

    const res = mockDb.inviteCollaborator(selectedEventForSplit.id, collabEmail, collabShare);
    if (res.success) {
      setCollabEmail('');
      loadCreatorData();
      // Reload splits modal event
      const updatedEv = mockDb.getEvent(selectedEventForSplit.id);
      if (updatedEv) setSelectedEventForSplit(updatedEv);
      window.dispatchEvent(new Event('mockdb-update'));
    } else {
      setSplitError(res.message);
    }
  };

  const handleFastForwardEscrow = (eventId: string) => {
    // Demo tool: trigger release immediately instead of end time + 24 hours
    const esc = escrows.find(es => es.eventId === eventId);
    if (esc) {
      mockDb.adminOverridePayout(eventId, true);
      loadCreatorData();
      window.dispatchEvent(new Event('mockdb-update'));
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        
        {/* Page title & Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sliders className="h-6 w-6 text-primary" />
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Creator Studio</h2>
          </div>
          <button
            onClick={() => { handleResetBuilder(); setActiveTab('builder'); }}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white text-xs shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" /> Create New Event
          </button>
        </div>

        {/* Dashboard Metrics Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Gross Sales</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">₹{totalGrossRevenue.toLocaleString()}</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <TicketIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Passes Sold</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">{totalTicketsSold} tickets</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Attendance Rate</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">{attendanceRate}% ({checkedInCount} checkins)</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Wallet Balance</p>
              <h4 className="font-display font-extrabold text-white text-lg leading-tight">₹{currentUser.walletBalance.toLocaleString()}</h4>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="border-b border-white/5 flex gap-6 text-sm font-semibold">
          {([
            { id: 'events', label: 'My Events' },
            { id: 'escrow', label: 'Escrow Ledger' },
            { id: 'builder', label: isEditing ? 'Edit Builder' : 'Event Builder' },
            { id: 'bookings', label: 'Venue Bookings' },
            { id: 'clips', label: `Moderation (${clips.length})` }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 relative transition-colors ${
                activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        
        {/* TAB 1: MY EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5 max-w-sm">
              {([
                { id: 'published', label: 'Live Events' },
                { id: 'draft', label: 'Drafts' },
                { id: 'past', label: 'Past Events' }
              ] as const).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setEventFilter(sub.id)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg capitalize transition-all ${
                    eventFilter === sub.id ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <Inbox className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                <h4 className="font-semibold text-white text-sm">No events found</h4>
                <p className="text-xs text-gray-400">Use the &quot;Create Event&quot; button to write a template pass.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(ev => {
                  const soldCount = ev.ticketTiers.reduce((sum, t) => sum + t.soldCount, 0);
                  const totalCapacity = ev.ticketTiers.reduce((sum, t) => sum + t.capacity, 0);
                  
                  return (
                    <div key={ev.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={ev.banner} alt={ev.title} className="h-14 w-24 rounded-lg object-cover" />
                        <div>
                          <h4 className="font-semibold text-white text-sm">{ev.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(ev.startDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.venueId ? 'Shreya\'s Loft' : 'Custom'}</span>
                            <span>•</span>
                            <span className="font-semibold text-primary">{soldCount}/{totalCapacity} tickets</span>
                          </div>
                        </div>
                      </div>

                      {/* Event actions panel */}
                      <div className="flex flex-wrap gap-2 text-xs font-semibold justify-end">
                        {/* QR checkin portal */}
                        {ev.status === 'published' && (
                          <Link
                            href={`/creator/scanner/${ev.id}`}
                            className="py-1.5 px-3 rounded-lg bg-primary text-white hover:bg-primary-hover text-[11px] transition-all text-center"
                          >
                            QR Check-in Console
                          </Link>
                        )}

                        <button
                          onClick={() => handleExportCSV(ev)}
                          className="py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-[11px] flex items-center gap-1 transition-all"
                          title="Export CSV (CRM data)"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                        </button>

                        <button
                          onClick={() => setSelectedEventForSplit(ev)}
                          className="py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-[11px] flex items-center gap-1 transition-all"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Splits ({ev.collaborators.length})
                        </button>

                        <button
                          onClick={() => handleDuplicateClick(ev)}
                          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                          title="Duplicate Event Template"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleEditClick(ev)}
                          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                          title="Edit Event"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {ev.status === 'published' && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to cancel "${ev.title}"? All ticket buyers will be fully refunded instantly.`)) {
                                mockDb.cancelEvent(ev.id);
                                loadCreatorData();
                                window.dispatchEvent(new Event('mockdb-update'));
                              }
                            }}
                            className="p-2 rounded-lg border border-danger/30 bg-danger/5 text-danger hover:bg-danger/10"
                            title="Cancel Event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ESCROW LEDGER */}
        {activeTab === 'escrow' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-400">
              <HelpCircle className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>Escrow State Machine:</strong> Organizers can view escrow balances. Funds are locked in `Held` status until 24h after the event concludes (`Released` trigger). If attendee safety flags breach the 10% circuit breaker threshold, funds lock into `Frozen` and platform admins review.
              </p>
            </div>

            <div className="space-y-3">
              {escrows.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">No funds currently registered in escrow.</p>
              ) : (
                escrows.map(esc => {
                  const remainsHr = now > 0 ? Math.max(0, Math.round((new Date(esc.releaseTime).getTime() - now) / (1000 * 60 * 60))) : 0;
                  
                  return (
                    <div key={esc.eventId} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-sm">{esc.eventTitle}</h4>
                        <div className="flex flex-wrap gap-2 items-center text-[10px] text-gray-500">
                          <span>Gross: ₹{esc.totalGross.toLocaleString()}</span>
                          <span>•</span>
                          <span>Fee: ₹{esc.platformFee.toLocaleString()} (10%)</span>
                          <span>•</span>
                          <span>Net Payout: ₹{esc.netRevenue.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Escrow Status badges */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Escrow Status</span>
                          {esc.status === 'frozen' ? (
                            <span className="px-2 py-0.5 rounded bg-danger/20 text-danger text-[10px] font-bold flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> Payout Frozen
                            </span>
                          ) : esc.status === 'released' ? (
                            <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">Funds Disbursed</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-bold">Locked ({remainsHr}h remaining)</span>
                          )}
                        </div>

                        {/* Fast forward timer button for demo */}
                        {esc.status === 'pending' && (
                          <button
                            onClick={() => handleFastForwardEscrow(esc.eventId)}
                            className="py-1 px-2.5 rounded bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30 transition-colors"
                            title="Accelerate timer and release splits"
                          >
                            Demo: Release Splits
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EVENT BUILDER */}
        {activeTab === 'builder' && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="font-display font-bold text-white text-lg border-b border-white/5 pb-3">
              {isEditing ? `Modify Event Template: "${title}"` : 'Construct New Event Ticket'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Form details */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Weekly Stand-up Jam (Session 2)"
                    className="w-full glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Event Description</label>
                    <button
                      type="button"
                      onClick={() => setShowAiModal(true)}
                      className="flex items-center gap-1 text-[10px] text-primary font-bold hover:underline"
                    >
                      <Sparkles className="h-3 w-3" /> AI Copy Generator (GPT-4)
                    </button>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about ticket inclusions, schedules, and performers..."
                    className="w-full glass-input text-xs h-28 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full glass-input text-xs bg-background"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-background text-white">{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Venue Picker</label>
                    <select
                      value={venueId}
                      onChange={(e) => setVenueId(e.target.value)}
                      className="w-full glass-input text-xs bg-background"
                    >
                      <option value="" className="bg-background text-white">Enter Custom Address</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id} className="bg-background text-white">{v.venueName || v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!venueId && (
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Custom Address Location</label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="Enter street name, coordinates, or digital hubs..."
                      className="w-full glass-input text-xs"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full glass-input text-xs bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full glass-input text-xs bg-background"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Ticket Tiers & Policies */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ticket Admission Tiers (Max 5)</label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    + Add Tier
                  </button>
                </div>

                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const priceLocked = isEditing ? mockDb.getEvent(isEditing)?.priceLocked : false;
                    const soldCount = tier.soldCount || 0;
                    
                    return (
                      <div key={tier.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 relative">
                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(tier.id)}
                            className="absolute right-2 top-2 text-gray-500 hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => handleUpdateTierField(tier.id, 'name', e.target.value)}
                              placeholder="Tier Name"
                              className="w-full glass-input text-xs py-1"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={tier.price}
                              disabled={priceLocked && soldCount > 0} // Loophole #5: Lock price once first ticket sells
                              onChange={(e) => handleUpdateTierField(tier.id, 'price', Number(e.target.value))}
                              placeholder="Price"
                              className="w-full glass-input text-xs py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={tier.description}
                              onChange={(e) => handleUpdateTierField(tier.id, 'description', e.target.value)}
                              placeholder="Short tier description"
                              className="w-full glass-input text-xs py-1"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              value={tier.capacity}
                              onChange={(e) => handleUpdateTierField(tier.id, 'capacity', Number(e.target.value))}
                              placeholder="Capacity"
                              className="w-full glass-input text-xs py-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Refund Rules Selector */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Refund Option</label>
                    <select
                      value={refundType}
                      onChange={(e) => setRefundType(e.target.value as 'full' | 'half' | 'none')}
                      className="w-full glass-input text-xs bg-background"
                    >
                      <option value="full" className="bg-background text-white">100% Refundable</option>
                      <option value="half" className="bg-background text-white">50% Refundable</option>
                      <option value="none" className="bg-background text-white">Non-Refundable</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Refund Days Cutoff</label>
                    <input
                      type="number"
                      value={refundCutoff}
                      onChange={(e) => setRefundCutoff(Number(e.target.value))}
                      className="w-full glass-input text-xs"
                      placeholder="e.g. 3 days before"
                    />
                  </div>
                </div>

                <div className="flex gap-4 items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-gray-400">18+ Age Restriction Required?</span>
                  <button
                    onClick={() => setIs18Plus(!is18Plus)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${is18Plus ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${is18Plus ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

            </div>

            {/* Builder Action Toolbar */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={handleResetBuilder}
                className="py-2.5 px-5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-xs font-semibold"
              >
                Reset Builder
              </button>
              <button
                onClick={() => handleSaveEvent(false)}
                className="py-2.5 px-5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSaveEvent(true)}
                className="py-2.5 px-6 rounded-xl bg-success hover:bg-success/90 text-white text-xs font-bold shadow-md shadow-success/15"
              >
                {isEditing ? 'Save changes & Publish' : 'Publish Ticket Pass'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: VENUE BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-400">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>Venue Bookings:</strong> Select a venue owner from the dropdown in the Event Builder to propose a booking. Once accepted, venue splits are locked, dates blocked, and coordinates map pins are automatically imported into the discovery cards.
              </p>
            </div>

            <div className="space-y-3">
              {events.filter(e => e.venueId).map(ev => {
                const booking = mockDb.getBookingForEvent(ev.id);
                if (!booking) return null;
                
                return (
                  <div key={ev.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{ev.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Proposed Venue Split: {booking.proposedSplit}%</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Booking Status</span>
                      {booking.status === 'accepted' ? (
                        <span className="px-2.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">Booking Confirmed</span>
                      ) : booking.status === 'declined' ? (
                        <span className="px-2.5 py-0.5 rounded bg-danger/20 text-danger text-[10px] font-bold">Booking Declined</span>
                      ) : booking.status === 'countered' ? (
                        <span className="px-2.5 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-bold">Counter Split Proposed ({booking.proposedSplit}%)</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-white/10 text-gray-400 text-[10px] font-bold">Pending Venue Response</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: VIDEO MODERATION */}
        {activeTab === 'clips' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-400">
              <Video className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>Vibe Check Moderation:</strong> Review post-event highlights submitted by attendees. Approve them to push them live to the vertical social feed under your creator profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clips.length === 0 ? (
                <div className="col-span-2 text-center py-12 glass-card">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No pending clips awaiting moderation. All caught up!</p>
                </div>
              ) : (
                clips.map(clipItem => (
                  <div key={clipItem.id} className="glass-card p-4 space-y-3 flex flex-col justify-between">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/5">
                      <iframe src={clipItem.videoUrl} title={clipItem.caption} className="w-full h-full" allowFullScreen />
                    </div>
                    <p className="text-xs text-gray-300 leading-normal italic">&quot;{clipItem.caption}&quot;</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          mockDb.deleteClip(clipItem.id);
                          loadCreatorData();
                          window.dispatchEvent(new Event('mockdb-update'));
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 text-xs font-bold text-center"
                      >
                        Decline Clip
                      </button>
                      <button
                        onClick={() => {
                          mockDb.approveClip(clipItem.id);
                          loadCreatorData();
                          window.dispatchEvent(new Event('mockdb-update'));
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-success text-white hover:bg-success/90 text-xs font-bold text-center"
                      >
                        Approve & Post
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* AI COPYWRITING WIZARD MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 border border-white/10 relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-1.5 mb-2">
              <Sparkles className="text-primary h-5 w-5 animate-pulse" /> AI Magic Description (OpenAI)
            </h4>
            <p className="text-xs text-gray-400 leading-normal mb-4">
              Enter promotional contexts (e.g. &quot;satirical comedy&quot;, &quot;acoustic guitar rooftops&quot;, &quot;discount codes&quot;) and let GPT write optimized descriptions.
            </p>

            <div className="space-y-4">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Satirical stand-up comedy exploring daily Indian traffic jams, early bird discount codes, 18+ strict."
                className="w-full glass-input text-xs h-20 resize-none"
              />

              <button
                onClick={handleGenerateAiDescription}
                disabled={aiLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {aiLoading ? 'Drafting options...' : 'Generate 3 copywriting variants'}
              </button>

              {aiVariants.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Click a variant to select:</label>
                  {aiVariants.map((varText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAiVariant(varText)}
                      className="w-full p-3 bg-white/[0.02] border border-white/5 rounded-xl text-left text-xs text-gray-300 hover:text-white hover:border-primary/30 transition-all leading-normal"
                    >
                      {varText}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => { setShowAiModal(false); setAiPrompt(''); setAiVariants([]); }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVENUE SPLITS DETAIL MODAL */}
      {selectedEventForSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md glass-card p-6 border border-white/10 relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-1.5 mb-2">
              <Users className="text-primary h-5 w-5" /> Manage Revenue Splits
            </h4>
            <p className="text-xs text-gray-400 leading-normal mb-3">
              Configure co-organizer and collaborator splits for <strong>{selectedEventForSplit.title}</strong>. Remaining percentage goes to Creator.
            </p>

            {splitError && (
              <div className="mb-4 p-2 bg-danger/10 border border-danger/25 text-danger rounded-xl text-xs">
                {splitError}
              </div>
            )}

            <div className="space-y-4">
              {/* Add split form */}
              {!selectedEventForSplit.priceLocked ? (
                <form onSubmit={handleAddCollaborator} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Collaborator Email</label>
                    <input
                      type="email"
                      value={collabEmail}
                      onChange={(e) => setCollabEmail(e.target.value)}
                      placeholder="collab@spotlight.app"
                      className="w-full glass-input text-xs py-1.5"
                      required
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Split %</label>
                    <input
                      type="number"
                      value={collabShare}
                      onChange={(e) => setCollabShare(Number(e.target.value))}
                      className="w-full glass-input text-xs py-1.5"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover shrink-0"
                  >
                    Invite
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning leading-relaxed flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p><strong>Splits Locked:</strong> Splitting parameters are locked once the first ticket for the event is booked.</p>
                </div>
              )}

              {/* Splits List */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <h5 className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Active splits</h5>
                {selectedEventForSplit.collaborators.length === 0 ? (
                  <p className="text-[11px] text-gray-500 text-center py-2">No collaborators invited yet.</p>
                ) : (
                  selectedEventForSplit.collaborators.map((col, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-white/[0.01] rounded-lg">
                      <div>
                        <span className="font-semibold text-white">{col.email}</span>
                        <span className="text-[9px] text-gray-500 block">Status: {col.status.toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-primary">{col.sharePercent}%</span>
                    </div>
                  ))
                )}

                <div className="flex justify-between items-center border-t border-white/5 pt-2 text-xs font-bold">
                  <span className="text-gray-400">Total splits allocated:</span>
                  <span className="text-white">{selectedEventForSplit.collaborators.reduce((s, c) => s + c.sharePercent, 0)}%</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventForSplit(null)}
                  className="py-1.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                >
                  Close Splits Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
