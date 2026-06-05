'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Megaphone, 
  CheckCircle,
  Grid
} from 'lucide-react';
import { mockDb, EscrowEntry, User, FlagReport, AdCampaign, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

export default function AdminPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'disputes' | 'users' | 'kpis' | 'announcements'>('disputes');

  // DB Lists
  const [users, setUsers] = useState<User[]>([]);
  const [escrows, setEscrows] = useState<EscrowEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [reports, setReports] = useState<FlagReport[]>([]);

  // Announcement Form State
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  const loadAdminData = () => {
    const user = mockDb.getActiveUser();
    setCurrentUser(user);

    if (user.activeRole !== 'admin') {
      router.push('/');
      return;
    }

    setUsers(mockDb.getUsers());
    setEscrows(mockDb.getEscrows());
    setEvents(mockDb.getEvents());
    
    // Aggregate flag reports from localStorage
    const reps = JSON.parse(localStorage.getItem('spotlight_reports') || '[]');
    setReports(reps);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAdminData();
    }, 0);

    const handleDbUpdate = () => {
      loadAdminData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, []);

  if (!currentUser) return null;

  // KPIs Calculations (North Star Metrics)
  const totalGTV = escrows.reduce((sum, es) => sum + es.totalGross, 0);
  
  // Creator Stickiness: % of creators who host 2+ events
  const creators = users.filter(u => u.roles.includes('creator'));
  const activeCreatorsWithMultipleEvents = creators.filter(c => {
    const count = events.filter(e => e.creatorId === c.id).length;
    return count >= 2;
  }).length;
  const creatorStickiness = creators.length > 0 
    ? Math.round((activeCreatorsWithMultipleEvents / creators.length) * 100) 
    : 0;

  // Ad Studio Penetration: % of events with a campaign created
  const campaigns: AdCampaign[] = JSON.parse(localStorage.getItem('spotlight_campaigns') || '[]');
  const eventsWithCampaigns = events.filter(e => campaigns.some((c) => c.eventId === e.id)).length;
  const adPenetration = events.length > 0 
    ? Math.round((eventsWithCampaigns / events.length) * 100) 
    : 0;

  // Dispute ratio: % of payouts frozen
  const frozenEscrows = escrows.filter(es => es.status === 'frozen');
  const disputeRatio = escrows.length > 0 
    ? (frozenEscrows.length / escrows.length) * 100 
    : 0;

  // Dispute Override Actions
  const handleResolveDispute = (eventId: string, release: boolean) => {
    mockDb.adminOverridePayout(eventId, release);
    loadAdminData();
    window.dispatchEvent(new Event('mockdb-update'));
    alert(release ? 'Dispute Resolved: Escrow released to creator.' : 'Dispute Resolved: Escrow withheld, attendees refunded.');
  };

  // User Verification Actions
  const handleVerifyUser = (userId: string) => {
    const target = mockDb.getUser(userId);
    if (!target) return;

    // Toggle verification tier
    const nextVerify = target.isVerified === 'unverified' ? 'verified' : target.isVerified === 'verified' ? 'spotlight' : 'unverified';
    target.isVerified = nextVerify;
    mockDb.updateUser(target);
    loadAdminData();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Broadcast simulated global announcements
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    // Broadcast to ALL users
    users.forEach(u => {
      mockDb.addNotification(
        u.id,
        'Global Platform Announcement',
        announcementText,
        'event_publish'
      );
    });

    setAnnouncementSuccess(true);
    setAnnouncementText('');
    setTimeout(() => setAnnouncementSuccess(false), 3000);
    window.dispatchEvent(new Event('mockdb-update'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        
        {/* Page Head */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Platform Admin HQ</h2>
              <p className="text-xs text-gray-400 mt-0.5">Dispute Overrides • User Verifications • KPI Analytics</p>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics (North Star Metrics) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Gross GTV</span>
              <h4 className="font-display font-extrabold text-white text-base">₹{totalGTV.toLocaleString()}</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Creator Stickiness</span>
              <h4 className="font-display font-extrabold text-white text-base">{creatorStickiness}% (Target &gt;40%)</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Ad Studio Usage</span>
              <h4 className="font-display font-extrabold text-white text-base">{adPenetration}% (Target &gt;15%)</h4>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${disputeRatio > 0 ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Dispute Ratio</span>
              <h4 className="font-display font-extrabold text-white text-base">{disputeRatio.toFixed(2)}% (Target &lt;0.5%)</h4>
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="border-b border-white/5 flex gap-6 text-sm font-semibold">
          {([
            { id: 'disputes', label: `Dispute Queue (${frozenEscrows.length})` },
            { id: 'users', label: 'User Directory' },
            { id: 'announcements', label: 'Broadcast Announcements' }
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

        {/* Content Panels */}
        
        {/* TAB 1: DISPUTE RESOLUTION QUEUE */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <div className="p-4 bg-danger/5 border border-danger/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-400">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
              <p>
                <strong>Escrow Dispute Queue:</strong> Displays payouts frozen by the Fraud Circuit Breaker (when safety flags from checked-in attendees reach the 10% threshold). Review the safety logs below and override escrow controls: either disburse the splits or withhold payouts and fully refund attendees.
              </p>
            </div>

            <div className="space-y-4">
              {frozenEscrows.length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <CheckCircle className="h-10 w-10 text-success mx-auto mb-2" />
                  <p className="text-xs text-gray-400">All disputes resolved. Queue is clear!</p>
                </div>
              ) : (
                frozenEscrows.map(esc => {
                  const eventReports = reports.filter(r => r.eventId === esc.eventId);
                  
                  return (
                    <div key={esc.eventId} className="glass-card p-6 space-y-4 border border-danger/25">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-danger/20 text-danger text-[9px] font-bold uppercase tracking-wider inline-block">
                            Payout Frozen
                          </span>
                          <h4 className="font-semibold text-white text-base leading-snug mt-1.5">{esc.eventTitle}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">Creator Payout Share Amount: ₹{esc.netRevenue.toLocaleString()}</p>
                        </div>

                        {/* Dispute stats */}
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Security flags</span>
                          <span className="font-display font-bold text-danger text-sm">{eventReports.length} reports</span>
                        </div>
                      </div>

                      {/* Dispute Reports reasons list */}
                      <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                        <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block">Report details filed:</span>
                        {eventReports.map(rep => (
                          <div key={rep.id} className="text-xs text-gray-300 border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-500 font-semibold">{rep.reporterId}</span>: &quot;{rep.reason}&quot;
                          </div>
                        ))}
                      </div>

                      {/* Override Trigger buttons */}
                      <div className="flex justify-end gap-2 text-xs font-semibold pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleResolveDispute(esc.eventId, false)}
                          className="py-1.5 px-3 rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10"
                        >
                          Withhold Payout & Refund Guests
                        </button>
                        <button
                          onClick={() => handleResolveDispute(esc.eventId, true)}
                          className="py-1.5 px-4 rounded-lg bg-success text-white hover:bg-success/90"
                        >
                          Release Split Payouts
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & VERIFICATION */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-400">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <p>
                <strong>User Directory:</strong> View and manage user accounts. Verification upgrades allow creators to transition from unverified hosting (free events only) $\rightarrow$ phone/ID verified (unlocks paid events) $\rightarrow$ Spotlight Badge (awarded after first successful paid event concludes).
              </p>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 uppercase tracking-wider font-semibold text-[9px]">
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Active Role</th>
                      <th className="p-4">Verification State</th>
                      <th className="p-4 text-right">Wallet Balance</th>
                      <th className="p-4 text-center">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.01]">
                        <td className="p-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{u.email}</div>
                        </td>
                        <td className="p-4 capitalize">{u.activeRole}</td>
                        <td className="p-4">
                          {u.isVerified === 'spotlight' ? (
                            <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">Spotlight Badge</span>
                          ) : u.isVerified === 'verified' ? (
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">Phone & ID Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-gray-400 text-[10px] font-bold">Unverified</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-400">₹{u.walletBalance.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleVerifyUser(u.id)}
                            className="py-1 px-3 rounded bg-primary/20 text-primary hover:bg-primary/30 font-bold text-[10px] transition-colors"
                          >
                            Cycle Tier Verification
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BROADCAST ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="glass-card p-6 space-y-6 max-w-lg mx-auto">
            <h3 className="font-display font-bold text-white text-lg border-b border-white/5 pb-3 flex items-center gap-1.5">
              <Megaphone className="h-5 w-5 text-primary" /> Broadcast Platform Announcement
            </h3>

            {announcementSuccess && (
              <div className="p-3 bg-success/15 border border-success/20 rounded-xl text-success text-xs font-semibold">
                Announcement broadcast successfully to all user accounts!
              </div>
            )}

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
              <p className="text-xs text-gray-400 leading-normal">
                Enter announcement details (e.g. platform maintenance alerts, payouts processing details). This logs mock push messages immediately.
              </p>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Write broadcast message details..."
                className="w-full glass-input text-xs h-24 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/15 transition-all hover:scale-[1.01]"
              >
                Broadcast Announcement
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
