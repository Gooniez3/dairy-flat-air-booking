'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

// Airport information used when displaying invoice flight details.
const AIRPORTS: Record<string, { city: string; tz: string; tzLabel: string }> = {
  NZNE: { city: 'Dairy Flat, Auckland', tz: 'Pacific/Auckland', tzLabel: 'NZT' },
  YSSY: { city: 'Sydney, Australia', tz: 'Australia/Sydney', tzLabel: 'AEST' },
  NZRO: { city: 'Rotorua, NZ', tz: 'Pacific/Auckland', tzLabel: 'NZT' },
  NZCI: { city: 'Chatham Islands, NZ', tz: 'Pacific/Chatham', tzLabel: 'CHAST' },
  NZGB: { city: 'Great Barrier Island, NZ', tz: 'Pacific/Auckland', tzLabel: 'NZT' },
  NZTL: { city: 'Lake Tekapo, NZ', tz: 'Pacific/Auckland', tzLabel: 'NZT' },
};

// Aircraft codes mapped to their display names.
const AIRCRAFT: Record<string, string> = {
  SJ30i: 'SyberJet SJ30i',
  SF50_A: 'Cirrus SF50', SF50_B: 'Cirrus SF50',
  HJ_A: 'HondaJet Elite', HJ_B: 'HondaJet Elite',
};

// Format departure and arrival times using the airport timezone.
function fmtTime(d: string, ap: string) {
  return new Date(d).toLocaleTimeString('en-NZ', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: AIRPORTS[ap]?.tz || 'Pacific/Auckland',
  });
}

// Format the flight date shown on the invoice.
function fmtDate(d: string, ap: string) {
  return new Date(d).toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: AIRPORTS[ap]?.tz || 'Pacific/Auckland',
  });
}

interface SegProps {
  label: string; flight: string;
  orig: string; dest: string;
  dep: string; arr: string; aircraft: string;
}

// Reusable component used to display a flight segment.
function Segment({ label, flight, orig, dest, dep, arr, aircraft }: SegProps) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#0f4c81', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#0f4c81', borderRadius: '1px' }} />
        {label}
      </div>
      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', padding: '0.9rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.7rem', marginBottom: '0.65rem' }}>
          {/* Departure */}
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>{fmtTime(dep, orig)}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f4c81', marginTop: '0.25rem' }}>{orig}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{AIRPORTS[orig]?.city}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{AIRPORTS[orig]?.tzLabel}</div>
          </div>
          {/* Middle */}
          <div style={{ textAlign: 'center', padding: '0 1rem' }}>
            <div style={{ fontSize: '1.2rem', color: '#0f4c81', marginBottom: '0.25rem' }}>✈</div>
            <div style={{ width: '45px', height: '1px', background: '#e2e8f0', margin: '0 auto 0.25rem' }} />
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Direct</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem' }}>{AIRCRAFT[aircraft] || aircraft}</div>
          </div>
          {/* Arrival */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>{fmtTime(arr, dest)}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f4c81', marginTop: '0.25rem' }}>{dest}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{AIRPORTS[dest]?.city}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{AIRPORTS[dest]?.tzLabel}</div>
          </div>
        </div>
        {/* Date + flight bar */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>📅 {fmtDate(dep, orig)}</div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontFamily: 'monospace' }}>Flight {flight}</div>
        </div>
      </div>
    </div>
  );
}

