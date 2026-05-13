import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';


const Footer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const [mapKey, setMapKey] = useState(0);
  const [mapSrc, setMapSrc] = useState(
    'https://www.google.com/maps?q=Kathmandu,Nepal&output=embed'
  );
  const [userLocationLabel, setUserLocationLabel] = useState('Detecting location...');

// Function to handle newsletter subscription
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !user?.email) {
      setMessage('Please login first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error: subscribeError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          user_id: user.id,
          email: user.email,
        },
      ]);

    if (subscribeError) {
      const errorMessage = subscribeError.message.toLowerCase();

      if (
        errorMessage.includes('duplicate') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('already')
      ) {
        setMessage('You are already subscribed.');
      } else {
        setMessage('Subscription failed. Please try again.');
      }
    } else {
      setMessage('Subscribed successfully.');
    }

    setLoading(false);
  };

  // Function to get user's current location and update the map
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setUserLocationLabel('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const newMapSrc = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;

        setMapSrc(newMapSrc);
        setUserLocationLabel(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        setMapKey((prev) => prev + 1);
      },
      (error) => {
        console.error('Location error:', error);
        setUserLocationLabel('Location access denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-slate-950 text-white">
      {/* background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_30%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* top section */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* brand */}
          <div className="xl:pr-6">
            <h2 className="bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              NepSky ✈️
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              International Air Ticketing System. Travel smarter, faster, and safer
              with a premium booking experience.
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <a
                href="https://wa.me/97798245939042"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition duration-300 hover:border-green-400/40 hover:bg-green-500/10 hover:text-green-300"
              >
                <span className="text-base transition group-hover:scale-110">📞</span>
                <span className="break-all">98245939042</span>
              </a>

              <a
                href="mailto:nepsky24.7@gmail.com"
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition duration-300 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-300"
              >
                <span className="text-base transition group-hover:scale-110">📧</span>
                <span className="break-all">nepsky24.7@gmail.com</span>
              </a>
            </div>
          </div>

          {/* company */}
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">Company</h3>
            <ul className="mt-5 space-y-3">
              {['About Us', 'Services', 'Careers', 'Press'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-flex text-sm text-slate-300 transition duration-300 hover:translate-x-1 hover:text-blue-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* support */}
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">Support</h3>
            <ul className="mt-5 space-y-3">
              {['Help Center', 'Contact', 'Booking Guide', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="inline-flex text-sm text-slate-300 transition duration-300 hover:translate-x-1 hover:text-violet-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* subscribe */}
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">Subscribe</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Get the latest flight deals, offers, and system updates directly to
              your account email.
            </p>

            <form onSubmit={handleSubscribe} className="mt-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Account Email
                </p>

                <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                  <p className="break-all text-sm font-medium text-white">
                    {user?.email || 'Login required'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !user}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>

              {message && (
                <p
                  className={`mt-3 rounded-lg border px-3 py-2 text-sm ${message.toLowerCase().includes('success')
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : message.toLowerCase().includes('already')
                      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* map section */}
        <div className="mt-14">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Our Location</h3>
              <p className="mt-1 text-sm text-slate-400">{userLocationLabel}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
            {/* Location badge */}
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-red-400/30 bg-slate-950/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md sm:right-6">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </span>
              Current Location
            </div>

            {/* Re-center button */}
            <button
              type="button"
              onClick={getUserLocation}
              className="absolute top-16 right-4 z-10 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-violet-500"
            >
              🎯 Re-center
            </button>

            <iframe
              key={mapKey}
              title="NepSky Location"
              src={mapSrc}
              width="100%"
              height="340"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />

            {/* Center pin icon */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-xl ring-4 ring-white/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351a.75.75 0 0 0 .92 0c1.098-.829 5.04-4.053 6.606-7.418a6.75 6.75 0 1 0-13.132 0c1.566 3.365 5.508 6.59 6.606 7.418ZM12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center">
          <p>© 2026 NepSky. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#" className="transition duration-300 hover:text-blue-400">
              Privacy
            </a>
            <a href="#" className="transition duration-300 hover:text-blue-400">
              Terms
            </a>
            <a href="#" className="transition duration-300 hover:text-blue-400">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;