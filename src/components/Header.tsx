import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
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
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // UI STATES

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  // SETTINGS STATES

  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [selectedCurrency, setSelectedCurrency] = useState("NPR");

  // LOCATION STATES

  const [locationName, setLocationName] = useState("Detecting location...");

  const [isLocating, setIsLocating] = useState(true);

  // NOTIFICATION STATES

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // REFS

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // UNREAD COUNT

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  // HELPERS

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "U";
  };

  const resolveProfileImage = (imagePath?: string) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    return `${API_BASE_URL}${
      imagePath.startsWith("/") ? imagePath : `/${imagePath}`
    }`;
  };

  const userProfileImage = resolveProfileImage(user?.profilePicture);

  // TEMP NOTIFICATION ADDER

  const addTemporaryNotification = (notification: NotificationItem) => {
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === notification.id);
      if (exists) return prev;

      return [notification, ...prev];
    });
  };

  // FETCH FROM DATABASE (SAFE MERGE)

  const fetchNotifications = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications:", error);
      return;
    }

    const dbNotifications: NotificationItem[] = (data || []).map((n: any) => ({
      id: n.id, // UUID from DB (string)
      title: n.title,
      message: n.body,
      time: new Date(n.created_at).toLocaleString(),
      read: n.read ?? false,
    }));

    setNotifications((prev) => {
      const tempOnly = prev.filter(
        (n) => typeof n.id === "string" && n.id.startsWith("temp-"),
      );
      const dbIds = new Set(dbNotifications.map((n) => n.id));

      const mergedTemp = tempOnly.filter((t) => !dbIds.has(t.id));

      return [...dbNotifications, ...mergedTemp];
    });
  };

  // MARK ALL AS READ

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    if (!user?.id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // MAIN EFFECT

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // LOGIN NOTIFICATION

    const showLogin = sessionStorage.getItem("showLoginNotification");

    if (showLogin) {
      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const getDevice = () => {
        const ua = navigator.userAgent;
        if (ua.includes("Win")) return "Windows PC";
        if (ua.includes("Mac")) return "Mac";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iPhone")) return "iPhone";
        return "Device";
      };

      const loginNotification: NotificationItem = {
        id: `temp-login-${Date.now()}`,
        title: "Signed In",
        message: `Signed in at ${now} on ${getDevice()}`,
        time: "Just now",
        read: false,
      };

      addTemporaryNotification(loginNotification);

      sessionStorage.removeItem("showLoginNotification");
    }

    // BOOKING NOTIFICATION

    const bookingCompleted = sessionStorage.getItem("bookingCompleted");

    if (bookingCompleted) {
      try {
        const data = JSON.parse(bookingCompleted);

        const bookingNotification: NotificationItem = {
          id: `temp-booking-${Date.now()}`,
          title: "Booking Confirmed",
          message: `Booking ${data.pnr || data.bookingId} confirmed — ${
            data.amount ? "$" + data.amount : ""
          }`,
          time: "Just now",
          read: false,
        };

        addTemporaryNotification(bookingNotification);
      } catch (err) {
        console.error("Invalid booking data", err);
      } finally {
        sessionStorage.removeItem("bookingCompleted");
      }
    }

    // REALTIME EVENTS

    const onSignedIn = (e: any) => {
      const email = e?.detail?.email || "";

      addTemporaryNotification({
        id: `temp-signin-${Date.now()}`,
        title: "Signed In",
        message: `Signed in (${email})`,
        time: "Just now",
        read: false,
      });
    };

    const onBookingCompleted = (e: any) => {
      const d = e?.detail || {};

      addTemporaryNotification({
        id: `temp-booking-${Date.now()}`,
        title: "Booking Confirmed",
        message: `Booking ${d.pnr || d.bookingId} confirmed`,
        time: "Just now",
        read: false,
      });
    };

    window.addEventListener("app:signedIn", onSignedIn);
    window.addEventListener("app:bookingCompleted", onBookingCompleted);

    return () => {
      window.removeEventListener("app:signedIn", onSignedIn);
      window.removeEventListener("app:bookingCompleted", onBookingCompleted);
    };
  }, [user?.id]);

  // LOCATION DETECTION

  useEffect(() => {
    const cachedLocation = localStorage.getItem("userLocation");

    if (cachedLocation) {
      setLocationName(cachedLocation);
      setIsLocating(false);
      return;
    }

    if (!navigator.geolocation) {
      setLocationName("Location unavailable");

      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );

          const data = await response.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "Unknown Area";

          const country = data.address?.country || "Unknown Country";

          const finalLocation = `${city}, ${country}`;

          setLocationName(finalLocation);

          localStorage.setItem("userLocation", finalLocation);
        } catch (error) {
          setLocationName("Location unavailable");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setLocationName("Location permission denied");

        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }, []);

  // NAVIGATION STYLE

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative font-medium transition-all duration-200 ${
      isActive ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
    }`;

  // JSX

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/75 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* TOP BAR */}

        <div className="flex min-h-[74px] items-center justify-between gap-4">
          {/* LOGO */}

          <Link to="/" className="flex items-center gap-3">
            <img
              src="/Main-Logo.png"
              alt="NepSky"
              className="h-12 w-12 rounded-full object-contain"
            />

            <div>
              <h1 className="text-2xl font-bold">NepSky</h1>

              <p className="text-xs text-slate-500">Air Ticketing System</p>
            </div>
          </Link>

          {/* NAVIGATION */}

          <nav className="hidden xl:flex items-center gap-8">
            <NavLink to="/flights" className={navLinkClass}>
              Flights
            </NavLink>

            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>

            <NavLink to="/check-in" className={navLinkClass}>
              Check-in
            </NavLink>

            <NavLink to="/support" className={navLinkClass}>
              Support
            </NavLink>
          </nav>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-3">
            {/* LOCATION */}

            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <MapPin className="h-4 w-4 text-blue-600" />
              )}

              <span>{locationName}</span>
            </div>

            {/* NOTIFICATIONS */}

            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative rounded-full border border-slate-200 bg-white p-2.5"
                >
                  <Bell className="h-5 w-5" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-[350px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="font-semibold">Notifications</h3>

                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`border-b px-4 py-3 ${
                              !item.read ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <div className="flex justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-800">
                                  {item.title}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  {item.message}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {item.time}
                                </p>
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

            {/* PROFILE */}

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
                >
                  {userProfileImage ? (
                    <img
                      src={userProfileImage}
                      alt="Profile"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                      {getUserInitials(user.firstName, user.lastName)}
                    </div>
                  )}

                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-50"
                      >
                        <User className="h-4 w-4 text-blue-600" />
                        Profile
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4 text-blue-600" />
                        Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 hover:bg-red-50"
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
                  className="rounded-full px-4 py-2 font-medium text-slate-700"
                >
                  Login
                </Link>

                <Link
                  to="/select-signup"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-2.5 font-medium text-white"
                >
                  <Plane className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* MOBILE MENU */}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden rounded-full border border-slate-200 bg-white p-2.5"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
