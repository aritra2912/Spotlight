'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock,
  MapPin, 
  User as UserIcon, 
  ShieldCheck, 
  Heart, 
  Ticket as TicketIcon, 
  ChevronLeft,
  AlertTriangle,
  Star,
  Film,
  Users,
  Timer,
  CheckCircle2,
  Info,
  Send
} from 'lucide-react';
import { mockDb, Ticket, Review, User, VibeClip, type Event, WaitlistEntry } from '@/lib/mockDb';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid Next.js SSR document reference crashes
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[250px] bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl flex items-center justify-center text-xs text-gray-500">Loading Map View...</div>
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [host, setHost] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [clip, setClip] = useState<VibeClip | null>(null);
  const [now, setNow] = useState<number>(0);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Flag Report Form state
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Waitlist / Resale state
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [userWaitlistEntry, setUserWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [queuePosition, setQueuePosition] = useState<number>(1);

  const loadData = useCallback(() => {
    const ev = mockDb.getEvent(id);
    if (!ev) {
      router.push('/');
      return;
    }
    setEvent(ev);
    
    const h = mockDb.getUser(ev.creatorId);
    if (h) setHost(h);

    const user = mockDb.getActiveUser();
    setCurrentUser(user);

    // Initial check for following/saved
    setIsFollowing(user.followingCreators.includes(ev.creatorId));
    
    const storedWishlist = localStorage.getItem(`wishlist_${user.id}`);
    if (storedWishlist) {
      setIsSaved(JSON.parse(storedWishlist).includes(id));
    }

    // Load reviews
    const revs = mockDb.getReviewsForEvent(id);
    setReviews(revs);

    // Find a teaser video clip
    const allClips = mockDb.getClips();
    const matchedClip = allClips.find(c => c.eventId === id) || allClips.find(c => c.creatorId === ev.creatorId);
    setClip(matchedClip || null);

    // Initial ticket selectors setup
    const initialQuants: Record<string, number> = {};
    ev.ticketTiers.forEach(t => {
      initialQuants[t.id] = 1;
    });
    setTicketQuantities(initialQuants);

    // Load waitlist status
    const wl = JSON.parse(localStorage.getItem('spotlight_waitlists') || '[]');
    setWaitlistEntries(wl);
    const userWl = wl.find((w: WaitlistEntry) => w.eventId === id && w.userId === user.id);
    setUserWaitlistEntry(userWl || null);
    if (userWl && !userWl.holdExpiresAt) {
      setQueuePosition(Math.floor(Math.random() * 3) + 1);
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
      setNow(Date.now());
    }, 0);

    const handleDbUpdate = () => {
      loadData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadData]);

  // Waitlist Hold Countdown Timer
  useEffect(() => {
    const expiresAt = userWaitlistEntry?.holdExpiresAt;
    if (!expiresAt || now === 0) return;

    const interval = setInterval(() => {
      const difference = new Date(expiresAt).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userWaitlistEntry, now]);

  if (!event || !currentUser) return null;

  const totalCap = event.ticketTiers.reduce((sum, t) => sum + t.capacity, 0);
  const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.soldCount, 0);
  const isSoldOut = totalSold >= totalCap;

  const handleFollowToggle = () => {
    const res = mockDb.toggleFollowCreator(event.creatorId);
    setIsFollowing(res.following);
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleWishlistToggle = () => {
    const stored = localStorage.getItem(`wishlist_${currentUser.id}`);
    let wishlist: string[] = stored ? JSON.parse(stored) : [];

    if (wishlist.includes(id)) {
      wishlist = wishlist.filter(item => item !== id);
      setIsSaved(false);
    } else {
      wishlist.push(id);
      setIsSaved(true);
      mockDb.addNotification(
        currentUser.id,
        'Event Saved',
        `"${event.title}" has been added to your saved list.`,
        'event_publish'
      );
    }
    localStorage.setItem(`wishlist_${currentUser.id}`, JSON.stringify(wishlist));
    window.dispatchEvent(new Event('mockdb-update'));
  };

  // Redirect to booking workflow
  const handleCheckoutClick = (tierId: string) => {
    const qty = ticketQuantities[tierId] || 1;
    router.push(`/checkout?eventId=${event.id}&tierId=${tierId}&quantity=${qty}`);
  };

  // Waitlist actions
  const handleJoinWaitlist = () => {
    const res = mockDb.joinWaitlist(event.id);
    if (res.success) {
      loadData();
      window.dispatchEvent(new Event('mockdb-update'));
    } else {
      alert(res.message);
    }
  };

  const handleClaimResale = () => {
    if (!userWaitlistEntry) return;
    const res = mockDb.purchaseResaleTicket(event.id, userWaitlistEntry.id);
    if (res.success) {
      alert(res.message);
      router.push('/my-tickets');
      window.dispatchEvent(new Event('mockdb-update'));
    } else {
      alert(res.message);
    }
  };

  // Review Submissions
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewComment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }

    const res = mockDb.addReview(event.id, rating, reviewComment);
    if (res.success) {
      setReviewSuccess('Review posted successfully! Thank you.');
      setReviewComment('');
      loadData();
      window.dispatchEvent(new Event('mockdb-update'));
    } else {
      setReviewError(res.message);
    }
  };

  // Fraud Circuit Breaker Reporting
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim()) return;

    const res = mockDb.reportEvent(event.id, flagReason);
    if (res.success) {
      setFlagSubmitted(true);
      setFlagReason('');
      // Delay closing modal
      setTimeout(() => {
        setShowFlagModal(false);
        setFlagSubmitted(false);
      }, 3000);
      loadData();
      window.dispatchEvent(new Event('mockdb-update'));
    } else {
      alert(res.message);
    }
  };

  // Check if current user checked-in
  const tickets = JSON.parse(localStorage.getItem('spotlight_tickets') || '[]');
  const hasCheckedIn = tickets.some(
    (t: Ticket) => t.eventId === event.id && t.purchaserId === currentUser.id && t.status === 'checked-in'
  );

  // Review availability validation
  const eventEnd = new Date(event.endDate).getTime();
  const timeDiffHours = now > 0 ? (now - eventEnd) / (1000 * 60 * 60) : 0;
  const isPastEvent = now > 0 ? now > eventEnd : false;
  const reviewWindowOpen = isPastEvent && timeDiffHours <= 72;

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : 'N/A';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10 space-y-8">
        
        {/* Breadcrumbs & Header Actions */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Discover
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={handleWishlistToggle}
              className={`p-2.5 rounded-xl border transition-all ${
                isSaved 
                  ? 'bg-accent/20 border-accent/30 text-accent' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Heart className={`h-4.5 w-4.5 ${isSaved ? 'fill-accent' : ''}`} />
            </button>
            
            {/* Solo Mode Group Chat indicator */}
            {tickets.some((t: Ticket) => t.eventId === event.id && t.purchaserId === currentUser.id && t.status === 'valid') && (
              <Link 
                href={`/solo-mode/${event.id}`}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-tr from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.01]"
              >
                Join Solo Mode Chat
              </Link>
            )}
          </div>
        </div>

        {/* Hero banner */}
        <section className="relative rounded-3xl overflow-hidden aspect-[21/9] border border-white/5 shadow-xl bg-black">
          <img src={event.banner} alt={event.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[9px] font-bold text-primary uppercase tracking-wider inline-block">
                {event.category}
              </span>
              <h2 className="font-display font-extrabold text-2xl md:text-4xl text-white tracking-tight leading-tight">
                {event.title}
              </h2>
            </div>
            
            {/* Status alerts */}
            {event.status === 'cancelled' && (
              <span className="px-4 py-1.5 rounded-xl bg-danger/20 border border-danger/30 text-xs font-bold text-danger">
                EVENT CANCELLED (REFUNDED)
              </span>
            )}
          </div>
        </section>

        {/* Core Layout columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main left details column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description & Timing */}
            <div className="glass-card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-white/5 pb-4">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Date & Time</h5>
                    <p className="text-xs font-semibold text-white">
                      {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Location</h5>
                    <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                      {event.venueId ? 'The Art Loft & Stage' : event.customAddress}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                      {event.venueId ? '12, Park Street, Kolkata' : event.customAddress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-display font-bold text-white text-base">About the Event</h4>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>

              {/* Onboarding Verification check (Loophole #4) */}
              <div className="flex flex-wrap gap-2 pt-2">
                {event.is18Plus && (
                  <span className="px-2 py-0.5 rounded-md bg-danger/10 border border-danger/20 text-[9px] font-bold text-danger">18+ Restricted</span>
                )}
                {host?.isVerified === 'spotlight' && (
                  <span className="px-2 py-0.5 rounded-md bg-success/10 border border-success/20 text-[9px] font-bold text-success flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3" /> Spotlight Badge host
                  </span>
                )}
              </div>
            </div>

            {/* Vibe Check Highlight Teaser Clip */}
            {clip && (
              <div className="glass-card p-6 space-y-4">
                <h4 className="font-display font-bold text-white text-base flex items-center gap-1.5">
                  <Film className="h-4.5 w-4.5 text-primary" /> Vibe Check Teaser
                </h4>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5">
                  {clip.videoUrl.includes('youtube.com') || clip.videoUrl.includes('youtu.be') ? (
                    <iframe 
                      src={clip.videoUrl} 
                      title={clip.caption} 
                      className="w-full h-full"
                      allowFullScreen 
                    />
                  ) : (
                    <video 
                      src={clip.videoUrl} 
                      className="w-full h-full object-cover" 
                      controls 
                      playsInline
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">&quot;{clip.caption}&quot;</p>
              </div>
            )}

            {/* Map Pin Location */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-display font-bold text-white text-base">Interactive Event Map</h4>
              <Map 
                coordinates={event.coordinates} 
                title={event.venueId ? 'The Art Loft & Stage' : 'Event Location'} 
                address={event.venueId ? '12, Park Street, Kolkata' : event.customAddress || ''} 
              />
            </div>

            {/* Reviews & Ratings Section (Phase 3) */}
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-display font-bold text-white text-base flex items-center gap-1">
                  Reviews & Ratings ({reviews.length})
                </h4>
                <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-xs text-yellow-400 font-bold">
                  <Star className="h-3.5 w-3.5 fill-yellow-400" />
                  <span>{averageRating}</span>
                </div>
              </div>

              {/* Review submit portal */}
              {isPastEvent && (
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  {reviewSuccess ? (
                    <div className="text-xs text-success bg-success/10 p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> {reviewSuccess}
                    </div>
                  ) : reviewWindowOpen ? (
                    hasCheckedIn ? (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <h5 className="text-xs font-semibold text-white">Write a Review (Checked-in Guest Only)</h5>
                        
                        {reviewError && <p className="text-xs text-danger">{reviewError}</p>}
                        
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Rating</label>
                          <div className="flex gap-1 text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <Star className={`h-5 w-5 ${rating >= star ? 'fill-yellow-400' : 'text-gray-600'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Share your experience..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full glass-input pr-12 text-xs"
                          />
                          <button
                            type="submit"
                            className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl text-xs text-gray-400 leading-normal">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p><strong>Review restricted:</strong> Post-event reviews are locked to checked-in ticket holders only. If you attended, verify your profile check-in status.</p>
                      </div>
                    )
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl text-xs text-gray-400 leading-normal">
                      <Clock className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                      <p>The review portal opens immediately at event end and closes 72 hours post-event. Outside this window, reviews are disabled.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Feed */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No reviews written yet.</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="text-xs font-semibold text-white">{r.userName}</h6>
                          <p className="text-[9px] text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-0.5 text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${r.rating > i ? 'fill-yellow-400' : 'text-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">&quot;{r.comment}&quot;</p>
                      
                      {r.creatorResponse && (
                        <div className="p-3 bg-primary/5 border-l-2 border-primary rounded-r-xl text-xs space-y-1">
                          <p className="font-semibold text-primary text-[10px] uppercase tracking-wider">Response from Vimoh</p>
                          <p className="text-gray-300 italic">&quot;{r.creatorResponse}&quot;</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right sticky booking column */}
          <div className="space-y-6">
            
            {/* Host profile Card */}
            {host && (
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={host.profilePhoto} alt={host.name} className="h-12 w-12 rounded-xl object-cover border border-white/10" />
                  <div className="flex-1 truncate">
                    <h5 className="font-display font-semibold text-sm text-white flex items-center gap-1">
                      {host.name}
                      {host.isVerified === 'spotlight' && (
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </h5>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="h-3 w-3 text-primary" /> {host.followersCount} followers
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{host.bio}</p>

                {host.id !== currentUser.id && (
                  <button
                    onClick={handleFollowToggle}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isFollowing 
                        ? 'bg-white/5 border-white/10 text-white' 
                        : 'bg-primary border-primary text-white shadow-md shadow-primary/10 hover:bg-primary-hover'
                    }`}
                  >
                    {isFollowing ? 'Following Host' : 'Follow Host'}
                  </button>
                )}
              </div>
            )}

            {/* Ticket Purchase / Waitlist Card */}
            <div className="glass-card p-5 space-y-4">
              <h4 className="font-display font-bold text-white text-base flex items-center gap-1.5">
                <TicketIcon className="h-4.5 w-4.5 text-primary" /> Book Admission
              </h4>

              {event.status === 'cancelled' ? (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger text-center font-bold">
                  Ticketing closed (Event cancelled)
                </div>
              ) : isSoldOut ? (
                /* SOLD OUT STATE: RESALE / WAITLIST WORKFLOW */
                <div className="space-y-3">
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning leading-relaxed flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-bold">Tickets are Sold Out</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Listings depend on spare ticket refunds. Enter waitlist to hold a spot.</p>
                    </div>
                  </div>

                  {userWaitlistEntry ? (
                    /* ALREADY ON WAITLIST */
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Waitlist Reservation</span>
                        <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-semibold">Active</span>
                      </div>

                      {userWaitlistEntry.holdExpiresAt ? (
                        /* CLAIM TICKET TIMED HOLD */
                        <div className="space-y-3">
                          <div className="p-3 bg-success/15 border border-success/20 rounded-xl text-center space-y-1">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Time left to claim:</span>
                            <span className="font-display font-bold text-xl text-success flex items-center justify-center gap-1">
                              <Timer className="h-5 w-5 animate-pulse" /> {timeLeft}
                            </span>
                          </div>

                          <button
                            onClick={handleClaimResale}
                            className="w-full py-2.5 px-4 rounded-xl font-bold bg-success hover:bg-success/90 text-white text-xs shadow-md shadow-success/15 transition-all hover:scale-[1.01]"
                          >
                            Purchase Resale Ticket (₹499)
                          </button>
                        </div>
                      ) : (
                        /* WAITING STAGE */
                        <div className="text-center py-2 space-y-1">
                          <Clock className="h-6 w-6 text-gray-500 mx-auto animate-spin" />
                          <p className="text-xs text-gray-300 font-semibold">Position #{queuePosition} in queue</p>
                          <p className="text-[10px] text-gray-500">You will receive a notification immediately once a ticket is returned.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* JOIN WAITLIST BUTTON */
                    <button
                      onClick={handleJoinWaitlist}
                      className="w-full py-2.5 px-4 rounded-xl font-bold bg-primary hover:bg-primary-hover text-white text-xs shadow-md shadow-primary/10 transition-all hover:scale-[1.01]"
                    >
                      Join Resale Waitlist
                    </button>
                  )}
                </div>
              ) : (
                /* REGULAR TICKETING TIERS */
                <div className="space-y-4">
                  {event.ticketTiers.map(tier => {
                    const remains = tier.capacity - tier.soldCount;
                    const qty = ticketQuantities[tier.id] || 1;
                    
                    return (
                      <div key={tier.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-white text-xs">{tier.name}</h5>
                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{tier.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-display font-bold text-sm text-primary">
                              {tier.price === 0 ? 'FREE' : `₹${tier.price}`}
                            </span>
                            <p className="text-[9px] text-gray-400 mt-0.5">{remains} left</p>
                          </div>
                        </div>

                        {remains > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.03]">
                            {/* Quantity selection (Max 6) */}
                            <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-black/20">
                              <button 
                                onClick={() => setTicketQuantities(prev => ({ ...prev, [tier.id]: Math.max(1, qty - 1) }))}
                                className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold px-1.5 text-white">{qty}</span>
                              <button 
                                onClick={() => setTicketQuantities(prev => ({ ...prev, [tier.id]: Math.min(Math.min(6, remains), qty + 1) }))}
                                className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleCheckoutClick(tier.id)}
                              className="flex-1 py-1.5 px-3 rounded-lg font-semibold bg-primary hover:bg-primary-hover text-white text-[11px] transition-all"
                            >
                              Book Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fraud circuit breaker toggle (Loophole #9) */}
            {hasCheckedIn && (
              <div className="glass-card p-5 space-y-3 bg-danger/5 border border-danger/10">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <h5 className="font-display font-bold text-xs">Flag Event / Safety Alert</h5>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Checked-in attendees can flag organizer fraud or safety issues. Payout locks instantly if flags reach 10% of attendance.
                </p>
                <button
                  onClick={() => setShowFlagModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-danger/30 text-[10px] font-bold text-danger bg-danger/5 hover:bg-danger/10 transition-all text-center"
                >
                  Flag Safety/Fraud Alert
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FLAG FORM MODAL */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card p-6 border border-danger/20 relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-1.5 mb-2">
              <AlertTriangle className="text-danger h-5 w-5" /> Submit Safety/Fraud Flag
            </h4>
            
            {flagSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto animate-bounce" />
                <h5 className="font-semibold text-white text-xs">Flag Logged Securely</h5>
                <p className="text-[10px] text-gray-400 leading-normal">Under platform investigation. Circuit breaker tracking threshold metrics.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Please specify the exact issue. Providing false reports violates compliance policies.
                </p>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. Venue is severely overcrowded, performer did not appear..."
                  className="w-full glass-input text-xs h-24 resize-none"
                  required
                />
                <div className="flex justify-end gap-2 text-xs font-semibold">
                  <button 
                    type="button" 
                    onClick={() => setShowFlagModal(false)}
                    className="py-1.5 px-3 rounded-lg text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="py-1.5 px-4 rounded-lg bg-danger text-white hover:bg-danger/90"
                  >
                    Submit Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
