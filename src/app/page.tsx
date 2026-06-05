'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Heart,
  Filter,
  Clock
} from 'lucide-react';
import { mockDb, User, type Event } from '@/lib/mockDb';
import Header from '@/components/Header';

const CATEGORIES = ['Comedy', 'Music', 'Art', 'Theatre', 'Sports', 'Wellness', 'Food', 'Workshop'];

export default function HomeFeed() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [distanceFilter, setDistanceFilter] = useState<number>(30); // in km
  
  // Saved Events wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const loadFeedData = useCallback(() => {
    const list = mockDb.getEvents();
    setEvents(list);
    const user = mockDb.getActiveUser();
    setCurrentUser(user);
    
    // Load wishlist from localStorage
    const storedWishlist = localStorage.getItem(`wishlist_${user.id}`);
    if (storedWishlist) {
      setWishlist(JSON.parse(storedWishlist));
    } else {
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFeedData();
    }, 0);

    // Listen for database changes (role swaps, user switches)
    const handleDbUpdate = () => {
      loadFeedData();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadFeedData]);

  const handleToggleWishlist = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) return;
    
    let updated: string[];
    if (wishlist.includes(eventId)) {
      updated = wishlist.filter(id => id !== eventId);
    } else {
      updated = [...wishlist, eventId];
    }
    
    setWishlist(updated);
    localStorage.setItem(`wishlist_${currentUser.id}`, JSON.stringify(updated));
    
    // Notify in notification center
    const event = events.find(ev => ev.id === eventId);
    if (event && !wishlist.includes(eventId)) {
      mockDb.addNotification(
        currentUser.id,
        'Event Saved',
        `"${event.title}" has been added to your wishlist.`,
        'event_publish'
      );
      window.dispatchEvent(new Event('mockdb-update'));
    }
  };

  // Cheapest price resolver per event
  const getCheapestPrice = (event: Event) => {
    if (event.ticketTiers.length === 0) return 0;
    return Math.min(...event.ticketTiers.map(t => t.price));
  };

  // Total capacity sold ratio
  const getSoldOutRatio = (event: Event) => {
    const totalCap = event.ticketTiers.reduce((sum, t) => sum + t.capacity, 0);
    const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.soldCount, 0);
    if (totalCap === 0) return 100;
    return Math.round((totalSold / totalCap) * 100);
  };

  // Loophole #10: Ranking Algorithm
  const getFilteredAndRankedEvents = () => {
    let result = [...events];

    // 1. Text Search across Title, Creator, Venue
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.creatorName.toLowerCase().includes(q) ||
        (e.customAddress && e.customAddress.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }

    // 3. Price Filter
    if (priceFilter === 'free') {
      result = result.filter(e => e.ticketTiers.some(t => t.price === 0));
    } else if (priceFilter === 'paid') {
      result = result.filter(e => e.ticketTiers.some(t => t.price > 0));
    }

    // 4. Proximity / Location Filter (Dummy simulation)
    // For demo purposes, we randomly simulate distances between 1km and 50km
    // result = result.filter(...) in a real scenario

    // 5. Ranking Algorithm (Loophole #10 Fix)
    const userInterests = currentUser?.categoryTags || [];
    const locationAccess = true; // Simulated location access

    return result.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Rule A: Match onboarding interests (+10 points)
      if (userInterests.includes(a.category)) scoreA += 10;
      if (userInterests.includes(b.category)) scoreB += 10;

      // Rule B: Proximity (Dummy: Comedy Night and Art Exhibit are flagged as 2km, Workshop as 15km)
      const distA = a.id === 'event_comedy_night' || a.id === 'event_art_exhibit' ? 2 : 15;
      const distB = b.id === 'event_comedy_night' || b.id === 'event_art_exhibit' ? 2 : 15;
      
      if (locationAccess) {
        scoreA += (30 - distA) * 0.5; // Closer events get higher scores
        scoreB += (30 - distB) * 0.5;
      }

      // If scores are equal, sort chronologically (closest date first)
      if (scoreA === scoreB) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }

      return scoreB - scoreA; // Descending score
    });
  };

  const rankedEvents = getFilteredAndRankedEvents();
  const userInterests = currentUser?.categoryTags || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        
        {/* Banner Section */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary/20 via-accent/10 to-transparent p-8 md:p-12 border border-white/5 shadow-2xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Discovery Algorithm Enabled
            </span>
            <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-none">
              Explore Live <br/>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Unfiltered Vibes</span>
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed max-w-md">
              Book direct tickets, split organizing duties, negotiate venue fees, or list spares on the resale waiting pool.
            </p>
          </div>
          {/* Background shapes */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-primary/10 blur-3xl rounded-full translate-x-10 translate-y-10" />
        </section>

        {/* Search & Filter Bar */}
        <section className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, stand-up comics, organizers, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-10 text-sm py-3"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                showFilters 
                  ? 'bg-primary/20 border-primary text-white' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Collapsible filter options */}
          {showFilters && (
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
              {/* Category selector */}
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full glass-input text-xs py-2 bg-background"
                >
                  <option value="All" className="bg-background text-white">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-background text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Price Type */}
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Pricing</label>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['all', 'free', 'paid'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setPriceFilter(type)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg capitalize transition-all ${
                        priceFilter === type ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Distance Radius</label>
                  <span className="text-xs font-semibold text-primary">{distanceFilter} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={distanceFilter}
                  onChange={(e) => setDistanceFilter(Number(e.target.value))}
                  className="w-full accent-primary bg-white/5 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Quick Categories horizontally scrollable */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === 'All' 
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/15' 
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All Events
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-4 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/15' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Discovery Feed Description Alert for loophole demonstration */}
        {userInterests.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-2.5 text-xs text-gray-400 leading-normal">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p>
              <strong>Personalized Feed:</strong> Events categorized as <span className="text-primary font-semibold">{userInterests.join(', ')}</span> and venues within <span className="text-primary font-semibold">10km</span> are ranked first in accordance with your onboarding preference selections.
            </p>
          </div>
        )}

        {/* Events Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Upcoming Matches ({rankedEvents.length})
            </h3>
            {searchQuery || selectedCategory !== 'All' || priceFilter !== 'all' ? (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setPriceFilter('all');
                }}
                className="text-xs text-primary hover:underline"
              >
                Clear Search
              </button>
            ) : null}
          </div>

          {rankedEvents.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <Filter className="h-10 w-10 text-gray-500 mx-auto mb-2" />
              <h4 className="font-semibold text-white text-sm">No Events Found</h4>
              <p className="text-xs text-gray-400 mt-0.5">Try resetting search parameters or changing category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedEvents.map(event => {
                const cheapest = getCheapestPrice(event);
                const soldOutPercent = getSoldOutRatio(event);
                const date = new Date(event.startDate).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                });
                const isSaved = wishlist.includes(event.id);
                
                // Determine relevance label
                const isRecommended = userInterests.includes(event.category);

                return (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="group glass-card flex flex-col h-full overflow-hidden"
                  >
                    {/* Banner Image wrapper */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                      <img 
                        src={event.banner} 
                        alt={event.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Floating badging */}
                      <div className="absolute top-3 left-3 flex gap-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider">
                          {event.category}
                        </span>
                        {isRecommended && (
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> For You
                          </span>
                        )}
                      </div>

                      {/* Floating Save button */}
                      <button
                        onClick={(e) => handleToggleWishlist(event.id, e)}
                        className={`absolute top-3 right-3 p-1.5 rounded-xl backdrop-blur-md border transition-all ${
                          isSaved 
                            ? 'bg-accent/20 border-accent/30 text-accent' 
                            : 'bg-black/40 border-white/10 text-gray-300 hover:text-white hover:bg-black/60'
                        }`}
                      >
                        <Heart className={`h-4.5 w-4.5 ${isSaved ? 'fill-accent' : ''}`} />
                      </button>

                      {/* Floating Price tags */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                        {cheapest === 0 ? 'FREE' : `Starts ₹${cheapest}`}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{date}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-600 mx-1"></span>
                          <span>{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <h4 className="font-display font-bold text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      {/* Capacity bar & Location */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate max-w-[150px]">{event.venueId ? 'Shreya\'s Art Loft' : event.customAddress}</span>
                          </span>
                          <span className="font-semibold">{soldOutPercent === 100 ? 'SOLD OUT' : `${soldOutPercent}% Seats Filled`}</span>
                        </div>
                        
                        {/* Sold out bar */}
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${soldOutPercent === 100 ? 'bg-danger' : soldOutPercent > 80 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${soldOutPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
