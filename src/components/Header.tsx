'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, 
  Wallet, 
  ChevronDown, 
  Shield, 
  Calendar, 
  Film, 
  Compass, 
  Ticket as TicketIcon,
  RefreshCw,
  Sliders,
  Menu,
  X
} from 'lucide-react';
import { mockDb, User, UserRole, AppNotification } from '@/lib/mockDb';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('attendee');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load database state
  const loadDbState = useCallback(() => {
    const user = mockDb.getActiveUser();
    setCurrentUser(user);
    setActiveRole(user.activeRole);
    const notifs = mockDb.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDbState();
    }, 0);
    
    // Listen to custom DB updates across pages
    const handleDbUpdate = () => {
      loadDbState();
    };
    window.addEventListener('mockdb-update', handleDbUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mockdb-update', handleDbUpdate);
    };
  }, [loadDbState]);

  // Handle switching mock personas (testing utility)
  const handleUserSwitch = (userId: string) => {
    mockDb.setActiveUser(userId);
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event('mockdb-update'));
    
    // Redirect based on selected user\'s default role to make it intuitive
    const user = mockDb.getUser(userId);
    if (user) {
      if (user.roles.includes('admin')) {
        router.push('/admin');
      } else if (user.roles.includes('creator')) {
        router.push('/creator');
      } else if (user.roles.includes('venue')) {
        router.push('/venue');
      } else {
        router.push('/');
      }
    }
  };

  // Switch roles for multi-role accounts (e.g. Creator acting as Attendee)
  const handleRoleSwitch = (role: UserRole) => {
    mockDb.updateSessionUserRole(role);
    setActiveRole(role);
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event('mockdb-update'));
    
    if (role === 'creator') router.push('/creator');
    else if (role === 'venue') router.push('/venue');
    else if (role === 'admin') router.push('/admin');
    else router.push('/');
  };

  const handleMarkAllNotificationsRead = () => {
    mockDb.markNotificationsRead();
    window.dispatchEvent(new Event('mockdb-update'));
  };

  const handleResetDatabase = () => {
    if (confirm('Are you sure you want to reset the mock database? All purchases, edits, and bookings will return to default seeds.')) {
      mockDb.reset();
      window.dispatchEvent(new Event('mockdb-update'));
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-nav shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-lg text-white shadow-md shadow-primary/20">S</span>
              <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-300 bg-clip-text text-transparent">
                SPOTLIGHT
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="h-4 w-4" />
              Discover
            </Link>
            <Link 
              href="/vibe-check" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/vibe-check' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="h-4 w-4" />
              Vibe Check
            </Link>
            
            {currentUser?.activeRole === 'attendee' && (
              <Link 
                href="/my-tickets" 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/my-tickets' ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <TicketIcon className="h-4 w-4" />
                My Tickets
              </Link>
            )}

            {currentUser?.roles.includes('creator') && (
              <Link 
                href="/creator" 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/creator') ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="h-4 w-4" />
                Creator Studio
              </Link>
            )}

            {currentUser?.roles.includes('venue') && (
              <Link 
                href="/venue" 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/venue') ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Venue Console
              </Link>
            )}

            {currentUser?.roles.includes('admin') && (
              <Link 
                href="/admin" 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin') ? 'text-primary bg-primary/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right Header Toolbar (Wallet, Notifs, Profile) */}
          <div className="flex items-center space-x-3">
            {/* Reset Database Shortcut */}
            <button 
              onClick={handleResetDatabase}
              title="Reset Mock DB"
              className="p-2 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-white/5 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Wallet Balance Widget */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-emerald-400">
                <Wallet className="h-4 w-4" />
                <span>₹{currentUser.walletBalance.toLocaleString()}</span>
              </div>
            )}

            {/* Notifications Center Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowProfileDropdown(false);
                }}
                className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 glass-card p-4 overflow-hidden z-50">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                    <h3 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-primary" /> Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs text-primary hover:underline hover:text-primary-hover"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-2.5 rounded-lg text-xs transition-colors ${n.read ? 'bg-white/[0.02] text-gray-400' : 'bg-primary/10 text-white border-l-2 border-primary'}`}>
                          <div className="flex justify-between font-semibold mb-0.5">
                            <span>{n.title}</span>
                            <span className="text-[9px] text-gray-500">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown & Persona Switcher */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotificationDropdown(false);
                  }}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
                >
                  <img 
                    src={currentUser.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    alt={currentUser.name} 
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                  <div className="hidden lg:block pr-1">
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">{currentUser.name}</p>
                    <p className="text-[10px] text-primary capitalize font-medium">{activeRole}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-72 glass-card p-4 z-50">
                    <div className="border-b border-white/5 pb-3 mb-3">
                      <p className="text-xs text-gray-400">Current User Portfolio Profile</p>
                      <h4 className="font-semibold text-white text-sm">{currentUser.name}</h4>
                      <p className="text-[11px] text-gray-400">{currentUser.email}</p>
                    </div>

                    {/* Multi-role Toggle */}
                    {currentUser.roles.length > 1 && (
                      <div className="mb-3 p-2 bg-white/[0.03] rounded-lg border border-white/5">
                        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Switch Active Role</p>
                        <div className="flex gap-1">
                          {currentUser.roles.map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              className={`flex-1 text-[10px] font-semibold py-1 rounded-md capitalize transition-all ${
                                activeRole === role 
                                  ? 'bg-primary text-white shadow-sm' 
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Persona Quick Swap (Portfolio Tester Utility) */}
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Fast-Swap Demo Account</p>
                      <div className="space-y-1">
                        {mockDb.getUsers().map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleUserSwitch(u.id)}
                            className={`w-full flex items-center justify-between text-left text-xs p-1.5 rounded-lg transition-all ${
                              currentUser.id === u.id 
                                ? 'bg-primary/20 text-primary border border-primary/30 font-semibold' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[9px] uppercase px-1 bg-white/5 rounded text-gray-400">
                              {u.roles[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-400 hover:text-white md:hidden rounded-lg hover:bg-white/5"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-background border-b border-white/5 px-4 pt-2 pb-4 space-y-2">
          <Link 
            href="/" 
            onClick={() => setShowMobileMenu(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname === '/' ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
          >
            <Compass className="h-4 w-4" /> Discover
          </Link>
          <Link 
            href="/vibe-check" 
            onClick={() => setShowMobileMenu(false)}
            className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname === '/vibe-check' ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
          >
            <Film className="h-4 w-4" /> Vibe Check
          </Link>

          {currentUser?.activeRole === 'attendee' && (
            <Link 
              href="/my-tickets" 
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname === '/my-tickets' ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
            >
              <TicketIcon className="h-4 w-4" /> My Tickets
            </Link>
          )}

          {currentUser?.roles.includes('creator') && (
            <Link 
              href="/creator" 
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname.startsWith('/creator') ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
            >
              <Sliders className="h-4 w-4" /> Creator Studio
            </Link>
          )}

          {currentUser?.roles.includes('venue') && (
            <Link 
              href="/venue" 
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname.startsWith('/venue') ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
            >
              <Calendar className="h-4 w-4" /> Venue Console
            </Link>
          )}

          {currentUser?.roles.includes('admin') && (
            <Link 
              href="/admin" 
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${pathname.startsWith('/admin') ? 'text-primary bg-primary/10' : 'text-gray-300'}`}
            >
              <Shield className="h-4 w-4" /> Admin Panel
            </Link>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-emerald-400 sm:hidden">
              <Wallet className="h-4 w-4" />
              <span>₹{currentUser.walletBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
