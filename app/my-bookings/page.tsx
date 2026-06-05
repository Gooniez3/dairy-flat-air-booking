'use client';

import { useState } from 'react';
import Link from 'next/link';

// Airport display names used in the booking cards.
const AIRPORTS: Record<string, { city: string; short: string }> = {
  NZNE: { city: 'Dairy Flat, Auckland', short: 'Dairy Flat' },
  YSSY: { city: 'Sydney, Australia', short: 'Sydney' },
  NZRO: { city: 'Rotorua, NZ', short: 'Rotorua' },
  NZCI: { city: 'Chatham Islands, NZ', short: 'Chatham Islands' },
  NZGB: { city: 'Great Barrier Island, NZ', short: 'Great Barrier Island' },
  NZTL: { city: 'Lake Tekapo, NZ', short: 'Lake Tekapo' },
};

// Aircraft codes mapped to readable aircraft names.
const AIRCRAFT: Record<string, string> = {
  SJ30i: 'SyberJet SJ30i',
  SF50_A: 'Cirrus SF50',
  SF50_B: 'Cirrus SF50',
  HJ_A: 'HondaJet Elite',
  HJ_B: 'HondaJet Elite',
};

// Timezone map used to display flight times correctly.
const TZ_MAP: Record<string, string> = {
  NZNE: 'Pacific/Auckland',
  YSSY: 'Australia/Sydney',
  NZRO: 'Pacific/Auckland',
  NZCI: 'Pacific/Chatham',
  NZGB: 'Pacific/Auckland',
  NZTL: 'Pacific/Auckland',
};

interface Booking {
  scheduleId: string;
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  bookingReference: string;
  passengerName: string;
  bookedAt: string;
  isPast: boolean;
}

// Format full date and time for each flight using the airport timezone.
function formatDateTime(dateStr: string, airport: string) {
  return new Date(dateStr).toLocaleString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: TZ_MAP[airport] || 'Pacific/Auckland',
  });
}

// Format the route time shown inside the booking card.
function formatTime(dateStr: string, airport: string) {
  return new Date(dateStr).toLocaleTimeString('en-NZ', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: TZ_MAP[airport] || 'Pacific/Auckland',
  });
}

// Card component used to show one booking result.
function BookingCard({ booking, onCancel, past = false }: {
  booking: Booking;
  onCancel?: (ref: string) => void;
  past?: boolean;
}) {
  return (
    <article className={`booking-card ${past ? 'booking-card-past' : ''}`}>
      <div className="booking-card-top">
        <div>
          <span>Booking Reference</span>
          <strong>{booking.bookingReference}</strong>
        </div>
        <em>{past ? 'Past Flight' : 'Upcoming Flight'}</em>
      </div>

      <div className="booking-card-body">
        <div className="booking-route-box">
          <div>
            <strong>{formatTime(booking.departureTime, booking.origin)}</strong>
            <span>{booking.origin}</span>
            <small>{AIRPORTS[booking.origin]?.short}</small>
          </div>
          <div className="booking-route-middle">
            <b>→</b>
            <span>Direct</span>
          </div>
          <div className="text-right">
            <strong>{formatTime(booking.arrivalTime, booking.destination)}</strong>
            <span>{booking.destination}</span>
            <small>{AIRPORTS[booking.destination]?.short}</small>
          </div>
        </div>

        <div className="booking-detail-grid">
          <div><span>Date</span><strong>{formatDateTime(booking.departureTime, booking.origin)}</strong></div>
          <div><span>Flight</span><strong>{booking.flightNumber} · {AIRCRAFT[booking.aircraft] || booking.aircraft}</strong></div>
          <div><span>Passenger</span><strong>{booking.passengerName}</strong></div>
        </div>

        <div className="booking-card-footer">
          <div><span>Fare Paid</span><strong>NZD ${booking.price.toLocaleString()}</strong></div>
          {!past && onCancel && <button type="button" onClick={() => onCancel(booking.bookingReference)}>Cancel Booking</button>}
        </div>
      </div>
    </article>
  );
}