// Read booking details from the URL and generate the invoice view.
function InvoiceContent() {
  const p = useSearchParams();

  const ref = p.get('ref');
  const outFlight = p.get('flight') || '';
  const outOrig = p.get('orig') || '';
  const outDest = p.get('dest') || '';
  const outDep = p.get('dep') || '';
  const outArr = p.get('arr') || '';
  const outAircraft = p.get('aircraft') || '';
  // Read outbound fare information from the booking parameters.
  const outPrice = Number(p.get('outPrice') || p.get('price') || 0);

  const retFlight = p.get('retFlight') || '';
  const retOrig = p.get('retOrig') || outDest;
  const retDest = p.get('retDest') || outOrig;
  const retDep = p.get('retDep') || '';
  const retArr = p.get('retArr') || '';
  const retAircraft = p.get('retAircraft') || '';
  const retPrice = Number(p.get('retPrice') || 0);
  const isReturn = !!(retFlight && retDep && retArr);

  const name = p.get('name') || '';
  const email = p.get('email') || '';
  // Calculate subtotal, GST, and final payment amount.
  const base = outPrice + retPrice;
  const gst = Math.round(base * 0.15);
  const total = base + gst;
  // Show a message when booking details are unavailable.
  if (!ref) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>No booking information found.</p>
        <Link href="/" style={{ background: '#0f4c81', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '0.625rem', textDecoration: 'none', fontWeight: 700 }}>Go Home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '1rem 1rem 2rem' }}>

      {/* Booking confirmation banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1f3c 0%, #0f4c81 55%, #1565c0 100%)',
        color: 'white', borderRadius: '1rem', padding: '1.5rem 1.25rem',
        textAlign: 'center', marginBottom: '1.75rem',
        boxShadow: '0 16px 48px rgba(15,76,129,0.4)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '2.1rem', marginBottom: '0.3rem' }}>✈</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
            Dairy Flat Air
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1rem', fontSize: '0.875rem' }}>
            {isReturn ? 'Your return trip is confirmed. Safe travels!' : 'Your flight is confirmed. Safe travels!'}
          </p>

          {/* Reference pill */}
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1.4rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' as const, marginBottom: '0.375rem' }}>
              Booking Reference
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.15em', fontFamily: 'monospace' }}>{ref}</div>
          </div>

          {/* Route pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', marginTop: '0.8rem', flexWrap: 'wrap' as const }}>
            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600 }}>
              ✈ {outOrig} → {outDest}
            </span>
            {isReturn && (
              <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                ↩ {retOrig} → {retDest}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main invoice information card */}
      <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginBottom: '0.9rem' }}>

        {/* Invoice header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem', paddingBottom: '0.9rem', borderBottom: '2px solid #f0f4f8' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f4c81' }}>✈ Dairy Flat Air</div>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>Official Booking Invoice</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{isReturn ? 'Return Trip' : 'One-way Flight'}</div>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
              {new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Passenger information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem', background: '#f8fafc', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f4c81, #1565c0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem', flexShrink: 0 }}>👤</div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.2rem' }}>Passenger</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>{name}</div>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{email}</div>
          </div>
        </div>

        {/* Display outbound and return flight details */}
        <Segment
          label={isReturn ? 'Outbound Flight' : 'Flight Details'}
          flight={outFlight} orig={outOrig} dest={outDest}
          dep={outDep} arr={outArr} aircraft={outAircraft}
        />
        {isReturn && retDep && (
          <Segment
            label="Return Flight"
            flight={retFlight} orig={retOrig} dest={retDest}
            dep={retDep} arr={retArr} aircraft={retAircraft}
          />
        )}

        {/* Fare and tax breakdown */}
        <div style={{ borderTop: '2px solid #f0f4f8', paddingTop: '0.9rem', marginTop: '0.25rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.55rem' }}>Price Breakdown</div>

          {isReturn ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem', color: '#475569' }}>
                <span>Outbound ({outOrig} → {outDest})</span><span>NZD ${outPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem', color: '#475569' }}>
                <span>Return ({retOrig} → {retDest})</span><span>NZD ${retPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem', color: '#475569', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                <span>Subtotal</span><span>NZD ${base.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem', color: '#475569' }}>
              <span>Base fare</span><span>NZD ${outPrice.toLocaleString()}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.7rem', fontSize: '0.9rem', color: '#475569' }}>
            <span>GST (15%)</span><span>NZD ${gst.toLocaleString()}</span>
          </div>

          {/* Final amount charged */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0f4c81, #1565c0)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white' }}>
            <span style={{ fontSize: '1.0625rem', fontWeight: 800 }}>Total Charged</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>NZD ${total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Invoice action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' }}>
        <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg, #0f4c81, #1565c0)', color: 'white', border: 'none', borderRadius: '0.625rem', padding: '0.65rem 1.1rem', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(15,76,129,0.3)' }}>
          🖨 Print / Save PDF
        </button>
        <Link href="/search" style={{ textDecoration: 'none', padding: '0.65rem 1.1rem', border: '2px solid #e2e8f0', borderRadius: '0.625rem', fontWeight: 700, color: '#0f4c81', background: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
          ✈ Search More Flights
        </Link>
        <Link href="/my-bookings" style={{ textDecoration: 'none', padding: '0.65rem 1.1rem', border: '2px solid #e2e8f0', borderRadius: '0.625rem', fontWeight: 700, color: '#475569', background: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
          🎫 My Bookings
        </Link>
      </div>

      {/* Reminder to save the booking reference */}
      <div style={{ background: '#f0f7ff', border: '1.5px solid #bfdbfe', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
        <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</div>
        <div>
          <div style={{ fontWeight: 800, color: '#1e3a5f', marginBottom: '0.15rem', fontSize: '0.9rem' }}>Save your booking reference</div>
          <div style={{ fontSize: '0.82rem', color: '#3b5f8a', lineHeight: 1.45 }}>
            Your PNR / booking reference is <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#0f4c81' }}>{ref}</strong>. You need this reference and your last name to view or cancel your booking in My Bookings.
          </div>
        </div>
      </div>


    </div>
  );
}

// Render the invoice page with a loading fallback.
export default function InvoicePage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <InvoiceContent />
    </Suspense>
  );
}