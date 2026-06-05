import './testSetup';
import { mockDb, type User, type Ticket, type WaitlistEntry } from './mockDb';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✅ Passed: ${message}`);
  }
}

function assertThrows(fn: () => void, expectedMessagePart: string, message: string) {
  try {
    fn();
    console.error(`❌ Assertion Failed: Expected function to throw, but it succeeded. (${message})`);
    throw new Error(`Expected throw: ${message}`);
  } catch (err: unknown) {
    const e = err as Error & { message?: string };
    if (e.message && e.message.includes(expectedMessagePart)) {
      console.log(`  ✅ Passed (Expected Throw): ${message}`);
    } else {
      console.error(`❌ Assertion Failed: Expected error containing "${expectedMessagePart}", but got "${e ? e.message : e}" (${message})`);
      throw e;
    }
  }
}

async function runTests() {
  console.log('--- Starting Spotlight Database Tests ---');

  // Helper to get initial admin wallet balance
  const getAdminBalance = () => {
    return mockDb.getUser('user_admin')?.walletBalance || 0;
  };

  // 1. User registration and switching active roles
  console.log('\nTest Case 1: User Registration & Active Roles');
  mockDb.reset();
  const creatorUser = mockDb.registerUser('creator1@test.com', 'Test Creator 1', 'creator');
  assert(creatorUser.id.startsWith('user_'), 'Registered user ID should start with user_');
  assert(creatorUser.email === 'creator1@test.com', 'Email should match');
  assert(creatorUser.activeRole === 'creator', 'Active role should be creator');
  assert(creatorUser.walletBalance === 1000, 'Initial promo cash should be 1000');

  mockDb.setActiveUser(creatorUser.id);
  const activeUser = mockDb.getActiveUser();
  assert(activeUser.id === creatorUser.id, 'Active user ID should match registered user');

  mockDb.updateSessionUserRole('attendee');
  assert(mockDb.getSessionUserRole() === 'attendee', 'Should switch active role to attendee');


  // 2. Event creation, especially verification status filters
  console.log('\nTest Case 2: Event Creation & Verification status checks');
  mockDb.reset();
  
  // Register an unverified creator
  const unverified = mockDb.registerUser('unverified@test.com', 'Unverified Creator', 'creator');
  mockDb.setActiveUser(unverified.id);

  // Try creating an event with a paid tier
  const paidEventData = {
    title: 'Paid Comedy Gig',
    description: 'A paid gig',
    banner: 'image.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5] as [number, number],
    ticketTiers: [
      { id: 'tier_paid', name: 'General', price: 299, capacity: 50, soldCount: 0, description: 'Paid pass' }
    ],
    refundPolicy: { type: 'full' as const, daysCutoff: 3 },
    is18Plus: true,
    status: 'published' as const
  };

  assertThrows(
    () => mockDb.createEvent(paidEventData),
    'Unverified creators can only host free events.',
    'Unverified creators should not be allowed to create events with paid tiers'
  );

  // Creating a free event should succeed
  const freeEventData = {
    ...paidEventData,
    title: 'Free Comedy Jam',
    ticketTiers: [
      { id: 'tier_free', name: 'Free Pass', price: 0, capacity: 50, soldCount: 0, description: 'Free pass' }
    ]
  };
  const freeEvent = mockDb.createEvent(freeEventData);
  assert(freeEvent.id.startsWith('event_'), 'Free event should be created');

  // Verify updates: unverified creator trying to add a paid tier to a free event
  const updatedToPaid = {
    ...freeEvent,
    ticketTiers: [
      { id: 'tier_free', name: 'Free Pass', price: 0, capacity: 50, soldCount: 0, description: 'Free pass' },
      { id: 'tier_paid_addon', name: 'Paid Addon', price: 99, capacity: 10, soldCount: 0, description: 'Paid addon' }
    ]
  };

  assertThrows(
    () => mockDb.updateEvent(updatedToPaid),
    'Unverified creators can only host free events.',
    'Unverified creator should not be allowed to update event to contain paid tiers'
  );

  // Cycle verification tier to 'verified'
  unverified.isVerified = 'verified';
  mockDb.updateUser(unverified);

  // Paid event should now succeed
  const paidEvent = mockDb.createEvent(paidEventData);
  assert(paidEvent.id.startsWith('event_'), 'Verified creator should successfully create a paid event');


  // 3. Booking checkout, wallet balance deduction, platform fee calculation (10%), and escrow creation
  console.log('\nTest Case 3: Booking Checkout, Wallet Balance Deduction, Platform Fees, and Escrow Creation');
  mockDb.reset();
  
  // Setup Creator & Event
  const creator = mockDb.registerUser('creator@test.com', 'Creator', 'creator');
  creator.isVerified = 'verified';
  mockDb.updateUser(creator);
  mockDb.setActiveUser(creator.id);
  
  const event = mockDb.createEvent({
    title: 'Rock Concert',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Music',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_gen', name: 'General', price: 500, capacity: 100, soldCount: 0, description: 'Gen' }
    ],
    refundPolicy: { type: 'full', daysCutoff: 3 },
    is18Plus: false,
    status: 'published'
  });

  // Setup Attendee (Buyer)
  const attendee = mockDb.registerUser('attendee@test.com', 'Attendee', 'attendee');
  attendee.walletBalance = 5000;
  mockDb.updateUser(attendee);
  
  // Make active role attendee
  mockDb.setActiveUser(attendee.id);

  // Purchase tickets (quantity: 2, insurance: true)
  // Cost: Ticket: 2 * 500 = 1000, Platform Fee: 10% of 1000 = 100, Insurance: 2 * 49 = 98. Total: 1198.
  const purchaseResult = mockDb.purchaseTickets(event.id, 't_gen', 2, true);
  assert(purchaseResult.success, 'Tickets purchase should be successful');
  assert(purchaseResult.tickets?.length === 2, 'Should create 2 tickets');

  // Verify wallet balance deduction
  const updatedAttendee = mockDb.getUser(attendee.id)!;
  assert(updatedAttendee.walletBalance === 5000 - 1198, 'Attendee wallet should be deducted by ₹1198');

  // Verify escrow creation
  const escrows = mockDb.getEscrows();
  const escrow = escrows.find(es => es.eventId === event.id);
  assert(!!escrow, 'Escrow entry should exist for the event');
  assert(escrow?.totalGross === 1000, 'Escrow totalGross should be 1000');
  assert(escrow?.platformFee === 100, 'Escrow platformFee should be 100 (10%)');
  assert(escrow?.netRevenue === 900, 'Escrow netRevenue should be 900 (gross - platform fee)');
  assert(escrow?.amount === 900, 'Escrow amount should be 900');
  assert(escrow?.status === 'pending', 'Escrow status should be pending');


  // 4. Cancellation protection (₹49 insurance) refund vs standard policy cutoff refund
  console.log('\nTest Case 4: Cancellation Protection (Insurance) vs Standard Refund Policy Cutoff');
  
  // Case A: Refund with insurance (always 100% back)
  const tktWithInsurance = purchaseResult.tickets![0];
  const refundResA = mockDb.refundTicket(tktWithInsurance.id);
  assert(refundResA.success, 'Refund with insurance should succeed');
  
  // Buyer gets 100% of ticket face value (₹500)
  const attendeeAfterRefundA = mockDb.getUser(attendee.id)!;
  assert(attendeeAfterRefundA.walletBalance === (5000 - 1198) + 500, 'Attendee should get face value refund of ₹500');

  // Escrow adjust: gross reduced by 500, platform fee by 50, net revenue by 450
  const escrowA = mockDb.getEscrows().find(es => es.eventId === event.id)!;
  assert(escrowA.totalGross === 500, 'Escrow totalGross should adjust to 500');
  assert(escrowA.platformFee === 50, 'Escrow platformFee should adjust to 50');
  assert(escrowA.netRevenue === 450, 'Escrow netRevenue should adjust to 450');

  // Case B: Refund without insurance, within cutoff (refundable daysCutoff = 3, event in 5 days, so 5 > 3)
  // Purchase another ticket without insurance
  const purchaseResultB = mockDb.purchaseTickets(event.id, 't_gen', 1, false);
  assert(purchaseResultB.success, 'Should purchase another ticket');
  const tktNoInsurance = purchaseResultB.tickets![0];

  const refundResB = mockDb.refundTicket(tktNoInsurance.id);
  assert(refundResB.success, 'Refund within cutoff without insurance should succeed');

  // Case C: Refund without insurance, after cutoff (event date is set to 1 day from now, cutoff is 3 days)
  const purchaseResultC = mockDb.purchaseTickets(event.id, 't_gen', 1, false);
  assert(purchaseResultC.success, 'Purchase one more ticket');
  const tktAfterCutoff = purchaseResultC.tickets![0];

  // Fast forward time by altering event date to 1 day from now (now < 3 days cutoff)
  const eventInDb = mockDb.getEvent(event.id)!;
  eventInDb.startDate = new Date(Date.now() + 86400000 * 1).toISOString();
  mockDb.updateEvent(eventInDb);

  const refundResC = mockDb.refundTicket(tktAfterCutoff.id);
  assert(!refundResC.success, 'Refund after cutoff without insurance should fail');
  assert(refundResC.message.includes('Refund window has closed'), 'Should return correct cutoff policy closed message');


  // 5. Resale desk ticket listing (P2P resale pool), 15-minute waitlist holds, buyer purchase, and original seller refund
  console.log('\nTest Case 5: Resale Desk, Waitlist Holds, Buyer Purchase, and Seller Refund');
  mockDb.reset();

  const creatorR = mockDb.registerUser('creatorr@test.com', 'Creator R', 'creator');
  creatorR.isVerified = 'verified';
  mockDb.updateUser(creatorR);

  // Setup Event (at least 3 days / 72 hours away so hoursLeft >= 48 is satisfied)
  mockDb.setActiveUser(creatorR.id);
  const eventR = mockDb.createEvent({
    title: 'Sunset Acoustic Jam',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Music',
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 3 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_resale', name: 'General', price: 400, capacity: 2, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'full', daysCutoff: 1 },
    is18Plus: false,
    status: 'published'
  });

  // Buyer A buys ticket
  const buyerA = mockDb.registerUser('buyerA@test.com', 'Buyer A', 'attendee');
  buyerA.walletBalance = 1000;
  mockDb.updateUser(buyerA);

  mockDb.setActiveUser(buyerA.id);
  // Cost: Ticket: 400, Fee: 40, Total: 440
  const buyResA = mockDb.purchaseTickets(eventR.id, 't_resale', 1, false);
  assert(buyResA.success, 'Buyer A purchases ticket');
  const tktToResell = buyResA.tickets![0];

  // Buyer B joins waitlist (before Listing, so they can get notified immediately)
  const buyerB = mockDb.registerUser('buyerB@test.com', 'Buyer B', 'attendee');
  buyerB.walletBalance = 1000;
  mockDb.updateUser(buyerB);
  
  mockDb.setActiveUser(buyerB.id);
  const waitlistJoinRes = mockDb.joinWaitlist(eventR.id);
  assert(waitlistJoinRes.success, 'Buyer B joins waitlist');

  // Buyer A lists ticket for resale
  mockDb.setActiveUser(buyerA.id);
  const resaleListRes = mockDb.listTicketForResale(tktToResell.id);
  assert(resaleListRes.success, 'Buyer A lists ticket for resale');

  // Assert waitlist entry updated with notifiedAt and 15-minute hold
  mockDb.setActiveUser(buyerB.id);
  const waitlistEntries = JSON.parse(localStorage.getItem('spotlight_waitlists') || '[]');
  const entry = waitlistEntries.find((w: WaitlistEntry) => w.userId === buyerB.id);
  assert(!!entry.notifiedAt, 'Waitlist entry should be notified');
  assert(!!entry.holdExpiresAt, 'Waitlist entry should have holdExpiresAt set');

  // Buyer B purchases the resale ticket
  // Resale Cost: Face: 400, Resale Fee: 40, Total: 440
  const adminBalanceBefore = getAdminBalance();
  const buyResaleRes = mockDb.purchaseResaleTicket(eventR.id, entry.id);
  assert(buyResaleRes.success, 'Buyer B purchases resale ticket');

  // Verify Buyer B wallet: 1000 - 440 = 560
  const updatedBuyerB = mockDb.getUser(buyerB.id)!;
  assert(updatedBuyerB.walletBalance === 560, 'Buyer B wallet should be deducted by ₹440');

  // Verify Buyer A wallet: 1000 - 440 (original purchase) + 400 (resale refund) = 960
  const updatedBuyerA = mockDb.getUser(buyerA.id)!;
  assert(updatedBuyerA.walletBalance === 960, 'Buyer A wallet should get ₹400 face value back');

  // Verify Admin wallet: resale fee ₹40 credited
  const adminBalanceAfter = getAdminBalance();
  assert(adminBalanceAfter === adminBalanceBefore + 40, 'Admin wallet should be credited ₹40 resale fee');

  // Verify Ticket owner updated to Buyer B and status is valid
  const updatedTicket = mockDb.getTickets().find(t => t.id === tktToResell.id)!;
  assert(updatedTicket.purchaserId === buyerB.id, 'Ticket owner should be Buyer B');
  assert(updatedTicket.status === 'valid', 'Ticket status should return to valid');


  // 6. Check-in scanner logic, double-scanning prevention, and check-in times
  console.log('\nTest Case 6: Check-In Scanner, Double Scanning, Check-In Times');
  mockDb.reset();

  // Buyer purchases ticket
  const attendeeCheckIn = mockDb.registerUser('checkin@test.com', 'Attendee CI', 'attendee');
  attendeeCheckIn.walletBalance = 1000;
  mockDb.updateUser(attendeeCheckIn);
  mockDb.setActiveUser(attendeeCheckIn.id);

  // Setup Event & Purchase
  const creatorCI = mockDb.registerUser('creatorci@test.com', 'Creator CI', 'creator');
  creatorCI.isVerified = 'verified';
  mockDb.updateUser(creatorCI);
  mockDb.setActiveUser(creatorCI.id);

  const eventCI = mockDb.createEvent({
    title: 'Comedy Night',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_ci', name: 'General', price: 100, capacity: 5, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  mockDb.setActiveUser(attendeeCheckIn.id);
  const buyCI = mockDb.purchaseTickets(eventCI.id, 't_ci', 1, false);
  const tktCI = buyCI.tickets![0];

  // Scan ticket first time
  const scanRes1 = mockDb.checkInTicket(tktCI.qrCode, 'Gate B');
  assert(scanRes1.success, 'Scan should succeed first time');
  assert(scanRes1.ticket?.status === 'checked-in', 'Ticket should be checked-in');
  assert(!!scanRes1.ticket?.checkInTime, 'Check-in time should be recorded');
  assert(scanRes1.ticket?.gateLabel === 'Gate B', 'Gate label should be Gate B');

  // Scan ticket second time (Double scan prevention)
  const scanRes2 = mockDb.checkInTicket(tktCI.qrCode, 'Gate B');
  assert(!scanRes2.success, 'Scan should fail second time (double scan prevention)');
  assert(scanRes2.message.includes('already scanned'), 'Should return correct message');


  // 7. Fraud circuit breaker: Checked-in users flagging an event.
  console.log('\nTest Case 7: Fraud Circuit Breaker (Reports >= 10% of Checked-In Users)');
  mockDb.reset();

  const creatorCB = mockDb.registerUser('creatorcb@test.com', 'Creator CB', 'creator');
  creatorCB.isVerified = 'verified';
  mockDb.updateUser(creatorCB);
  mockDb.setActiveUser(creatorCB.id);

  const eventCB = mockDb.createEvent({
    title: 'Fraudulent Gig',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Music',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_cb', name: 'General', price: 200, capacity: 50, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  // Setup 15 buyers, check-in 14 of them. Keep 1 not checked-in.
  const cbAttendees: User[] = [];
  const cbTickets: Ticket[] = [];
  for (let i = 0; i < 15; i++) {
    const att = mockDb.registerUser(`cb_${i}@test.com`, `Attendee CB ${i}`, 'attendee');
    att.walletBalance = 1000;
    mockDb.updateUser(att);
    cbAttendees.push(att);

    mockDb.setActiveUser(att.id);
    const purchase = mockDb.purchaseTickets(eventCB.id, 't_cb', 1, false);
    cbTickets.push(purchase.tickets![0]);
  }

  // Check in 14 attendees
  for (let i = 0; i < 14; i++) {
    mockDb.checkInTicket(cbTickets[i].qrCode);
  }

  // Verify non-checked-in attendee cannot submit fraud flag
  mockDb.setActiveUser(cbAttendees[14].id);
  const flagResFail = mockDb.reportEvent(eventCB.id, 'Fake event');
  assert(!flagResFail.success, 'Non-checked-in attendee should not be allowed to report event');

  // Checked-in attendee submits report
  // Checked in count = 14. 10% of 14 is 1.4. Math.ceil(1.4) = 2.
  // 1 report should not trigger the freeze.
  mockDb.setActiveUser(cbAttendees[0].id);
  const reportRes1 = mockDb.reportEvent(eventCB.id, 'Unsafe environment');
  assert(reportRes1.success, 'First checked-in attendee report should succeed');
  
  const escrowCB1 = mockDb.getEscrows().find(es => es.eventId === eventCB.id)!;
  assert(escrowCB1.status === 'pending', 'Escrow should remain pending (1 flag / 14 checked-in = 7.1% < 10% threshold)');

  // 2nd report should trigger the freeze since 2 flags / 14 checked-in = 14.3% >= 10%.
  mockDb.setActiveUser(cbAttendees[1].id);
  const reportRes2 = mockDb.reportEvent(eventCB.id, 'Fake performance');
  assert(reportRes2.success, 'Second checked-in attendee report should succeed');

  const escrowCB2 = mockDb.getEscrows().find(es => es.eventId === eventCB.id)!;
  assert(escrowCB2.status === 'frozen', 'Escrow should trigger Fraud Circuit Breaker and freeze');
  assert(escrowCB2.frozenReason?.includes('Fraud Circuit Breaker tripped'), 'Should list frozen reason');


  // 8. Splits locking: Verify splits cannot be invited after ticket sales begin
  console.log('\nTest Case 8: Splits Locking After Ticket Sales Begin');
  mockDb.reset();

  const creatorSplits = mockDb.registerUser('creatorsp@test.com', 'Creator Splits', 'creator');
  creatorSplits.isVerified = 'verified';
  mockDb.updateUser(creatorSplits);
  mockDb.setActiveUser(creatorSplits.id);

  const eventSplits = mockDb.createEvent({
    title: 'Splits Show',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_sp', name: 'General', price: 100, capacity: 10, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  // Invite splits before ticket sales
  const inviteRes1 = mockDb.inviteCollaborator(eventSplits.id, 'collab@test.com', 20);
  assert(inviteRes1.success, 'Invite collaborator before sales should succeed');

  // Attendee purchases ticket (ticket sales begin, locking splits)
  const buyerSp = mockDb.registerUser('buyersp@test.com', 'Buyer Splits', 'attendee');
  buyerSp.walletBalance = 1000;
  mockDb.updateUser(buyerSp);
  
  mockDb.setActiveUser(buyerSp.id);
  const purchaseRes = mockDb.purchaseTickets(eventSplits.id, 't_sp', 1, false);
  assert(purchaseRes.success, 'Purchase tickets should succeed');

  // Creator tries to invite collaborator after ticket sales
  mockDb.setActiveUser(creatorSplits.id);
  const inviteRes2 = mockDb.inviteCollaborator(eventSplits.id, 'collab2@test.com', 10);
  assert(!inviteRes2.success, 'Invite collaborator after sales should fail');
  assert(inviteRes2.message.includes('Cannot add collaborators after ticket sales begin'), 'Should return locked message');


  // 9. Price locking: Verify price of ticket tiers cannot be updated after ticket sales begin
  console.log('\nTest Case 9: Price Locking After Ticket Sales Begin');
  mockDb.reset();

  const creatorPrice = mockDb.registerUser('creatorpr@test.com', 'Creator Price', 'creator');
  creatorPrice.isVerified = 'verified';
  mockDb.updateUser(creatorPrice);
  mockDb.setActiveUser(creatorPrice.id);

  const eventPrice = mockDb.createEvent({
    title: 'Price Lock Show',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_pr', name: 'General', price: 150, capacity: 10, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  // Purchase a ticket to lock prices
  const buyerPr = mockDb.registerUser('buyerpr@test.com', 'Buyer Price', 'attendee');
  buyerPr.walletBalance = 1000;
  mockDb.updateUser(buyerPr);
  
  mockDb.setActiveUser(buyerPr.id);
  mockDb.purchaseTickets(eventPrice.id, 't_pr', 1, false);

  // Update event with a new price of ₹250 for General tier
  mockDb.setActiveUser(creatorPrice.id);
  const updatedEvent = {
    ...eventPrice,
    priceLocked: true, // Set to true as ticket was sold
    ticketTiers: [
      { id: 't_pr', name: 'General', price: 250, capacity: 10, soldCount: 1, description: 'Pass' }
    ]
  };
  mockDb.updateEvent(updatedEvent);

  // Verify price remained at ₹150 (not updated to ₹250)
  const reloadedEvent = mockDb.getEvent(eventPrice.id)!;
  assert(reloadedEvent.ticketTiers[0].price === 150, 'Price of General tier should remain ₹150 (locked)');


  // 10. Reviews and rating windows (opens at event end, closed after 72 hours)
  console.log('\nTest Case 10: Reviews and Rating Windows');
  mockDb.reset();

  const creatorRvs = mockDb.registerUser('creatorrvs@test.com', 'Creator Reviews', 'creator');
  creatorRvs.isVerified = 'verified';
  mockDb.updateUser(creatorRvs);
  mockDb.setActiveUser(creatorRvs.id);

  const eventRvs = mockDb.createEvent({
    title: 'Review Windows Show',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_rvs', name: 'General', price: 100, capacity: 10, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  const buyerRvs = mockDb.registerUser('buyerrvs@test.com', 'Buyer Reviews', 'attendee');
  buyerRvs.walletBalance = 1000;
  mockDb.updateUser(buyerRvs);

  // Purchase & check-in
  mockDb.setActiveUser(buyerRvs.id);
  const buyRvs = mockDb.purchaseTickets(eventRvs.id, 't_rvs', 1, false);
  mockDb.checkInTicket(buyRvs.tickets![0].qrCode);

  // Try to submit review before event has ended
  const reviewRes1 = mockDb.addReview(eventRvs.id, 5, 'Awesome show!');
  assert(!reviewRes1.success, 'Review before event end should fail');
  assert(reviewRes1.message.includes('has not ended yet'), 'Should return correct event pending message');

  // Fast forward: Set event end in past (within 72 hours limit, e.g. 5 hours ago)
  mockDb.setActiveUser(creatorRvs.id);
  const endedEventWithin = mockDb.getEvent(eventRvs.id)!;
  endedEventWithin.endDate = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
  mockDb.updateEvent(endedEventWithin);

  mockDb.setActiveUser(buyerRvs.id);
  const reviewRes2 = mockDb.addReview(eventRvs.id, 4, 'Great performance!');
  assert(reviewRes2.success, 'Review within 72h limit should succeed');

  // Fast forward: Set event end further in past (exceeding 72 hours limit, e.g. 80 hours ago)
  mockDb.setActiveUser(creatorRvs.id);
  const endedEventPast = mockDb.getEvent(eventRvs.id)!;
  endedEventPast.endDate = new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString();
  mockDb.updateEvent(endedEventPast);

  mockDb.setActiveUser(buyerRvs.id);
  const reviewRes3 = mockDb.addReview(eventRvs.id, 1, 'Bad timing!');
  assert(!reviewRes3.success, 'Review after 72h limit should fail');
  assert(reviewRes3.message.includes('Review window has closed'), 'Should return correct window closed message');


  // 11. Admin overrides (releasing escrow vs. withholding and refunding checked-in users)
  console.log('\nTest Case 11: Admin Overrides (Release Escrow vs Withhold and Refund Guests)');
  
  // Setup Escrow & Split collaborator
  mockDb.reset();
  
  const creatorAO = mockDb.registerUser('creatorao@test.com', 'Creator AO', 'creator');
  creatorAO.isVerified = 'verified';
  creatorAO.walletBalance = 0;
  mockDb.updateUser(creatorAO);
  mockDb.setActiveUser(creatorAO.id);

  const eventAO = mockDb.createEvent({
    title: 'Admin Override Show',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_ao', name: 'General', price: 1000, capacity: 10, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  // Add collaborator
  const collabAO = mockDb.registerUser('collabao@test.com', 'Collab AO', 'creator');
  collabAO.walletBalance = 0;
  mockDb.updateUser(collabAO);
  mockDb.inviteCollaborator(eventAO.id, collabAO.email, 30); // 30% split
  
  // Collab accepts
  mockDb.setActiveUser(collabAO.id);
  mockDb.respondToCollaboratorInvite(eventAO.id, true);

  // Buyer purchases and checks in
  const buyerAO = mockDb.registerUser('buyerao@test.com', 'Buyer AO', 'attendee');
  buyerAO.walletBalance = 2000;
  mockDb.updateUser(buyerAO);

  mockDb.setActiveUser(buyerAO.id);
  // Cost: 1000 ticket + 100 platform fee = 1100
  const buyAO = mockDb.purchaseTickets(eventAO.id, 't_ao', 1, false);
  mockDb.checkInTicket(buyAO.tickets![0].qrCode);

  // Check Escrow values: totalGross = 1000, platformFee = 100, netRevenue = 900
  const escrowBefore = mockDb.getEscrows().find(es => es.eventId === eventAO.id)!;
  assert(escrowBefore.status === 'pending', 'Escrow should start in pending status');

  // Case A: Admin override payout RELEASE
  const adminAO = mockDb.getUser('user_admin')!;
  mockDb.setActiveUser(adminAO.id);
  
  const adminBalanceBeforeRelease = getAdminBalance();
  mockDb.adminOverridePayout(eventAO.id, true);

  // Assert Escrow released
  const escrowAfterRelease = mockDb.getEscrows().find(es => es.eventId === eventAO.id)!;
  assert(escrowAfterRelease.status === 'released', 'Escrow status should be released');

  // Collaborator: gets 30% of netRevenue (900 * 0.3 = 270)
  const updatedCollabAO = mockDb.getUser(collabAO.id)!;
  assert(updatedCollabAO.walletBalance === 270, 'Collaborator should receive 30% split share of ₹270');

  // Creator: gets remaining (900 - 270 = 630)
  const updatedCreatorAO = mockDb.getUser(creatorAO.id)!;
  assert(updatedCreatorAO.walletBalance === 630, 'Creator should receive remainder of ₹630');

  // Admin wallet: gets platform fee ₹100
  const adminBalanceAfterRelease = getAdminBalance();
  assert(adminBalanceAfterRelease === adminBalanceBeforeRelease + 100, 'Admin wallet should be credited ₹100 platform fee');

  // Case B: Admin override payout WITHHOLD & REFUND (set up another event)
  mockDb.setActiveUser(creatorAO.id);
  const eventAO2 = mockDb.createEvent({
    title: 'Admin Override Show 2',
    description: 'Gig',
    banner: 'banner.jpg',
    category: 'Comedy',
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    isMultiDay: false,
    coordinates: [12.9, 77.5],
    ticketTiers: [
      { id: 't_ao2', name: 'General', price: 1000, capacity: 10, soldCount: 0, description: 'Pass' }
    ],
    refundPolicy: { type: 'none', daysCutoff: 0 },
    is18Plus: false,
    status: 'published'
  });

  const buyerAO2 = mockDb.registerUser('buyerao2@test.com', 'Buyer AO 2', 'attendee');
  buyerAO2.walletBalance = 2000;
  mockDb.updateUser(buyerAO2);

  mockDb.setActiveUser(buyerAO2.id);
  const buyAO2 = mockDb.purchaseTickets(eventAO2.id, 't_ao2', 1, false);
  const ticketToRefund = buyAO2.tickets![0];
  mockDb.checkInTicket(ticketToRefund.qrCode);

  // Freeze the escrow first
  mockDb.setActiveUser(buyerAO2.id);
  mockDb.reportEvent(eventAO2.id, 'Fraudulent artist details');

  // Verify escrow frozen
  const escrowAO2 = mockDb.getEscrows().find(es => es.eventId === eventAO2.id)!;
  assert(escrowAO2.status === 'frozen', 'Escrow AO2 should be frozen');

  // Admin override withhold & refund
  mockDb.setActiveUser(adminAO.id);
  mockDb.adminOverridePayout(eventAO2.id, false);

  // Assert buyerAO2 refunded face value of ticket (₹1000)
  // Wallet: 2000 - 1100 (purchase) + 1000 (refund) = 1900
  const updatedBuyerAO2 = mockDb.getUser(buyerAO2.id)!;
  assert(updatedBuyerAO2.walletBalance === 1900, 'Buyer AO 2 wallet should receive ₹1000 refund');

  // Verify ticket status is refunded
  const refundedTicket = mockDb.getTickets().find(t => t.id === ticketToRefund.id)!;
  assert(refundedTicket.status === 'refunded', 'Ticket status should be refunded');

  // Verify escrow status is released and amount is 0
  const escrowAO2After = mockDb.getEscrows().find(es => es.eventId === eventAO2.id)!;
  assert(escrowAO2After.status === 'released', 'Escrow ledger should be closed (released)');
  assert(escrowAO2After.amount === 0, 'Escrow payout amount should be voided to 0');

  console.log('\n--- 🎉 All Spotlight Database Tests Passed Successfully! ---');
}

runTests().catch(e => {
  console.error('❌ Tests failed with error:', e);
  process.exit(1);
});