export default function MyBookingsPage() {
  const [reference, setReference] = useState('');
  const [lastName, setLastName] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [cancelRef, setCancelRef] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Search for bookings using the reference number and passenger last name.
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSearched(true); setCancelMsg('');
    try {
      const res = await fetch(`/api/passengers?reference=${encodeURIComponent(reference.trim().toUpperCase())}&lastName=${encodeURIComponent(lastName.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking not found');
      setBookings(data);
    } catch (e) {
      setError(String(e)); setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // Cancel an upcoming booking by sending a delete request to the API.
  async function handleCancel(ref: string) {
    setCancelling(true); setCancelMsg('');
    try {
      const res = await fetch(`/api/bookings/${ref}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancel failed');
      setCancelMsg(`Booking ${ref} has been cancelled successfully.`);
      setCancelSuccess(true);
      setBookings(prev => prev.filter(b => b.bookingReference !== ref));
      setCancelRef(null);
    } catch (e) {
      setCancelMsg(`Error: ${e}`); setCancelSuccess(false);
    } finally {
      setCancelling(false);
    }
  }

  // Separate upcoming and past flights for clearer display.
  const upcoming = bookings.filter(b => !b.isPast);
  const past = bookings.filter(b => b.isPast);

  return (
    <div className="page-shell wide">
      <section className="booking-hero fade-up">
        <div className="booking-hero-copy">
          <p className="hero-pill small">Manage your trip</p>
          <h1>My Bookings</h1>
          <p>View your itinerary, check flight details, and cancel upcoming bookings using your booking reference and last name.</p>
        </div>

        {/* Booking lookup form */}
        <form onSubmit={handleSearch} className="booking-lookup-card">
          <label>Booking Reference<input type="text" value={reference} onChange={e => setReference(e.target.value.toUpperCase())} placeholder="e.g. DFAB1234" required className="pnr-input" /></label>
          <label>Last Name<input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Smith" required /></label>
          <button type="submit" disabled={loading} className="premium-primary-button w-full">{loading ? 'Searching...' : 'Find My Booking'}</button>
        </form>
      </section>

      {/* Short explanation cards for the booking management page */}
      <section className="booking-info-grid fade-up delay-1">
        <div><span>Easy Lookup</span><strong>Reference + last name</strong></div>
        <div><span>Manage</span><strong>Cancel upcoming flights</strong></div>
        <div><span>Need a flight?</span><Link href="/search">Search more flights</Link></div>
      </section>

      {error && <div className="notice-box notice-error">{error}</div>}
      {cancelMsg && <div className={`notice-box ${cancelSuccess ? 'notice-success' : 'notice-error'}`}>{cancelMsg}</div>}

      {searched && !loading && !error && bookings.length === 0 && (
        <div className="empty-state"><strong>No bookings found</strong><span>Check your booking reference and last name, then try again.</span></div>
      )}

      {/* Upcoming and past booking lists */}
      {upcoming.length > 0 && <section className="bookings-list"><h2>Upcoming Flights</h2>{upcoming.map(b => <BookingCard key={b.bookingReference} booking={b} onCancel={setCancelRef} />)}</section>}
      {past.length > 0 && <section className="bookings-list"><h2 className="muted">Past Flights</h2>{past.map(b => <BookingCard key={b.bookingReference} booking={b} past />)}</section>}

      {/* Confirmation modal before cancelling a booking */}
      {cancelRef && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setCancelRef(null)}>
          <div className="cancel-modal">
            <div className="cancel-icon">!</div>
            <h2>Cancel Booking?</h2>
            <p>Are you sure you want to cancel this booking?</p>
            <strong>{cancelRef}</strong>
            <span>This action cannot be undone.</span>
            <div className="cancel-actions">
              <button type="button" onClick={() => setCancelRef(null)}>Keep Booking</button>
              <button type="button" onClick={() => handleCancel(cancelRef)} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}