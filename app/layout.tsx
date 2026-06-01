import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dairy Flat Air | Premium Regional Aviation',
  description:
    'Book flights from Dairy Flat Airport to Sydney, Rotorua, Great Barrier Island, Chatham Islands, and Lake Tekapo.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <div className="site-nav-inner">
            <Link href="/" scroll={true} className="site-brand" aria-label="Dairy Flat Air home">
              <span className="site-brand-mark">DF</span>
              <span className="site-brand-text">Dairy Flat Air</span>
            </Link>

            <div className="site-nav-links" aria-label="Main navigation">
              <Link href="/" scroll={true} className="site-nav-link">Home</Link>
              <Link href="/search" scroll={true} className="site-nav-link">
                <span className="hidden sm:inline">Search Flights</span>
                <span className="sm:hidden">Search</span>
              </Link>
              <Link href="/my-bookings" scroll={true} className="site-nav-link">
                <span className="hidden sm:inline">My Bookings</span>
                <span className="sm:hidden">Bookings</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="min-h-screen">{children}</main>

        <footer className="site-footer">
          <p className="font-semibold text-white">Dairy Flat Air Ltd</p>
          <p className="mt-1 text-sky-200/80">
            Operating from NZNE Dairy Flat Airport, Auckland · Assignment 2 booking system
          </p>
        </footer>
      </body>
    </html>
  );
}
