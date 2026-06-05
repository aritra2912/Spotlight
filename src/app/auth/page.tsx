'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  ChevronRight, 
  Compass, 
  Building,
  Heart,
  Check
} from 'lucide-react';
import { mockDb, UserRole } from '@/lib/mockDb';
import Header from '@/components/Header';

const INTERESTS = ['Comedy', 'Music', 'Art', 'Theatre', 'Sports', 'Wellness', 'Food', 'Workshop'];
const AMENITIES = ['Sound System', 'Stage Lights', 'A/C', 'Bar Counter', 'Backstage Room', 'Projector', 'Outdoor Space'];

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // Onboarding steps: 1 = Signup fields, 2 = Role select, 3 = Role detail wizard
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');
  
  // Onboarding Data States
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [creatorBio, setCreatorBio] = useState('');
  const [creatorTags, setCreatorTags] = useState<string[]>([]);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCapacity, setVenueCapacity] = useState(100);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  // Handle simulated login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please fill in all fields.');
      return;
    }

    // Lookup user in mock DB
    const users = mockDb.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (found) {
      mockDb.setActiveUser(found.id);
      window.dispatchEvent(new Event('mockdb-update'));
      
      // Redirect based on active role
      if (found.activeRole === 'creator') router.push('/creator');
      else if (found.activeRole === 'venue') router.push('/venue');
      else if (found.activeRole === 'admin') router.push('/admin');
      else router.push('/');
    } else {
      setMessage('Demo User not found. Sign up or use a Fast-Swap profile in the header!');
    }
  };

  // Move through registration wizard
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!email || !name || !password) {
        setMessage('Please fill in all fields.');
        return;
      }
      setMessage('');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Complete onboarding
  const handleOnboardingComplete = () => {
    const newUser = mockDb.registerUser(email, name, role);
    
    // Attach additional onboarding parameters
    newUser.bio = role === 'creator' ? creatorBio : '';
    newUser.categoryTags = role === 'attendee' ? selectedInterests : role === 'creator' ? creatorTags : [];
    
    if (role === 'venue') {
      newUser.venueName = venueName;
      newUser.venueAddress = venueAddress;
      newUser.venueCapacity = venueCapacity;
      newUser.venueAmenities = selectedAmenities;
      newUser.venuePhotos = [
        'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600',
        'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600'
      ];
      newUser.venueBlockedDates = [];
    }

    mockDb.updateUser(newUser);
    mockDb.setActiveUser(newUser.id);
    
    // Trigger header update
    window.dispatchEvent(new Event('mockdb-update'));

    // Redirect
    if (role === 'creator') router.push('/creator');
    else if (role === 'venue') router.push('/venue');
    else router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12 md:py-20">
        <div className="w-full max-w-md glass-card p-8 relative overflow-hidden">
          {/* Top light effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-primary to-accent blur-md" />

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isLogin ? 'Explore spotlight events and dashboards' : 'Start your journey on the spotlight marketplace'}
            </p>
          </div>

          {message && (
            <div className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger leading-relaxed">
              {message}
            </div>
          )}

          {/* LOGIN VIEW */}
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vimoh@spotlight.app"
                    className="w-full glass-input pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setMessage('For portfolio demo, use any password. Registered accounts: vimoh@spotlight.app, shreya@venue.app')} 
                    className="text-[10px] text-primary hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input pl-10 text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white text-sm shadow-md shadow-primary/20 transition-all hover:scale-[1.01] mt-6"
              >
                Log In <ChevronRight className="h-4 w-4" />
              </button>

              <div className="text-center mt-6 text-xs text-gray-400">
                Don&apos;t have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(false); setStep(1); }} 
                  className="text-primary font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : (
            /* REGISTRATION & ONBOARDING WIZARD */
            <div>
              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step === s 
                        ? 'w-6 bg-primary' 
                        : step > s 
                          ? 'w-2 bg-success' 
                          : 'w-2 bg-white/10'
                    }`} 
                  />
                ))}
              </div>

              {/* STEP 1: SIGNUP FIELDS */}
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full glass-input pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full glass-input pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full glass-input pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white text-sm shadow-md shadow-primary/20 transition-all hover:scale-[1.01] mt-6"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: ROLE SELECTION */}
              {step === 2 && (
                <div className="space-y-4">
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-3 text-center">
                    Choose Your Primary Role
                  </label>

                  <div className="space-y-3">
                    {/* Attendee */}
                    <button
                      onClick={() => setRole('attendee')}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left border transition-all ${
                        role === 'attendee' 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Compass className={`h-8 w-8 shrink-0 ${role === 'attendee' ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-semibold text-white text-sm">Attendee</h4>
                        <p className="text-xs text-gray-400 leading-normal mt-0.5">Discover events, buy passes, join resales, write ratings, and enjoy Solo Mode chats.</p>
                      </div>
                    </button>

                    {/* Creator */}
                    <button
                      onClick={() => setRole('creator')}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left border transition-all ${
                        role === 'creator' 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Sliders className={`h-8 w-8 shrink-0 ${role === 'creator' ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-semibold text-white text-sm">Creator / Promoter</h4>
                        <p className="text-xs text-gray-400 leading-normal mt-0.5">Create tickets, define splits, view sales analytics, manage scanning, and use AI write-ups.</p>
                      </div>
                    </button>

                    {/* Venue Owner */}
                    <button
                      onClick={() => setRole('venue')}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left border transition-all ${
                        role === 'venue' 
                          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Building className={`h-8 w-8 shrink-0 ${role === 'venue' ? 'text-primary' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-semibold text-white text-sm">Venue Owner</h4>
                        <p className="text-xs text-gray-400 leading-normal mt-0.5">List location, schedule availability calendars, negotiate splits, and review incoming requests.</p>
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold bg-primary hover:bg-primary-hover text-white text-sm shadow-md shadow-primary/20 transition-all hover:scale-[1.01] mt-6"
                  >
                    Onward to Wizard <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* STEP 3: ROLE ONBOARDING WIZARDS */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* ATTENDEE ONBOARDING */}
                  {role === 'attendee' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">
                          Select Interest Categories (Min 1)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {INTERESTS.map((interest) => {
                            const isSelected = selectedInterests.includes(interest);
                            return (
                              <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                  isSelected 
                                    ? 'bg-primary/10 border-primary text-white' 
                                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${isSelected ? 'fill-primary text-primary' : ''}`} />
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white text-xs">Share Proximity Location</h5>
                          <p className="text-[10px] text-gray-400 mt-0.5">Ranks nearest local events in your discovery feed.</p>
                        </div>
                        <button
                          onClick={() => setLocationPermission(!locationPermission)}
                          className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ${locationPermission ? 'bg-success' : 'bg-white/10'}`}
                        >
                          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${locationPermission ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CREATOR ONBOARDING */}
                  {role === 'creator' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Display Profile Bio</label>
                        <textarea
                          value={creatorBio}
                          onChange={(e) => setCreatorBio(e.target.value)}
                          placeholder="Tell us about yourself or company..."
                          className="w-full glass-input text-xs h-20 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Category Tags</label>
                        <div className="flex flex-wrap gap-1.5">
                          {INTERESTS.map((tag) => {
                            const isSelected = creatorTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                onClick={() => {
                                  setCreatorTags(prev => 
                                    isSelected ? prev.filter(t => t !== tag) : [...prev, tag]
                                  );
                                }}
                                className={`py-1 px-2.5 rounded-full border text-[10px] font-semibold transition-all ${
                                  isSelected 
                                    ? 'bg-primary/25 border-primary text-white font-bold' 
                                    : 'bg-white/[0.01] border-white/5 text-gray-400'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                        <p className="text-[10px] text-gray-400 leading-normal">
                          <ShieldCheck className="h-4 w-4 text-primary inline-block mr-1 align-text-bottom" />
                          Unverified accounts can host <strong>free events</strong> immediately. Verification (phone/ID) unlocks paid ticketing.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* VENUE ONBOARDING */}
                  {role === 'venue' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Venue Name</label>
                        <input
                          type="text"
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="The Comedy Cellar"
                          className="w-full glass-input text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Address Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <input
                            type="text"
                            value={venueAddress}
                            onChange={(e) => setVenueAddress(e.target.value)}
                            placeholder="12, Park Street, Kolkata, WB"
                            className="w-full glass-input pl-10 text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Venue Capacity</label>
                          <span className="text-xs font-semibold text-primary">{venueCapacity} guests</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={venueCapacity}
                          onChange={(e) => setVenueCapacity(Number(e.target.value))}
                          className="w-full accent-primary bg-white/10 rounded-lg h-1.5 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">Amenities Checklist</label>
                        <div className="grid grid-cols-2 gap-2">
                          {AMENITIES.map((amenity) => {
                            const isSelected = selectedAmenities.includes(amenity);
                            return (
                              <button
                                key={amenity}
                                onClick={() => toggleAmenity(amenity)}
                                className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                                  isSelected 
                                    ? 'bg-primary/10 border-primary text-white' 
                                    : 'bg-white/[0.01] border-white/5 text-gray-400 hover:text-white'
                                }`}
                              >
                                <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-white/20'}`}>
                                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                {amenity}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleOnboardingComplete}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold bg-success hover:bg-success/90 text-white text-sm shadow-md shadow-success/20 transition-all hover:scale-[1.01] mt-6 animate-pulse"
                  >
                    Complete Onboarding <Check className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="text-center mt-6 text-xs text-gray-400">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(true)} 
                  className="text-primary font-semibold hover:underline"
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
