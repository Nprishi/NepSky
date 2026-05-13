import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  CreditCard,
  Bell,
  MapPin,
  Globe,
  ChevronDown,
  Plane,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../../dist/assets/Main Logo.png';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [selectedCurrency, setSelectedCurrency] = useState('NPR');

  const [locationName, setLocationName] = useState('Detecting location...');
  const [isLocating, setIsLocating] = useState(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Booking Update',
      message: 'Your Kathmandu to Dubai flight is confirmed.',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      title: 'Check-in Reminder',
      message: 'Online check-in opens 24 hours before departure.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      title: 'Special Offer',
      message: 'Get discounted fares on selected international routes.',
      time: 'Today',
      read: true,
    },
  ]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const resolveProfileImage = (imagePath?: string) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Change this to your backend base URL
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  const userProfileImage = resolveProfileImage(user?.profilePicture);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }

      if (languageRef.current && !languageRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }

      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setIsCurrencyOpen(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        // only close mobile menu when it is open and clicked outside
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (user) {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Simple helper to parse basic device info
      const getDeviceName = () => {
        const ua = navigator.userAgent;
        if (ua.includes("Win")) return "Windows PC";
        if (ua.includes("Mac")) return "Macintosh";
        if (ua.includes("Linux")) return "Linux Device";
        if (ua.includes("Android")) return "Android Phone";
        if (ua.includes("iPhone")) return "iPhone";
        return "Unknown Device";
      };

      const loginNotification: NotificationItem = {
        id: Date.now(), // Unique ID
        title: 'New Login Detected',
        message: `User Login: ${currentTime} on ${getDeviceName()}`,
        time: 'Just now',
        read: false,
      };

      setNotifications((prev) => [loginNotification, ...prev]);
    }
  }, [user]); // Runs whenever the user object changes (e.g., on login)

  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setLocationName('Location unavailable');
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );

            const data = await response.json();

            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.municipality ||
              data.address?.village ||
              data.address?.county ||
              'Unknown area';

            const country = data.address?.country || 'Unknown country';

            setLocationName(`${city}, ${country}`);
          } catch (error) {
            setLocationName('Location unavailable');
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setLocationName('Location permission denied');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    detectLocation();
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative font-medium transition-all duration-200 ${isActive
      ? 'text-blue-600'
      : 'text-slate-700 hover:text-blue-600'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/75 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      {/* Top utility bar */}
      <div className="hidden lg:block border-b border-slate-200/70 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[42px] items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex min-w-0 items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="truncate">
                {isLocating ? 'Detecting your location...' : locationName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Language */}
              <div className="relative" ref={languageRef}>
                <button
                  onClick={() => {
                    setIsLanguageOpen(!isLanguageOpen);
                    setIsCurrencyOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>{selectedLanguage}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isLanguageOpen && (
                  <div className="absolute z-10 right-0 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {['EN', 'NP'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLanguageOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${selectedLanguage === lang
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-700'
                          }`}
                      >
                        {lang === 'EN' ? 'English' : 'Nepali'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => {
                    setIsCurrencyOpen(!isCurrencyOpen);
                    setIsLanguageOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <span className="font-medium">{selectedCurrency}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isCurrencyOpen && (
                  <div className="absolute z-10 right-0 mt-2 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {['NPR', 'USD'].map((currency) => (
                      <button
                        key={currency}
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setIsCurrencyOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${selectedCurrency === currency
                          ? 'bg-blue-50 font-semibold text-blue-600'
                          : 'text-slate-700'
                          }`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[74px] items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={logo}
                alt="NepSky Logo"
                className="h-12 w-12 rounded-full object-contain ring-2 ring-blue-100 sm:h-14 sm:w-14"
              />
            </div>

            <div className="leading-none">
              <div className="flex items-end">
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-blue-500 bg-clip-text text-transparent sm:text-3xl">
                  Nep
                </span>
                <span className="ml-1 text-xl font-bold text-blue-600 sm:text-2xl">
                  Sky
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                International Air Ticketing System
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-8">
            <NavLink to="/flights" className={navLinkClass}>
              {({ isActive }) => (
                <span className={isActive ? 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-blue-600' : ''}>
                  Flights
                </span>
              )}
            </NavLink>

            <NavLink to="/my-bookings" className={navLinkClass}>
              {({ isActive }) => (
                <span className={isActive ? 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-blue-600' : ''}>
                  My Bookings
                </span>
              )}
            </NavLink>

            <NavLink to="/check-in" className={navLinkClass}>
              {({ isActive }) => (
                <span className={isActive ? 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-blue-600' : ''}>
                  Check-in
                </span>
              )}
            </NavLink>

            <NavLink to="/support" className={navLinkClass}>
              {({ isActive }) => (
                <span className={isActive ? 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-blue-600' : ''}>
                  Support
                </span>
              )}
            </NavLink>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile location */}
            <div className="hidden md:flex lg:hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 max-w-[220px]">
              <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="truncate">{isLocating ? 'Locating...' : locationName}</span>
            </div>

            {/* Only show Notifications if user is logged in */}
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileOpen(false);
                  }}
                  className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Content */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-[320px] sm:w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="font-semibold text-slate-800">Notifications</h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`border-b px-4 py-3 transition hover:bg-slate-50 ${!item.read ? 'bg-blue-50/50' : 'bg-white'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-800">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                              </div>
                              {!item.read && (
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 sm:px-3"
              >
                {userProfileImage ? (
                  <img
                    src={userProfileImage}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-100"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-semibold text-white">
                    {getUserInitials(user.firstName, user.lastName)}
                  </div>
                )}

                <div className="hidden text-left sm:block">
                  <p className="max-w-[120px] truncate text-sm font-semibold text-slate-800">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="max-w-[120px] truncate text-xs text-slate-500">
                    Premium Traveler
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-4 text-white">
                    <div className="flex items-center gap-3">
                      {userProfileImage ? (
                        <img
                          src={userProfileImage}
                          alt="Profile"
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-base font-bold">
                          {getUserInitials(user.firstName, user.lastName)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-sm text-blue-50">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-blue-600" />
                      Profile
                    </Link>

                    <Link
                      to="/my-bookings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      My Bookings
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-blue-600" />
                      Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/select-login"
                className="rounded-full px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
              >
                Login
              </Link>
              <Link
                to="/select-signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 font-medium text-white shadow-lg shadow-blue-200 transition hover:scale-[1.02] hover:shadow-xl"
              >
                <Plane className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {
        isMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white shadow-2xl" ref={mobileMenuRef}>
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              {/* Mobile utility row */}
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <MapPin className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="truncate">{locationName}</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-600">Language</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 outline-none"
                  >
                    <option value="EN">English</option>
                    <option value="NP">Nepali</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                  <span className="font-medium text-slate-600">Currency</span>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 outline-none"
                  >
                    <option value="NPR">NPR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                <NavLink
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 font-medium transition ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  Home
                </NavLink>

                <NavLink
                  to="/flights"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 font-medium transition ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  Flights
                </NavLink>

                <NavLink
                  to="/my-bookings"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 font-medium transition ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  My Bookings
                </NavLink>

                <NavLink
                  to="/check-in"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 font-medium transition ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  Check-in
                </NavLink>

                <NavLink
                  to="/support"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 font-medium transition ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  Support
                </NavLink>
              </nav>

              {!user && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/select-login"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Login
                  </Link>

                  <Link
                    to="/select-signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 text-center font-medium text-white shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )
      }
    </header >
  );
};

export default Header;