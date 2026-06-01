'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

const AIRPORTS: Record<string, { name: string; city: string; timezone: string }> = {
  NZNE: { name: 'Dairy Flat Airport', city: 'Dairy Flat, Auckland', timezone: 'NZT (GMT+12)' },
  YSSY: { name: 'Sydney Airport', city: 'Sydney, Australia', timezone: 'AEST (GMT+10)' },
  NZRO: { name: 'Rotorua Airport', city: 'Rotorua, NZ', timezone: 'NZT (GMT+12)' },
  NZCI: { name: 'Tuuta Airport', city: 'Chatham Islands, NZ', timezone: 'CHAST (GMT+12:45)' },
  NZGB: { name: 'Claris Airport', city: 'Great Barrier Island, NZ', timezone: 'NZT (GMT+12)' },
  NZTL: { name: 'Lake Tekapo Airport', city: 'Lake Tekapo, NZ', timezone: 'NZT (GMT+12)' },
};

const AIRCRAFT: Record<string, string> = {
  SJ30i: 'SyberJet SJ30i',
  SF50_A: 'Cirrus SF50',
  SF50_B: 'Cirrus SF50',
  HJ_A: 'HondaJet Elite',
  HJ_B: 'HondaJet Elite',
};

const TZ_MAP: Record<string, string> = {
  NZNE: 'Pacific/Auckland',
  YSSY: 'Australia/Sydney',
  NZRO: 'Pacific/Auckland',
  NZCI: 'Pacific/Chatham',
  NZGB: 'Pacific/Auckland',
  NZTL: 'Pacific/Auckland',
};

interface Flight {
  _id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  capacity: number;
  seatsAvailable: number;
}

interface SearchResult {
  exactMatch: boolean;
  flights: Flight[];
  nearestBefore: Flight[];
  nearestAfter: Flight[];
}

function formatTime(dateStr: string, airport: string) {
  return new Date(dateStr).toLocaleTimeString('en-NZ', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: TZ_MAP[airport] || 'Pacific/Auckland',
  });
}

function formatDate(dateStr: string, airport?: string) {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: airport ? TZ_MAP[airport] || 'Pacific/Auckland' : 'Pacific/Auckland',
  });
}

function formatDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function todayNZStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isToday(date: string) {
  return date === todayNZStr();
}

function SeatBadge({ available, capacity }: { available: number; capacity: number }) {
  if (available === 0) return <span className="seat-badge seat-full">FULL</span>;
  if (available <= Math.ceil(capacity / 2)) return <span className="seat-badge seat-low">{available} SEAT{available !== 1 ? 'S' : ''} LEFT</span>;
  return <span className="seat-badge seat-ok">{available} SEATS AVAILABLE</span>;
}

function FlightCard({ flight, onSelect, selected, dim }: {
  flight: Flight; onSelect: () => void; selected: boolean; dim?: boolean;
}) {
  const isFull = flight.seatsAvailable === 0;
  return (
    <button
      type="button"
      onClick={() => !isFull && onSelect()}
      disabled={isFull}
      className={`flight-result-card mobile-touch-safe ${selected ? 'flight-selected' : ''} ${dim ? 'flight-dim' : ''}`}
    >
      {selected && <span className="selected-pill">Selected</span>}

      <div className="flight-times-block">
        <div className="flight-time-point">
          <strong>{formatTime(flight.departureTime, flight.origin)}</strong>
          <span className="airport-code">{flight.origin}</span>
          <span className="timezone-label">{AIRPORTS[flight.origin]?.timezone}</span>
        </div>

        <div className="flight-line-block">
          <span>{formatDuration(flight.durationMinutes)}</span>
          <div className="flight-line"><i /> <b>→</b> <i /></div>
          <small>Direct</small>
        </div>

        <div className="flight-time-point flight-arrival">
          <strong>{formatTime(flight.arrivalTime, flight.destination)}</strong>
          <span className="airport-code">{flight.destination}</span>
          <span className="timezone-label">{AIRPORTS[flight.destination]?.timezone}</span>
        </div>
      </div>

      <div className="flight-meta-block">
        <div>
          <strong>{AIRCRAFT[flight.aircraft] || flight.aircraft}</strong>
          <span>Flight {flight.flightNumber}</span>
          <span>{formatDate(flight.departureTime, flight.origin)}</span>
        </div>
        <div className="flight-price-block">
          <strong>NZD ${flight.price.toLocaleString()}</strong>
          <span>per person</span>
          <SeatBadge available={flight.seatsAvailable} capacity={flight.capacity} />
        </div>
      </div>
    </button>
  );
}

