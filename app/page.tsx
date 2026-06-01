'use client';

import Link from 'next/link';
import { useState } from 'react';

const airports = [
  { code: 'NZNE', label: 'Dairy Flat, Auckland' },
  { code: 'YSSY', label: 'Sydney, Australia' },
  { code: 'NZRO', label: 'Rotorua, New Zealand' },
  { code: 'NZGB', label: 'Great Barrier Island' },
  { code: 'NZCI', label: 'Chatham Islands' },
  { code: 'NZTL', label: 'Lake Tekapo' },
];

const routes = [
  { from: 'Dairy Flat', to: 'Sydney', code: 'NZNE → YSSY', dest: 'YSSY', frequency: 'Weekly prestige service', days: 'Friday outbound, Sunday return', aircraft: 'SyberJet SJ30i', seats: '6 seats', price: 'NZD $1,250', tag: 'Prestige' },
  { from: 'Dairy Flat', to: 'Rotorua', code: 'NZNE → NZRO', dest: 'NZRO', frequency: 'Weekday shuttle', days: 'Two services per weekday', aircraft: 'Cirrus SF50', seats: '4 seats', price: 'NZD $185', tag: 'Shuttle' },
  { from: 'Dairy Flat', to: 'Great Barrier Island', code: 'NZNE → NZGB', dest: 'NZGB', frequency: 'Island service', days: 'Monday, Wednesday, Friday', aircraft: 'Cirrus SF50', seats: '4 seats', price: 'NZD $220', tag: 'Island' },
  { from: 'Dairy Flat', to: 'Chatham Islands', code: 'NZNE → NZCI', dest: 'NZCI', frequency: 'Remote regional service', days: 'Tuesday and Friday outbound', aircraft: 'HondaJet Elite', seats: '5 seats', price: 'NZD $680', tag: 'Regional' },
  { from: 'Dairy Flat', to: 'Lake Tekapo', code: 'NZNE → NZTL', dest: 'NZTL', frequency: 'Scenic South Island service', days: 'Monday outbound, Tuesday return', aircraft: 'HondaJet Elite', seats: '5 seats', price: 'NZD $420', tag: 'Scenic' },
];

function todayStr() {
  const now = new Date();
  const nzDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  return nzDate;
}

function weekStr() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function HomePage() {
  const [tripType, setTripType] = useState<'oneway' | 'return'>('oneway');
  const [orig, setOrig] = useState('NZNE');
  const [dest, setDest] = useState('');
  const [date1, setDate1] = useState(todayStr());
  const [date2, setDate2] = useState(weekStr());

  function goToSearch() {
    if (!orig || !dest) {
      alert('Please select a destination.');
      return;
    }

    const qs = new URLSearchParams({
      orig,
      dest,
      date1,
      exact: 'true',
      tripType,
    });

    if (tripType === 'return') {
      qs.set('date2', date2);
    }

    // Hard navigation is the safest option for mobile local-network testing.
    window.location.assign(`/search?${qs.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    goToSearch();
  }

  return (
    <main className="bg-slate-50">
      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-container">
          <div className="hero-copy fade-up">
            <p className="hero-pill">Private regional airline from Dairy Flat</p>
            <h1 className="hero-title">Premium regional flights across New Zealand and Sydney.</h1>
            <p className="hero-subtitle">
              Search scheduled services, book available seats, receive an invoice, and manage your booking using a reference number.
            </p>
          </div>

          <div className="home-search-card fade-up delay-1">
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">Find your flight</h2>
              <p className="mt-1 text-sm text-slate-500">Select your route and travel date.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div className="trip-toggle mobile-touch-safe" role="radiogroup" aria-label="Trip type">
                <label className={tripType === 'oneway' ? 'trip-toggle-active' : 'trip-toggle-button'}>
                  <input
                    type="radio"
                    name="homeTripType"
                    value="oneway"
                    checked={tripType === 'oneway'}
                    onChange={() => setTripType('oneway')}
                    className="sr-only"
                  />
                  One-way
                </label>

                <label className={tripType === 'return' ? 'trip-toggle-active' : 'trip-toggle-button'}>
                  <input
                    type="radio"
                    name="homeTripType"
                    value="return"
                    checked={tripType === 'return'}
                    onChange={() => setTripType('return')}
                    className="sr-only"
                  />
                  Return
                </label>
              </div>

              <div className="form-card-field">
                <label>From</label>
                <select value={orig} onChange={(e) => setOrig(e.target.value)}>
                  {airports.map((a) => <option key={a.code} value={a.code}>{a.label} ({a.code})</option>)}
                </select>
              </div>

              <div className="form-card-field">
                <label>To</label>
                <select value={dest} onChange={(e) => setDest(e.target.value)} required>
                  <option value="">Select destination</option>
                  {airports.filter((a) => a.code !== orig).map((a) => <option key={a.code} value={a.code}>{a.label} ({a.code})</option>)}
                </select>
              </div>

              <div className="home-date-grid">
                <div className="form-card-field">
                  <label>Departure</label>
                  <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} required />
                </div>
                <div className={`form-card-field ${tripType === 'oneway' ? 'field-muted' : ''}`}>
                  <label>Return</label>
                  <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} disabled={tripType === 'oneway'} />
                </div>
              </div>

              <button
                type="submit"
                className="premium-primary-button w-full mobile-touch-safe"
              >
                Search Flights
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading-row fade-up">
          <div>
            <p className="section-eyebrow">Scheduled Routes</p>
            <h2 className="section-title">Where we fly</h2>
          </div>
          <Link href="/my-bookings" className="outline-link">Manage a booking</Link>
        </div>

        <div className="route-grid">
          {routes.map((route, index) => (
            <article key={route.code} className="route-card fade-up" style={{ animationDelay: `${index * 70}ms` }}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="route-tag">{route.tag}</span>
                <span className="text-xs font-bold text-slate-400">{route.code}</span>
              </div>
              <h3 className="text-base font-black tracking-tight text-slate-900">{route.from} to {route.to}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{route.frequency}. {route.days}.</p>
              <div className="route-info-box">
                <div><span>Aircraft</span><strong>{route.aircraft}</strong></div>
                <div><span>Capacity</span><strong>{route.seats}</strong></div>
                <div><span>From</span><strong className="text-[#0f4c81]">{route.price}</strong></div>
              </div>
              <Link href={`/search?orig=NZNE&dest=${route.dest}&exact=true`} className="route-button">View available flights</Link>
            </article>
          ))}
        </div>

        <div className="feature-grid fade-up">
          {[
            ['Instant booking', 'Book confirmed seats quickly'],
            ['No login needed', 'Use your booking reference'],
            ['Free cancellation', 'Cancel upcoming flights'],
            ['Boutique jet fleet', 'Small premium aircraft'],
          ].map(([title, text]) => (
            <div key={title} className="feature-card">
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
