// Spotlight Simulated Database Client
// Persisted in LocalStorage for dynamic client-side Vercel execution

export type UserRole = 'attendee' | 'creator' | 'venue' | 'admin';
export type VerificationStatus = 'unverified' | 'verified' | 'spotlight';

export interface User {
  id: string;
  email: string;
  name: string;
  activeRole: UserRole;
  roles: UserRole[];
  bio?: string;
  profilePhoto?: string;
  categoryTags?: string[];
  // Venue specific details
  venueName?: string;
  venueAddress?: string;
  venueCapacity?: number;
  venuePhotos?: string[];
  venueAmenities?: string[];
  venueBlockedDates?: string[]; // ISO strings
  // Verification
  isVerified: VerificationStatus;
  phone?: string;
  walletBalance: number; // Simulated wallet
  followersCount: number;
  followingCreators: string[]; // List of creator userIds
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity: number;
  soldCount: number;
  description: string;
}

export interface RefundPolicy {
  type: 'full' | 'half' | 'none';
  daysCutoff: number; // e.g. 3 days before event
}

export interface CollaboratorSplit {
  email: string;
  sharePercent: number; // 0 to 100
  status: 'pending' | 'accepted';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  banner: string;
  category: string; // Comedy, Music, Art, Theatre, Sports, Wellness, Food, Workshop
  startDate: string; // ISO
  endDate: string; // ISO
  isMultiDay: boolean;
  venueId?: string; // Link to platform venue
  customAddress?: string; // If custom location
  coordinates: [number, number]; // [lat, lng] for Leaflet
  ticketTiers: TicketTier[];
  refundPolicy: RefundPolicy;
  is18Plus: boolean;
  status: 'draft' | 'published' | 'cancelled';
  creatorId: string;
  creatorName: string;
  collaborators: CollaboratorSplit[];
  priceLocked: boolean; // True once first ticket sells
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  tierId: string;
  tierName: string;
  purchaserId: string;
  purchaserName: string;
  purchasePrice: number;
  purchaseDate: string;
  qrCode: string;
  status: 'valid' | 'checked-in' | 'resold' | 'resale-pool' | 'refunded';
  checkInTime?: string;
  insuranceBought: boolean;
  gateLabel?: string;
}

export interface VenueBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  venueId: string;
  proposedSplit: number; // Split of ticket revenue for venue owner
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  counterSplit?: number;
  createdAt: string;
}

export interface EscrowEntry {
  eventId: string;
  eventTitle: string;
  creatorId: string;
  totalGross: number;
  netRevenue: number;
  platformFee: number;
  amount: number; // Amount held
  status: 'pending' | 'held' | 'released' | 'frozen';
  releaseTime: string; // ISO string (Event End Time + 24 Hours)
  frozenReason?: string;
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  email: string;
  joinedAt: string;
  notifiedAt?: string;
  holdExpiresAt?: string;
}

export interface Review {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  creatorResponse?: string;
}

export interface FlagReport {
  id: string;
  eventId: string;
  eventTitle: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string; // ISO
}

export type NotificationType = 
  | 'event_publish' 
  | 'reminder' 
  | 'resale_available' 
  | 'payout_released' 
  | 'collaborator_invite' 
  | 'booking_request' 
  | 'booking_response'
  | 'refund'
  | 'payout_frozen'
  | 'flagged_alert';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface VibeClip {
  id: string;
  eventId?: string;
  creatorId: string;
  creatorName: string;
  videoUrl: string; // YouTube embed ID or direct video link
  thumbnailUrl: string;
  caption: string;
  likes: number;
  likedByUserIds: string[];
  approvedByCreator: boolean;
}

// Simulated Ad Studio Campaign
export interface AdCampaign {
  id: string;
  eventId: string;
  eventTitle: string;
  budget: number;
  radius: number;
  channels: string[]; // Instagram, Facebook, YouTube, Billboards, Flyers
  status: 'draft' | 'active' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number; // Tickets sold via ad
  createdAt: string;
}

// ----------------------------------------------------
// DEFAULT SEED DATA
// ----------------------------------------------------

const SEED_USERS: User[] = [
  {
    id: 'user_vimoh',
    email: 'vimoh@spotlight.app',
    name: 'Vimoh the Creator',
    activeRole: 'creator',
    roles: ['creator', 'attendee'],
    bio: 'Independent stand-up comic, storyteller, and digital content creator. Performing live for 10+ years.',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    categoryTags: ['Comedy', 'Workshop'],
    isVerified: 'spotlight',
    phone: '+91 9876543210',
    walletBalance: 24500,
    followersCount: 1240,
    followingCreators: []
  },
  {
    id: 'user_shreya',
    email: 'shreya@venue.app',
    name: 'Shreya (Venue Owner)',
    activeRole: 'venue',
    roles: ['venue', 'attendee'],
    bio: 'Managing director of Aritra\'s Loft and The Open Space Art Center. Supporter of local arts.',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    venueName: 'The Art Loft & Stage',
    venueAddress: '12, Park Street, Kolkata, WB, India',
    venueCapacity: 120,
    venuePhotos: [
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600'
    ],
    venueAmenities: ['Sound System', 'Stage Lights', 'A/C', 'Bar Counter', 'Backstage Room'],
    venueBlockedDates: [],
    isVerified: 'verified',
    phone: '+91 8765432109',
    walletBalance: 52000,
    followersCount: 0,
    followingCreators: []
  },
  {
    id: 'user_arjun',
    email: 'arjun@gmail.com',
    name: 'Arjun Das (Attendee)',
    activeRole: 'attendee',
    roles: ['attendee'],
    bio: 'Live entertainment enthusiast. Big comedy and indie music fan.',
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    categoryTags: ['Comedy', 'Music', 'Food'],
    isVerified: 'verified',
    phone: '+91 9998887776',
    walletBalance: 5000,
    followersCount: 0,
    followingCreators: ['user_vimoh']
  },
  {
    id: 'user_admin',
    email: 'admin@spotlight.app',
    name: 'Platform Administrator',
    activeRole: 'admin',
    roles: ['admin'],
    isVerified: 'verified',
    walletBalance: 1250000,
    followersCount: 0,
    followingCreators: []
  }
];