function NoFlightOnDate({ date, origin, destination, nearest, onSelect, selectedFlight, showEarlier = true }: {
  date: string; origin: string; destination: string;
  nearest: { before: Flight[]; after: Flight[] }; onSelect: (f: Flight) => void;
  selectedFlight?: Flight | null;
  showEarlier?: boolean;
}) {
  const dateFormatted = new Date(date + 'T12:00:00Z').toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <div>
      <div className="notice-box notice-warning">
        <strong>No flights on {dateFormatted}</strong>
        <span>No scheduled flights from {AIRPORTS[origin]?.city} to {AIRPORTS[destination]?.city} on this date.</span>
      </div>

      {showEarlier && !isToday(date) && nearest.before.length > 0 && (
        <div className="result-group">
          <h3>Earlier Available Flights</h3>
          <div className="result-list">
            {nearest.before.map(f => <FlightCard key={f._id} flight={f} selected={selectedFlight?._id === f._id} onSelect={() => onSelect(f)} dim />)}
          </div>
        </div>
      )}

      {nearest.after.length > 0 && (
        <div className="result-group">
          <h3>Next Available Flights</h3>
          <div className="result-list">
            {nearest.after.map(f => <FlightCard key={f._id} flight={f} selected={selectedFlight?._id === f._id} onSelect={() => onSelect(f)} dim />)}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingModal({ outbound, returnFlight, onClose, onConfirm }: {
  outbound: Flight; returnFlight: Flight | null; onClose: () => void;
  onConfirm: (form: { title: string; firstName: string; lastName: string; email: string }) => void;
}) {
  const [form, setForm] = useState({ title: 'Mr', firstName: '', lastName: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const totalPrice = outbound.price + (returnFlight?.price || 0);
  const gst = Math.round(totalPrice * 0.15);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try { await onConfirm(form); }
    catch (err) { setError(String(err)); setLoading(false); }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="booking-modal">
        <div className="modal-header">
          <div>
            <h2>Complete Booking</h2>
            <p>Enter passenger details to confirm</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close booking modal">×</button>
        </div>

        <div className="modal-summary">
          <p className="modal-summary-title">{returnFlight ? 'Return Trip' : 'Flight Summary'}</p>
          <div className="summary-row">
            <div><strong>{outbound.origin} → {outbound.destination}</strong><span>{formatDate(outbound.departureTime, outbound.origin)} · {formatTime(outbound.departureTime, outbound.origin)}</span><small>Flight {outbound.flightNumber}</small></div>
            <strong>NZD ${outbound.price.toLocaleString()}</strong>
          </div>
          {returnFlight && <div className="summary-row summary-border"><div><strong>{returnFlight.origin} → {returnFlight.destination}</strong><span>{formatDate(returnFlight.departureTime, returnFlight.origin)} · {formatTime(returnFlight.departureTime, returnFlight.origin)}</span><small>Flight {returnFlight.flightNumber}</small></div><strong>NZD ${returnFlight.price.toLocaleString()}</strong></div>}
          <div className="summary-total"><span>GST (15%)</span><span>NZD ${gst.toLocaleString()}</span></div>
          <div className="summary-total final"><span>Total</span><span>NZD ${(totalPrice + gst).toLocaleString()}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>Title<select value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}>{['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'].map(t => <option key={t}>{t}</option>)}</select></label>
          <div className="modal-name-grid">
            <label>First Name<input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required placeholder="Jane" /></label>
            <label>Last Name<input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required placeholder="Smith" /></label>
          </div>
          <label>Email Address<input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="jane@example.com" /></label>
          {error && <div className="notice-box notice-error compact">{error}</div>}
          <button type="submit" disabled={loading} className="premium-primary-button w-full">{loading ? 'Booking...' : `Confirm Booking · NZD $${(totalPrice + gst).toLocaleString()}`}</button>
        </form>
      </div>
    </div>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [tripType, setTripType] = useState<'oneway' | 'return'>(params.get('tripType') === 'return' ? 'return' : 'oneway');
  const [orig, setOrig] = useState(params.get('orig') || 'NZNE');
  const [dest, setDest] = useState(params.get('dest') || '');
  const [date1, setDate1] = useState(params.get('date1') || todayNZStr());
  const [date2, setDate2] = useState(params.get('date2') || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  })());
  const [outboundResult, setOutboundResult] = useState<SearchResult | null>(null);
  const [returnResult, setReturnResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Flight | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (params.get('orig') && params.get('dest')) {
      doSearch(params.get('orig')!, params.get('dest')!, params.get('date1') || date1, params.get('date2') || date2, params.get('tripType') === 'return' ? 'return' : tripType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(o: string, d: string, d1: string, d2: string, type: 'oneway' | 'return' = tripType) {
    if (!o || !d || !d1) return;
    setLoading(true); setError(''); setSearched(true);
    setSelectedOutbound(null); setSelectedReturn(null); setShowModal(false);
    try {
      const res = await fetch(`/api/schedules?orig=${o}&dest=${d}&date1=${d1}&exact=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      if (isToday(d1)) data.nearestBefore = [];
      setOutboundResult(data);

      if (type === 'return' && d2) {
        const res2 = await fetch(`/api/schedules?orig=${d}&dest=${o}&date1=${d2}&exact=true`);
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.error || 'Return search failed');
        if (isToday(d2)) data2.nearestBefore = [];
        setReturnResult(data2);
      } else {
        setReturnResult(null);
      }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(orig, dest, date1, date2, tripType);
  }

  async function handleConfirmBooking(form: { title: string; firstName: string; lastName: string; email: string }) {
    if (!selectedOutbound) return;
    const passengerName = `${form.title} ${form.firstName} ${form.lastName}`;
    const payload = { scheduleId: selectedOutbound._id, firstName: form.firstName, lastName: form.lastName, title: form.title, email: form.email, passengerName };
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');

    let retData = null;
    if (selectedReturn) {
      const res2 = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, scheduleId: selectedReturn._id }) });
      retData = await res2.json();
      if (!res2.ok) throw new Error(retData.error || 'Return booking failed');
    }

    const qs = new URLSearchParams({ ref: data.bookingReference, flight: data.flightNumber, orig: selectedOutbound.origin, dest: selectedOutbound.destination, dep: selectedOutbound.departureTime, arr: selectedOutbound.arrivalTime, outPrice: String(selectedOutbound.price), aircraft: selectedOutbound.aircraft, name: passengerName, email: form.email });
    if (retData && selectedReturn) {
      qs.set('retFlight', retData.flightNumber);
      qs.set('retOrig', selectedReturn.origin);
      qs.set('retDest', selectedReturn.destination);
      qs.set('retDep', selectedReturn.departureTime);
      qs.set('retArr', selectedReturn.arrivalTime);
      qs.set('retAircraft', selectedReturn.aircraft);
      qs.set('retPrice', String(selectedReturn.price));
    }
    router.push(`/invoice?${qs.toString()}`);
  }

  const canBook = selectedOutbound && (tripType === 'oneway' || selectedReturn);

  return (
    <div className="page-shell">
      <div className="page-header fade-up">
        <p className="section-eyebrow">Flight Search</p>
        <h1>Search Flights</h1>
      </div>

      <div className="search-panel fade-up delay-1">
        <div className="trip-toggle mb-4 mobile-touch-safe" role="radiogroup" aria-label="Trip type">
          <label className={tripType === 'oneway' ? 'trip-toggle-active' : 'trip-toggle-button'}>
            <input
              type="radio"
              name="searchTripType"
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
              name="searchTripType"
              value="return"
              checked={tripType === 'return'}
              onChange={() => setTripType('return')}
              className="sr-only"
            />
            Return
          </label>
        </div>

        <form onSubmit={handleSearch}>
          <div className="search-route-grid">
            <div className="form-card-field"><label>From</label><select value={orig} onChange={e => setOrig(e.target.value)} required>{Object.entries(AIRPORTS).map(([k, v]) => <option key={k} value={k}>{v.city} ({k})</option>)}</select></div>
            <button type="button" className="swap-button" onClick={() => { const t = orig; setOrig(dest); setDest(t); }}>⇄</button>
            <div className="form-card-field"><label>To</label><select value={dest} onChange={e => setDest(e.target.value)} required><option value="">Select destination</option>{Object.entries(AIRPORTS).filter(([k]) => k !== orig).map(([k, v]) => <option key={k} value={k}>{v.city} ({k})</option>)}</select></div>
          </div>

          <div className="search-date-grid">
            <div className="form-card-field"><label>Departure Date</label><input type="date" value={date1} onChange={e => setDate1(e.target.value)} required /></div>
            {tripType === 'return' && <div className="form-card-field"><label>Return Date</label><input type="date" value={date2} onChange={e => setDate2(e.target.value)} required /></div>}
            <button
              type="button"
              disabled={loading}
              onClick={() => doSearch(orig, dest, date1, date2, tripType)}
              className="premium-primary-button search-submit mobile-touch-safe"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="notice-box notice-error">{error}</div>}
      {loading && <div className="loading-box">Searching flights...</div>}

      {searched && !loading && outboundResult && <div className="result-section fade-up">
        {tripType === 'return' && <div className="segment-heading"><span>Outbound</span><strong>{orig} → {dest}</strong>{selectedOutbound && <em>Selected</em>}</div>}
        {outboundResult.exactMatch && outboundResult.flights.length > 0 ? <div className="result-list">{outboundResult.flights.map(f => <FlightCard key={f._id} flight={f} selected={selectedOutbound?._id === f._id} onSelect={() => setSelectedOutbound(f)} />)}</div> : <NoFlightOnDate date={date1} origin={orig} destination={dest} nearest={{ before: [], after: outboundResult.nearestAfter }} selectedFlight={selectedOutbound} showEarlier={false} onSelect={f => setSelectedOutbound(f)} />}
      </div>}

      {searched && !loading && tripType === 'return' && returnResult && <div className="result-section fade-up">
        <div className="segment-heading return"><span>Return</span><strong>{dest} → {orig}</strong>{selectedReturn && <em>Selected</em>}</div>
        {returnResult.exactMatch && returnResult.flights.length > 0 ? <div className="result-list">{returnResult.flights.map(f => <FlightCard key={f._id} flight={f} selected={selectedReturn?._id === f._id} onSelect={() => setSelectedReturn(f)} />)}</div> : <NoFlightOnDate date={date2} origin={dest} destination={orig} nearest={{ before: returnResult.nearestBefore, after: returnResult.nearestAfter }} selectedFlight={selectedReturn} showEarlier={true} onSelect={f => setSelectedReturn(f)} />}
      </div>}

      {searched && !loading && selectedOutbound && <div className="sticky-book-bar">
        <div>
          <strong>{selectedOutbound.origin} → {selectedOutbound.destination}{selectedReturn && ` · ${selectedReturn.origin} → ${selectedReturn.destination}`}</strong>
          <span>{tripType === 'return' && !selectedReturn ? 'Please also select a return flight above' : `NZD $${(selectedOutbound.price + (selectedReturn?.price || 0)).toLocaleString()} + GST`}</span>
        </div>
        <button type="button" onClick={() => canBook && setShowModal(true)} disabled={!canBook} className="premium-primary-button mobile-touch-safe">Book Now</button>
      </div>}

      {showModal && selectedOutbound && <BookingModal outbound={selectedOutbound} returnFlight={selectedReturn} onClose={() => setShowModal(false)} onConfirm={handleConfirmBooking} />}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="loading-box">Loading...</div>}><SearchContent /></Suspense>;
}