const SEED_EVENTS: Event[] = [
  {
    id: 'event_comedy_night',
    title: 'Vimoh Live: Let\'s Fix India (Stand-up)',
    description: 'An evening of unfiltered satirical comedy looking at our culture, politics, and daily absurdities. Vimoh returns to the stage with 90 minutes of brand-new material that will make you laugh and think. Strictly 18+.',
    banner: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?w=800',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    endDate: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(), // 2 hours duration
    isMultiDay: false,
    venueId: 'user_shreya',
    coordinates: [22.5487, 88.3585], // Park Street Kolkata
    ticketTiers: [
      { id: 't_comedy_early', name: 'Early Bird', price: 299, capacity: 30, soldCount: 30, description: 'Discounted admission for early buyers. Standard seating.' },
      { id: 't_comedy_general', name: 'General Admission', price: 499, capacity: 70, soldCount: 45, description: 'Standard entry to the event.' },
      { id: 't_comedy_vip', name: 'VIP Front Row', price: 899, capacity: 20, soldCount: 15, description: 'Premium front row seats + meet Vimoh post-show.' }
    ],
    refundPolicy: { type: 'full', daysCutoff: 3 },
    is18Plus: true,
    status: 'published',
    creatorId: 'user_vimoh',
    creatorName: 'Vimoh the Creator',
    collaborators: [
      { email: 'shreya@venue.app', sharePercent: 20, status: 'accepted' } // Venue split
    ],
    priceLocked: true
  },
  {
    id: 'event_podcast_workshop',
    title: 'Creative Podcast Masterclass by Vimoh',
    description: 'Learn how to script, record, and monetize your podcast. This is a hands-on, two-day workshop where we record mock segments and analyze distribution platforms. Free for aspiring creators.',
    banner: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800',
    category: 'Workshop',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    endDate: new Date(Date.now() + 86400000 * 6).toISOString(), // 2 days event
    isMultiDay: true,
    customAddress: 'Modern Creators Hub, Salt Lake, Sector V, Kolkata',
    coordinates: [22.5735, 88.4331],
    ticketTiers: [
      { id: 't_workshop_free', name: 'Standard Pass', price: 0, capacity: 50, soldCount: 48, description: 'Free registration. Requires interest verification.' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published',
    creatorId: 'user_vimoh',
    creatorName: 'Vimoh the Creator',
    collaborators: [],
    priceLocked: true
  },
  {
    id: 'event_art_exhibit',
    title: 'Abstract Expressions: Modern Art Showcase',
    description: 'A curated gallery exhibiting modern abstract canvases by independent East Indian painters. Meet the artists, enjoy cheese & wine, and purchase original art pieces directly.',
    banner: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    category: 'Art',
    startDate: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
    endDate: new Date(Date.now() + 86400000 * 2).toISOString(), // Runs for 3 days
    isMultiDay: true,
    venueId: 'user_shreya',
    coordinates: [22.5487, 88.3585],
    ticketTiers: [
      { id: 't_art_pass', name: 'All-Access Pass', price: 150, capacity: 200, soldCount: 110, description: 'Valid for entry on any exhibition day.' }
    ],
    refundPolicy: { type: 'half', daysCutoff: 1 },
    is18Plus: false,
    status: 'published',
    creatorId: 'user_shreya', // Venue owner is also the creator
    creatorName: 'Shreya (Venue Owner)',
    collaborators: [],
    priceLocked: true
  },
  {
    id: 'event_indie_jam',
    title: 'Sunset Acoustic Jam (Unplugged)',
    description: 'An intimate rooftop music gig featuring three rising songwriters. Bring blankets, sit under the stars, and experience raw acoustic storytelling.',
    banner: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
    category: 'Music',
    startDate: new Date(Date.now() - 86400000 * 5).toISOString(), // Past event
    endDate: new Date(Date.now() - 86400000 * 5 + 10800000).toISOString(),
    isMultiDay: false,
    venueId: 'user_shreya',
    coordinates: [22.5487, 88.3585],
    ticketTiers: [
      { id: 't_indie_gen', name: 'General Entry', price: 350, capacity: 80, soldCount: 80, description: 'Full access to rooftop gig.' }
    ],
    refundPolicy: { type: 'full', daysCutoff: 2 },
    is18Plus: false,
    status: 'published',
    creatorId: 'user_vimoh',
    creatorName: 'Vimoh the Creator',
    collaborators: [
      { email: 'shreya@venue.app', sharePercent: 25, status: 'accepted' }
    ],
    priceLocked: true
  }
];

const SEED_TICKETS: Ticket[] = [
  {
    id: 't_001',
    eventId: 'event_comedy_night',
    eventTitle: 'Vimoh Live: Let\'s Fix India (Stand-up)',
    eventDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    tierId: 't_comedy_vip',
    tierName: 'VIP Front Row',
    purchaserId: 'user_arjun',
    purchaserName: 'Arjun Das (Attendee)',
    purchasePrice: 899,
    purchaseDate: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    qrCode: 'SPOTLIGHT-TKT-VIMOH-COMEDY-VIP-ARJUN-19823984',
    status: 'valid',
    insuranceBought: true,
    gateLabel: 'VIP Gate 1'
  },
  {
    id: 't_002',
    eventId: 'event_podcast_workshop',
    eventTitle: 'Creative Podcast Masterclass by Vimoh',
    eventDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    tierId: 't_workshop_free',
    tierName: 'Standard Pass',
    purchaserId: 'user_arjun',
    purchaserName: 'Arjun Das (Attendee)',
    purchasePrice: 0,
    purchaseDate: new Date(Date.now() - 200000).toISOString(),
    qrCode: 'SPOTLIGHT-TKT-VIMOH-PODCAST-FREE-ARJUN-28394829',
    status: 'valid',
    insuranceBought: false
  },
  {
    id: 't_003',
    eventId: 'event_indie_jam',
    eventTitle: 'Sunset Acoustic Jam (Unplugged)',
    eventDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    tierId: 't_indie_gen',
    tierName: 'General Entry',
    purchaserId: 'user_arjun',
    purchaserName: 'Arjun Das (Attendee)',
    purchasePrice: 350,
    purchaseDate: new Date(Date.now() - 86400000 * 6).toISOString(),
    qrCode: 'SPOTLIGHT-TKT-VIMOH-JAM-GEN-ARJUN-39849204',
    status: 'checked-in',
    checkInTime: new Date(Date.now() - 86400000 * 5 + 1800000).toISOString(),
    insuranceBought: false
  }
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'r_001',
    eventId: 'event_indie_jam',
    eventTitle: 'Sunset Acoustic Jam (Unplugged)',
    userId: 'user_arjun',
    userName: 'Arjun Das (Attendee)',
    rating: 5,
    comment: 'Spectacular gig! The rooftop atmosphere under the stars was magical, and the songwriters were incredibly talented. Looking forward to the next rooftop event.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    creatorResponse: 'Thanks Arjun! Appreciate the love, we will do more unplugged rooftops soon.'
  }
];

const SEED_ESCROW: EscrowEntry[] = [
  {
    eventId: 'event_comedy_night',
    eventTitle: 'Vimoh Live: Let\'s Fix India (Stand-up)',
    creatorId: 'user_vimoh',
    totalGross: 35940, // Mocked total tickets sum
    platformFee: 3594, // 10%
    netRevenue: 32346,
    amount: 32346,
    status: 'pending',
    releaseTime: new Date(Date.now() + 86400000 * 2 + 7200000 + 86400000).toISOString() // Event End + 24 Hours
  },
  {
    eventId: 'event_indie_jam',
    eventTitle: 'Sunset Acoustic Jam (Unplugged)',
    creatorId: 'user_vimoh',
    totalGross: 28000,
    platformFee: 2800,
    netRevenue: 25200,
    amount: 25200,
    status: 'released',
    releaseTime: new Date(Date.now() - 86400000 * 4).toISOString() // Released in the past
  }
];

const SEED_CLIPS: VibeClip[] = [
  {
    id: 'clip_comedy_1',
    creatorId: 'user_vimoh',
    creatorName: 'Vimoh the Creator',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stand-up-comedian-performing-on-stage-41916-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?w=300',
    caption: 'Vimoh riffing on Indian Traffic system! Live at Canvas Comedy.',
    likes: 142,
    likedByUserIds: ['user_arjun'],
    approvedByCreator: true
  },
  {
    id: 'clip_music_1',
    creatorId: 'user_vimoh',
    creatorName: 'Vimoh the Creator',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-with-lights-41907-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300',
    caption: 'Sneak peek of Rooftop acoustic vibes from our last unplugged session.',
    likes: 98,
    likedByUserIds: [],
    approvedByCreator: true
  }
];

const SEED_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp_001',
    eventId: 'event_comedy_night',
    eventTitle: 'Vimoh Live: Let\'s Fix India (Stand-up)',
    budget: 5000,
    radius: 10,
    channels: ['Instagram', 'Facebook'],
    status: 'active',
    impressions: 12400,
    clicks: 1450,
    conversions: 24, // 24 tickets sold attributed to ad
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

const SEED_BOOKINGS: VenueBooking[] = [
  {
    id: 'book_001',
    eventId: 'event_comedy_night',
    eventTitle: 'Vimoh Live: Let\'s Fix India (Stand-up)',
    venueId: 'user_shreya',
    proposedSplit: 20,
    status: 'accepted',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

// ----------------------------------------------------
// DATABASE MANAGEMENT INTERFACE
// ----------------------------------------------------

class MockDatabase {
  private isLoaded = false;

  private users: User[] = [];
  private events: Event[] = [];
  private tickets: Ticket[] = [];
  private bookings: VenueBooking[] = [];
  private escrow: EscrowEntry[] = [];
  private waitlists: WaitlistEntry[] = [];
  private reviews: Review[] = [];
  private reports: FlagReport[] = [];
  private messages: ChatMessage[] = [];
  private notifications: AppNotification[] = [];
  private clips: VibeClip[] = [];
  private campaigns: AdCampaign[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;

    try {
      const storedUsers = localStorage.getItem('spotlight_users');
      const storedEvents = localStorage.getItem('spotlight_events');
      const storedTickets = localStorage.getItem('spotlight_tickets');
      const storedBookings = localStorage.getItem('spotlight_bookings');
      const storedEscrow = localStorage.getItem('spotlight_escrow');
      const storedWaitlists = localStorage.getItem('spotlight_waitlists');
      const storedReviews = localStorage.getItem('spotlight_reviews');
      const storedReports = localStorage.getItem('spotlight_reports');
      const storedMessages = localStorage.getItem('spotlight_messages');
      const storedNotifications = localStorage.getItem('spotlight_notifications');
      const storedClips = localStorage.getItem('spotlight_clips');
      const storedCampaigns = localStorage.getItem('spotlight_campaigns');

      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        this.events = JSON.parse(storedEvents || '[]');
        this.tickets = JSON.parse(storedTickets || '[]');
        this.bookings = JSON.parse(storedBookings || '[]');
        this.escrow = JSON.parse(storedEscrow || '[]');
        this.waitlists = JSON.parse(storedWaitlists || '[]');
        this.reviews = JSON.parse(storedReviews || '[]');
        this.reports = JSON.parse(storedReports || '[]');
        this.messages = JSON.parse(storedMessages || '[]');
        this.notifications = JSON.parse(storedNotifications || '[]');
        this.clips = JSON.parse(storedClips || '[]');
        
        // Migrate old YouTube clips to the working Mixkit MP4 clips
        if (this.clips.some(c => c.videoUrl.includes('youtube.com/embed/8v8VzKxU840') || c.videoUrl.includes('youtube.com/embed/c0tFw14K9W8'))) {
          this.clips = [...SEED_CLIPS];
          this.save();
        }

        this.campaigns = JSON.parse(storedCampaigns || '[]');
        this.isLoaded = true;
      } else {
        this.reset();
      }
    } catch (e) {
      console.error('Failed to load mock database:', e);
      this.reset();
    }
  }

  public reset() {
    this.users = [...SEED_USERS];
    this.events = [...SEED_EVENTS];
    this.tickets = [...SEED_TICKETS];
    this.bookings = [...SEED_BOOKINGS];
    this.escrow = [...SEED_ESCROW];
    this.waitlists = [];
    this.reviews = [...SEED_REVIEWS];
    this.reports = [];
    this.messages = [];
    this.clips = [...SEED_CLIPS];
    this.campaigns = [...SEED_CAMPAIGNS];
    this.notifications = [
      {
        id: 'notif_init',
        userId: 'user_vimoh',
        title: 'Welcome to Spotlight!',
        message: 'Your creator account is set up. Post your highlights to build your Vibe Check feed!',
        type: 'event_publish',
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_booking_init',
        userId: 'user_shreya',
        title: 'Booking Confirmed',
        message: 'You have accepted the venue request for "Vimoh Live". Split locked at 20%.',
        type: 'booking_response',
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    this.save();
    this.isLoaded = true;
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('spotlight_users', JSON.stringify(this.users));
      localStorage.setItem('spotlight_events', JSON.stringify(this.events));
      localStorage.setItem('spotlight_tickets', JSON.stringify(this.tickets));
      localStorage.setItem('spotlight_bookings', JSON.stringify(this.bookings));
      localStorage.setItem('spotlight_escrow', JSON.stringify(this.escrow));
      localStorage.setItem('spotlight_waitlists', JSON.stringify(this.waitlists));
      localStorage.setItem('spotlight_reviews', JSON.stringify(this.reviews));
      localStorage.setItem('spotlight_reports', JSON.stringify(this.reports));
      localStorage.setItem('spotlight_messages', JSON.stringify(this.messages));
      localStorage.setItem('spotlight_notifications', JSON.stringify(this.notifications));
      localStorage.setItem('spotlight_clips', JSON.stringify(this.clips));
      localStorage.setItem('spotlight_campaigns', JSON.stringify(this.campaigns));
    } catch (e) {
      console.error('Failed to save mock database:', e);
    }
  }

  // ----------------------------------------------------
  // CURRENT LOGGED IN USER HELPERS
  // ----------------------------------------------------
  public getActiveUser(): User {
    this.load();
    // For demo purposes, we fetch the user marked with active session or default to attendee/creator
    const activeUserId = localStorage.getItem('spotlight_active_user_id') || 'user_arjun';
    return this.users.find(u => u.id === activeUserId) || this.users[0];
  }

  public setActiveUser(userId: string) {
    localStorage.setItem('spotlight_active_user_id', userId);
    // Sync active role to matched user default
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.activeRole = user.roles[0];
      this.save();
    }
  }

  public getSessionUserRole(): UserRole {
    const user = this.getActiveUser();
    return user.activeRole;
  }

  public updateSessionUserRole(role: UserRole) {
    this.load();
    const user = this.getActiveUser();
    if (user.roles.includes(role)) {
      user.activeRole = role;
      this.save();
    }
  }

  // ----------------------------------------------------
  // USER METHODS
  // ----------------------------------------------------
  public getUsers(): User[] {
    this.load();
    return this.users;
  }

  public getUser(id: string): User | undefined {
    this.load();
    return this.users.find(u => u.id === id);
  }

  public updateUser(updated: User) {
    this.load();
    const idx = this.users.findIndex(u => u.id === updated.id);
    if (idx !== -1) {
      this.users[idx] = updated;
      this.save();
    }
  }

  public registerUser(email: string, name: string, initialRole: UserRole): User {
    this.load();
    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      email,
      name,
      activeRole: initialRole,
      roles: [initialRole, 'attendee'], // Everyone can attend
      bio: '',
      isVerified: 'unverified',
      walletBalance: 1000, // Preloaded with ₹1,000 promo cash!
      followersCount: 0,
      followingCreators: []
    };

    if (initialRole === 'venue') {
      newUser.venueName = 'New Venue';
      newUser.venueAddress = '';
      newUser.venueCapacity = 50;
      newUser.venuePhotos = [];
      newUser.venueAmenities = [];
      newUser.venueBlockedDates = [];
    }

    this.users.push(newUser);
    this.save();
    return newUser;
  }

  // ----------------------------------------------------
  // EVENT METHODS
  // ----------------------------------------------------
  public getEvents(): Event[] {
    this.load();
    return this.events.filter(e => e.status !== 'cancelled' || this.getActiveUser().activeRole === 'admin' || e.creatorId === this.getActiveUser().id);
  }

  public getEvent(id: string): Event | undefined {
    this.load();
    return this.events.find(e => e.id === id);
  }

  public createEvent(eventData: Omit<Event, 'id' | 'creatorId' | 'creatorName' | 'priceLocked' | 'collaborators'>): Event {
    this.load();
    const user = this.getActiveUser();
    
    if (user.isVerified === 'unverified') {
      const hasPaidTier = eventData.ticketTiers.some(t => t.price > 0);
      if (hasPaidTier) {
        throw new Error('Unverified creators can only host free events.');
      }
    }

    const newEvent: Event = {
      ...eventData,
      id: 'event_' + Math.random().toString(36).substring(2, 9),
      creatorId: user.id,
      creatorName: user.name,
      priceLocked: false,
      collaborators: []
    };

    // If venue is specified, automatically add venue booking request
    if (eventData.venueId) {
      const booking: VenueBooking = {
        id: 'book_' + Math.random().toString(36).substring(2, 9),
        eventId: newEvent.id,
        eventTitle: newEvent.title,
        venueId: eventData.venueId,
        proposedSplit: 15, // Default proposed venue split
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      this.bookings.push(booking);
      
      // Notify venue owner
      this.addNotification(
        eventData.venueId,
        'Booking Request Recieved',
        `Creator ${user.name} requested to book your venue for "${newEvent.title}".`,
        'booking_request'
      );
    }

    this.events.push(newEvent);
    this.save();
    return newEvent;
  }

  public updateEvent(updated: Event) {
    this.load();
    const idx = this.events.findIndex(e => e.id === updated.id);
    if (idx !== -1) {
      const original = this.events[idx];
      const creator = this.users.find(u => u.id === original.creatorId);
      if (creator && creator.isVerified === 'unverified') {
        const hasPaidTier = updated.ticketTiers.some(t => t.price > 0);
        if (hasPaidTier) {
          throw new Error('Unverified creators can only host free events.');
        }
      }

      // Safety Price Lock Enforcement
      if (original.priceLocked) {
        // Enforce that prices of existing tiers cannot be changed
        updated.ticketTiers = updated.ticketTiers.map(updatedTier => {
          const originalTier = original.ticketTiers.find(t => t.id === updatedTier.id);
          if (originalTier) {
            return { ...updatedTier, price: originalTier.price }; // Overwrite price back to locked price
          }
          return updatedTier;
        });
      }

      this.events[idx] = updated;
      this.save();
    }
  }

  public cancelEvent(eventId: string) {
    this.load();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    event.status = 'cancelled';
    this.save();

    // Trigger full refund loop for all ticket buyers
    const buyers = this.tickets.filter(t => t.eventId === eventId && t.status === 'valid');
    buyers.forEach(tkt => {
      // Refund money to wallet
      const user = this.users.find(u => u.id === tkt.purchaserId);
      if (user) {
        user.walletBalance += tkt.purchasePrice;
        this.addNotification(
          user.id,
          'Event Cancelled - Fully Refunded',
          `"${event.title}" has been cancelled by the creator. ₹${tkt.purchasePrice} refunded to your wallet.`,
          'refund'
        );
      }
      tkt.status = 'refunded';
    });

    // Void escrow
    const esc = this.escrow.find(es => es.eventId === eventId);
    if (esc) {
      esc.status = 'released'; // Escrow cleared (with 0 payouts to creator)
      esc.amount = 0;
    }

    this.save();
  }

  // ----------------------------------------------------
  // TICKET PURCHASING & RESALE
  // ----------------------------------------------------
  public purchaseTickets(eventId: string, tierId: string, quantity: number, buyInsurance: boolean): { success: boolean; message: string; tickets?: Ticket[] } {
    this.load();
    const user = this.getActiveUser();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    const tier = event.ticketTiers.find(t => t.id === tierId);
    if (!tier) return { success: false, message: 'Ticket tier not found' };

    if (tier.soldCount + quantity > tier.capacity) {
      return { success: false, message: 'Not enough ticket capacity remaining' };
    }

    const pricePerTicket = tier.price;
    const insuranceCost = buyInsurance ? 49 : 0;
    const totalTicketCost = pricePerTicket * quantity;
    const platformFee = Math.round(totalTicketCost * 0.1); // 10% fee
    const totalBill = totalTicketCost + platformFee + (insuranceCost * quantity);

    if (user.walletBalance < totalBill) {
      return { success: false, message: `Insufficient wallet balance. Total cost is ₹${totalBill}. Your balance is ₹${user.walletBalance}.` };
    }

    // Deduct balance
    user.walletBalance -= totalBill;

    // Create tickets
    const newTickets: Ticket[] = [];
    for (let i = 0; i < quantity; i++) {
      const ticket: Ticket = {
        id: 'tkt_' + Math.random().toString(36).substring(2, 9),
        eventId,
        eventTitle: event.title,
        eventDate: event.startDate,
        tierId,
        tierName: tier.name,
        purchaserId: user.id,
        purchaserName: user.name,
        purchasePrice: pricePerTicket,
        purchaseDate: new Date().toISOString(),
        qrCode: `SPOTLIGHT-TKT-${event.id.toUpperCase()}-${tier.name.toUpperCase()}-${user.name.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: 'valid',
        insuranceBought: buyInsurance,
        gateLabel: `Gate ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}` // Gate A, B, or C
      };
      this.tickets.push(ticket);
      newTickets.push(ticket);
    }

    // Lock price on event & update sold count
    tier.soldCount += quantity;
    event.priceLocked = true;

    // Update Escrow Account
    if (pricePerTicket > 0) {
      let escrow = this.escrow.find(es => es.eventId === eventId);
      if (!escrow) {
        escrow = {
          eventId,
          eventTitle: event.title,
          creatorId: event.creatorId,
          totalGross: 0,
          platformFee: 0,
          netRevenue: 0,
          amount: 0,
          status: 'pending',
          releaseTime: new Date(new Date(event.endDate).getTime() + 86400000).toISOString() // End + 24 hours
        };
        this.escrow.push(escrow);
      }
      escrow.totalGross += totalTicketCost;
      escrow.platformFee += platformFee;
      escrow.netRevenue = escrow.totalGross - escrow.platformFee;
      escrow.amount = escrow.netRevenue;
    }

    this.save();
    return { success: true, message: 'Tickets purchased successfully!', tickets: newTickets };
  }

  public refundTicket(ticketId: string): { success: boolean; message: string } {
    this.load();
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    const event = this.events.find(e => e.id === ticket.eventId);
    if (!event) return { success: false, message: 'Event not found' };

    // Check Refund Policy
    const daysLeft = (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    let refundPercent = 0;

    if (ticket.status === 'refunded') {
      return { success: false, message: 'Ticket is already refunded' };
    }

    // If insurance was bought, attendee gets 100% back regardless of timeline (illness claim simulation)
    if (ticket.insuranceBought) {
      refundPercent = 100;
    } else {
      if (event.refundPolicy.type === 'full' && daysLeft >= event.refundPolicy.daysCutoff) {
        refundPercent = 100;
      } else if (event.refundPolicy.type === 'half' && daysLeft >= event.refundPolicy.daysCutoff) {
        refundPercent = 50;
      } else {
        return { success: false, message: 'Refund window has closed under event refund policy' };
      }
    }

    const refundAmount = Math.round(ticket.purchasePrice * (refundPercent / 100));

    // Process refund to buyer
    const buyer = this.users.find(u => u.id === ticket.purchaserId);
    if (buyer) {
      buyer.walletBalance += refundAmount;
    }

    // Decrement sold count
    const tier = event.ticketTiers.find(t => t.id === ticket.tierId);
    if (tier) tier.soldCount = Math.max(0, tier.soldCount - 1);

    // Adjust escrow
    const escrow = this.escrow.find(es => es.eventId === ticket.eventId);
    if (escrow && ticket.purchasePrice > 0) {
      escrow.totalGross -= refundAmount;
      escrow.platformFee -= Math.round(refundAmount * 0.1);
      escrow.netRevenue = escrow.totalGross - escrow.platformFee;
      escrow.amount = escrow.netRevenue;
    }

    ticket.status = 'refunded';
    this.save();

    return { success: true, message: `Refund processed! ₹${refundAmount} credited back to wallet.` };
  }

  // ----------------------------------------------------
  // P2P RESALE & WAITLIST SYSTEM
  // ----------------------------------------------------
  public listTicketForResale(ticketId: string): { success: boolean; message: string } {
    this.load();
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    const event = this.events.find(e => e.id === ticket.eventId);
    if (!event) return { success: false, message: 'Event not found' };

    // Must be up to 48 hours before event
    const hoursLeft = (new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft < 48) {
      return { success: false, message: 'Cannot list for resale within 48 hours of event start' };
    }

    if (ticket.status !== 'valid') {
      return { success: false, message: 'Only valid tickets can be resold' };
    }

    ticket.status = 'resale-pool';
    this.save();

    // Notify waitlisted users
    const nextWaitlist = this.waitlists.find(w => w.eventId === ticket.eventId && !w.notifiedAt);
    if (nextWaitlist) {
      nextWaitlist.notifiedAt = new Date().toISOString();
      nextWaitlist.holdExpiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15-minute hold

      this.addNotification(
        nextWaitlist.userId,
        'Resale Ticket Available!',
        `A resale ticket for "${event.title}" has opened up! You have a 15-minute hold to claim it.`,
        'resale_available'
      );
    }

    return { success: true, message: 'Ticket added to platform resale pool.' };
  }

  public purchaseResaleTicket(eventId: string, waitlistEntryId: string): { success: boolean; message: string } {
    this.load();
    const user = this.getActiveUser();
    const waitlist = this.waitlists.find(w => w.id === waitlistEntryId);
    if (!waitlist || waitlist.userId !== user.id) {
      return { success: false, message: 'Invalid or expired waitlist reservation' };
    }

    if (waitlist.holdExpiresAt && new Date(waitlist.holdExpiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Your 15-minute hold has expired' };
    }

    // Find ticket in resale pool
    const resalableTicket = this.tickets.find(t => t.eventId === eventId && t.status === 'resale-pool');
    if (!resalableTicket) {
      return { success: false, message: 'No tickets currently available in the resale pool' };
    }

    const originalBuyerId = resalableTicket.purchaserId;
    const faceValue = resalableTicket.purchasePrice;
    const resaleFee = Math.round(faceValue * 0.1); // Capped fee: 10%
    const totalBill = faceValue + resaleFee;

    if (user.walletBalance < totalBill) {
      return { success: false, message: `Insufficient wallet. Cost is ₹${totalBill}.` };
    }

    // Process Purchase
    user.walletBalance -= totalBill;

    // Refund original purchaser face value
    const originalBuyer = this.users.find(u => u.id === originalBuyerId);
    if (originalBuyer) {
      originalBuyer.walletBalance += faceValue;
      this.addNotification(
        originalBuyerId,
        'Resale Completed - Refunded',
        `Your ticket for "${resalableTicket.eventTitle}" was sold. ₹${faceValue} returned to wallet.`,
        'refund'
      );
    }

    // Transfer resale fee to admin
    const admin = this.users.find(u => u.id === 'user_admin');
    if (admin) {
      admin.walletBalance += resaleFee;
    }

    // Transfer ticket
    resalableTicket.purchaserId = user.id;
    resalableTicket.purchaserName = user.name;
    resalableTicket.purchaseDate = new Date().toISOString();
    resalableTicket.status = 'valid';
    resalableTicket.qrCode = `SPOTLIGHT-TKT-${eventId.toUpperCase()}-RESALE-${user.name.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Remove waitlist entry
    this.waitlists = this.waitlists.filter(w => w.id !== waitlistEntryId);

    this.save();
    return { success: true, message: 'Resale ticket purchased successfully!' };
  }

  public joinWaitlist(eventId: string): { success: boolean; message: string } {
    this.load();
    const user = this.getActiveUser();
    const event = this.getEvent(eventId);
    if (!event) return { success: false, message: 'Event not found' };

    // Check if already in waitlist
    const existing = this.waitlists.find(w => w.eventId === eventId && w.userId === user.id);
    if (existing) {
      return { success: false, message: 'You are already on the waitlist for this event' };
    }

    const entry: WaitlistEntry = {
      id: 'wait_' + Math.random().toString(36).substring(2, 9),
      eventId,
      userId: user.id,
      userName: user.name,
      email: user.email,
      joinedAt: new Date().toISOString()
    };

    this.waitlists.push(entry);
    this.save();
    return { success: true, message: 'Successfully joined the resale waitlist!' };
  }

  // ----------------------------------------------------
  // CHECK-IN SYSTEM
  // ----------------------------------------------------
  public checkInTicket(qrCode: string, gateLabel: string = 'Main Gate'): { success: boolean; message: string; ticket?: Ticket } {
    this.load();
    const ticket = this.tickets.find(t => t.qrCode === qrCode);
    if (!ticket) return { success: false, message: 'Invalid ticket (QR Code not recognized)' };

    if (ticket.status === 'checked-in') {
      return { success: false, message: `Ticket already scanned! Scanned on: ${new Date(ticket.checkInTime || '').toLocaleTimeString()}`, ticket };
    }

    if (ticket.status !== 'valid') {
      return { success: false, message: `Invalid ticket state: ${ticket.status}`, ticket };
    }

    ticket.status = 'checked-in';
    ticket.checkInTime = new Date().toISOString();
    ticket.gateLabel = gateLabel;
    this.save();

    return { success: true, message: `Welcome ${ticket.purchaserName}! Access granted to ${ticket.tierName}.`, ticket };
  }

  // ----------------------------------------------------
  // FRAUD CIRCUIT BREAKER & FLAG REPORTS
  // ----------------------------------------------------
  public reportEvent(eventId: string, reason: string): { success: boolean; message: string } {
    this.load();
    const user = this.getActiveUser();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    // ONLY checked-in attendees can report/flag (prevent fake pre-event flags)
    const hasCheckedIn = this.tickets.some(t => t.eventId === eventId && t.purchaserId === user.id && t.status === 'checked-in');
    if (!hasCheckedIn) {
      return { success: false, message: 'Fraud flags can only be submitted by verified checked-in attendees.' };
    }

    // Add flag
    const report: FlagReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      eventId,
      eventTitle: event.title,
      reporterId: user.id,
      reason,
      createdAt: new Date().toISOString()
    };
    this.reports.push(report);

    // Calculate flag threshold (10% of checked-in count)
    const checkedInCount = this.tickets.filter(t => t.eventId === eventId && t.status === 'checked-in').length;
    const flagCount = this.reports.filter(r => r.eventId === eventId).length;

    const threshold = Math.max(1, Math.ceil(checkedInCount * 0.1));

    if (flagCount >= threshold) {
      // FREEZE ESCROW PAYOUT
      const escrow = this.escrow.find(es => es.eventId === eventId);
      if (escrow && escrow.status !== 'frozen') {
        escrow.status = 'frozen';
        escrow.frozenReason = `Fraud Circuit Breaker tripped: ${flagCount} flags registered (${Math.round((flagCount / checkedInCount) * 100)}% of checked-in attendees).`;

        // Notify Creator
        this.addNotification(
          event.creatorId,
          'Payout Escrow Frozen',
          `Your payout for "${event.title}" was frozen due to attendee safety reports. Under admin review.`,
          'payout_frozen'
        );

        // Notify Admin
        this.addNotification(
          'user_admin',
          'Urgent: Payout Frozen',
          `Escrow payout for "${event.title}" automatically frozen. 10% threshold exceeded.`,
          'flagged_alert'
        );
      }
    }

    this.save();
    return { success: true, message: 'Issue flagged successfully. Security team notified.' };
  }

  // ----------------------------------------------------
  // ADMIN PAYOUT ACTIONS
  // ----------------------------------------------------
  public adminOverridePayout(eventId: string, release: boolean, _refundReason?: string) {
    this.load();
    const escrow = this.escrow.find(es => es.eventId === eventId);
    if (!escrow) return;

    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    if (release) {
      escrow.status = 'released';
      this.processSplitPayout(event, escrow.netRevenue);

      this.addNotification(
        event.creatorId,
        'Escrow Funds Released',
        `Admin released the frozen payout for "${event.title}". Wallet updated.`,
        'payout_released'
      );
    } else {
      // Withhold & refund everyone
      escrow.status = 'released'; // Payout ledger closed
      escrow.amount = 0;

      const ticketsToRefund = this.tickets.filter(t => t.eventId === eventId && t.status === 'checked-in');
      ticketsToRefund.forEach(tkt => {
        const buyer = this.users.find(u => u.id === tkt.purchaserId);
        if (buyer) {
          buyer.walletBalance += tkt.purchasePrice;
          this.addNotification(
            buyer.id,
            'Refund issued for safety concerns',
            `Admin has refunded your ticket to "${event.title}" following investigation of reports. ₹${tkt.purchasePrice} returned.`,
            'refund'
          );
        }
        tkt.status = 'refunded';
      });
    }

    this.save();
  }

  // Process revenue splits to wallets
  private processSplitPayout(event: Event, netRevenue: number) {
    // Platform fee already subtracted in netRevenue
    let remainingAmount = netRevenue;

    // Distribute platform fee to admin
    const escrow = this.escrow.find(es => es.eventId === event.id);
    const platformFee = escrow ? escrow.platformFee : 0;
    const admin = this.users.find(u => u.id === 'user_admin');
    if (admin && platformFee > 0) {
      admin.walletBalance += platformFee;
    }

    // Distribute to accepted collaborators
    event.collaborators.forEach(collab => {
      if (collab.status === 'accepted') {
        const share = Math.round(netRevenue * (collab.sharePercent / 100));
        const user = this.users.find(u => u.email === collab.email);
        if (user) {
          user.walletBalance += share;
          this.addNotification(
            user.id,
            'Payout Released',
            `Received split share (₹${share}) for event "${event.title}".`,
            'payout_released'
          );
        }
        remainingAmount -= share;
      }
    });

    // Remainder goes to creator
    const creator = this.users.find(u => u.id === event.creatorId);
    if (creator) {
      creator.walletBalance += remainingAmount;
    }
  }

  // ----------------------------------------------------
  // SOLO MODE CHAT
  // ----------------------------------------------------
  public getChatMessages(eventId: string): ChatMessage[] {
    this.load();
    return this.messages.filter(m => m.eventId === eventId);
  }

  public sendChatMessage(eventId: string, message: string) {
    this.load();
    const user = this.getActiveUser();
    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      eventId,
      userId: user.id,
      userName: user.name,
      message,
      timestamp: new Date().toISOString()
    };
    this.messages.push(newMsg);
    this.save();
  }

  public deleteChatMessage(msgId: string) {
    this.load();
    this.messages = this.messages.filter(m => m.id !== msgId);
    this.save();
  }

  // ----------------------------------------------------
  // NOTIFICATION INFRASTRUCTURE
  // ----------------------------------------------------
  public getNotifications(): AppNotification[] {
    this.load();
    const user = this.getActiveUser();
    return this.notifications.filter(n => n.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(userId: string, title: string, message: string, type: NotificationType) {
    const newNotif: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.push(newNotif);
    this.save();
  }

  public markNotificationsRead() {
    this.load();
    const user = this.getActiveUser();
    this.notifications.forEach(n => {
      if (n.userId === user.id) n.read = true;
    });
    this.save();
  }

  // ----------------------------------------------------
  // COLLABORATOR METHOD INVITES
  // ----------------------------------------------------
  public inviteCollaborator(eventId: string, email: string, percent: number): { success: boolean; message: string } {
    this.load();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    if (event.priceLocked) {
      return { success: false, message: 'Cannot add collaborators after ticket sales begin' };
    }

    const currentTotal = event.collaborators.reduce((sum, c) => sum + c.sharePercent, 0);
    if (currentTotal + percent > 100) {
      return { success: false, message: `Split exceeds 100%. Max remaining space: ${100 - currentTotal}%` };
    }

    const collab: CollaboratorSplit = {
      email,
      sharePercent: percent,
      status: 'pending'
    };
    event.collaborators.push(collab);
    this.save();

    // If user exists on platform, notify them
    const targetUser = this.users.find(u => u.email === email);
    if (targetUser) {
      this.addNotification(
        targetUser.id,
        'Collaborator Invitation',
        `You have been invited by ${event.creatorName} to co-organize "${event.title}" with a ${percent}% revenue split.`,
        'collaborator_invite'
      );
    }

    return { success: true, message: 'Invitation sent to ' + email };
  }

  public respondToCollaboratorInvite(eventId: string, accept: boolean): { success: boolean; message: string } {
    this.load();
    const user = this.getActiveUser();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Event not found' };

    const collab = event.collaborators.find(c => c.email === user.email);
    if (!collab) return { success: false, message: 'Invitation not found' };

    if (accept) {
      collab.status = 'accepted';
      this.addNotification(
        event.creatorId,
        'Collaborator Joined',
        `${user.name} accepted your co-organizer split invitation for "${event.title}".`,
        'collaborator_invite'
      );
    } else {
      event.collaborators = event.collaborators.filter(c => c.email !== user.email);
    }

    this.save();
    return { success: true, message: accept ? 'Invitation accepted!' : 'Invitation declined' };
  }

  // ----------------------------------------------------
  // PUBLIC FOLLOW MECHANICS
  // ----------------------------------------------------
  public toggleFollowCreator(creatorId: string): { following: boolean } {
    this.load();
    const user = this.getActiveUser();
    const creator = this.users.find(u => u.id === creatorId);
    if (!creator) return { following: false };

    const idx = user.followingCreators.indexOf(creatorId);
    let following = false;
    if (idx === -1) {
      user.followingCreators.push(creatorId);
      creator.followersCount += 1;
      following = true;
    } else {
      user.followingCreators.splice(idx, 1);
      creator.followersCount = Math.max(0, creator.followersCount - 1);
      following = false;
    }

    this.save();
    return { following };
  }

  // ----------------------------------------------------
  // VIBE CHECK CLIPS
  // ----------------------------------------------------
  public getClips(): VibeClip[] {
    this.load();
    return this.clips.filter(c => c.approvedByCreator);
  }

  public getPendingClips(creatorId: string): VibeClip[] {
    this.load();
    return this.clips.filter(c => c.creatorId === creatorId && !c.approvedByCreator);
  }

  public submitClip(videoUrl: string, caption: string, eventId?: string): { success: boolean } {
    this.load();
    const user = this.getActiveUser();
    let creatorId = user.id;
    let creatorName = user.name;
    let approved = true;

    // If attendee uploads a clip for a creator\'s event, it requires creator approval first
    if (eventId) {
      const event = this.getEvent(eventId);
      if (event) {
        creatorId = event.creatorId;
        creatorName = event.creatorName;
        approved = user.id === event.creatorId; // Auto-approved if creator uploads themselves
      }
    }

    // Convert youtube URL to embed format if paste link
    let finalUrl = videoUrl;
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const id = videoUrl.split('v=')[1]?.split('&')[0];
      finalUrl = `https://www.youtube.com/embed/${id}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const id = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      finalUrl = `https://www.youtube.com/embed/${id}`;
    }

    const newClip: VibeClip = {
      id: 'clip_' + Math.random().toString(36).substring(2, 9),
      eventId,
      creatorId,
      creatorName,
      videoUrl: finalUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=300',
      caption: caption + ` (Shared by ${user.name})`,
      likes: 0,
      likedByUserIds: [],
      approvedByCreator: approved
    };

    this.clips.push(newClip);
    this.save();

    if (!approved) {
      this.addNotification(
        creatorId,
        'New Clip Submitted for Approval',
        `${user.name} submitted a post-event clip for review. Approve it to show on your Vibe Check feed.`,
        'collaborator_invite'
      );
    }

    return { success: true };
  }

  public approveClip(clipId: string) {
    this.load();
    const clip = this.clips.find(c => c.id === clipId);
    if (clip) {
      clip.approvedByCreator = true;
      this.save();
    }
  }

  public deleteClip(clipId: string) {
    this.load();
    this.clips = this.clips.filter(c => c.id !== clipId);
    this.save();
  }

  public toggleLikeClip(clipId: string) {
    this.load();
    const clip = this.clips.find(c => c.id === clipId);
    const user = this.getActiveUser();
    if (!clip) return;

    const idx = clip.likedByUserIds.indexOf(user.id);
    if (idx === -1) {
      clip.likedByUserIds.push(user.id);
      clip.likes += 1;
    } else {
      clip.likedByUserIds.splice(idx, 1);
      clip.likes = Math.max(0, clip.likes - 1);
    }
    this.save();
  }

  // ----------------------------------------------------
  // REVIEWS & RATINGS
  // ----------------------------------------------------
  public addReview(eventId: string, rating: number, comment: string): { success: boolean; message: string } {
    this.load();
    const user = this.getActiveUser();
    const event = this.getEvent(eventId);
    if (!event) return { success: false, message: 'Event not found' };

    // Must have checked-in ticket to review
    const ticket = this.tickets.find(t => t.eventId === eventId && t.purchaserId === user.id && t.status === 'checked-in');
    if (!ticket) {
      return { success: false, message: 'Only checked-in attendees can review this event.' };
    }

    // Verify review window (opens at event end, closes 72h later)
    const eventEnd = new Date(event.endDate).getTime();
    const now = Date.now();
    const timeDiffHours = (now - eventEnd) / (1000 * 60 * 60);

    if (now < eventEnd) {
      return { success: false, message: 'Event has not ended yet' };
    }

    if (timeDiffHours > 72) {
      return { success: false, message: 'Review window has closed (72h post-event limit expired).' };
    }

    const review: Review = {
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      eventId,
      eventTitle: event.title,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    this.reviews.push(review);
    this.save();

    // Notify Creator
    this.addNotification(
      event.creatorId,
      'New Event Review',
      `${user.name} rated your event "${event.title}" ${rating} stars.`,
      'event_publish'
    );

    return { success: true, message: 'Review submitted successfully!' };
  }

  public getReviewsForEvent(eventId: string): Review[] {
    this.load();
    return this.reviews.filter(r => r.eventId === eventId);
  }

  public getReviewsForCreator(creatorId: string): Review[] {
    this.load();
    // Get all events by this creator
    const creatorEventIds = this.events.filter(e => e.creatorId === creatorId).map(e => e.id);
    return this.reviews.filter(r => creatorEventIds.includes(r.eventId));
  }

  public respondToReview(reviewId: string, response: string): { success: boolean } {
    this.load();
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.creatorResponse = response;
      this.save();
      return { success: true };
    }
    return { success: false };
  }

  // ----------------------------------------------------
  // AD STUDIO CAMPAIGNS
  // ----------------------------------------------------
  public getCampaigns(): AdCampaign[] {
    this.load();
    return this.campaigns;
  }

  public createCampaign(eventId: string, budget: number, radius: number, channels: string[]): AdCampaign {
    this.load();
    const event = this.getEvent(eventId);
    const newCamp: AdCampaign = {
      id: 'camp_' + Math.random().toString(36).substring(2, 9),
      eventId,
      eventTitle: event?.title || 'Unknown Event',
      budget,
      radius,
      channels,
      status: 'active',
      // Simulated reach formula
      impressions: Math.round(budget * (15 - radius / 5) * 1.5),
      clicks: Math.round(budget * 0.3),
      conversions: Math.round(budget * 0.005),
      createdAt: new Date().toISOString()
    };

    this.campaigns.push(newCamp);
    this.save();
    return newCamp;
  }

  // ----------------------------------------------------
  // VENUE BOOKING RESPONSES
  // ----------------------------------------------------
  public getBookingsForVenue(venueId: string): VenueBooking[] {
    this.load();
    return this.bookings.filter(b => b.venueId === venueId);
  }

  public getBookingForEvent(eventId: string): VenueBooking | undefined {
    this.load();
    return this.bookings.find(b => b.eventId === eventId);
  }

  public respondToBooking(bookingId: string, status: 'accepted' | 'declined' | 'countered', counterSplit?: number) {
    this.load();
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    booking.status = status;
    if (status === 'countered' && counterSplit) {
      booking.counterSplit = counterSplit;
    }

    const event = this.events.find(e => e.id === booking.eventId);
    if (event) {
      if (status === 'accepted') {
        // Lock collaborator split
        event.collaborators = event.collaborators.filter(c => c.email !== 'shreya@venue.app'); // Clear old
        event.collaborators.push({
          email: 'shreya@venue.app', // For demo shreya is the venue owner
          sharePercent: booking.proposedSplit,
          status: 'accepted'
        });
        
        // Block date in venue calendar
        const venue = this.users.find(u => u.id === booking.venueId);
        if (venue) {
          venue.venueBlockedDates = venue.venueBlockedDates || [];
          venue.venueBlockedDates.push(event.startDate);
        }
      } else if (status === 'countered' && counterSplit) {
        // Set split to countered value in proposal
        booking.proposedSplit = counterSplit;
      }
    }

    this.save();

    // Notify creator
    if (event) {
      this.addNotification(
        event.creatorId,
        'Venue Booking Response',
        `Venue owner updated booking for "${event.title}" to: ${status.toUpperCase()}.`,
        'booking_response'
      );
    }
  }

  // ----------------------------------------------------
  // ANALYTICS & ESCROW
  // ----------------------------------------------------
  public getEscrows(): EscrowEntry[] {
    this.load();
    return this.escrow;
  }

  public getTickets(): Ticket[] {
    this.load();
    return this.tickets;
  }
}

// Global Singleton for mock database
export const mockDb = new MockDatabase();
