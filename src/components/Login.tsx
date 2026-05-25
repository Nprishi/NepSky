import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ShieldAlert,
  Ban,
  Clock3,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type PopupState = {
  open: boolean;
  type: 'blocked' | 'suspended' | null;
  title: string;
  message: string;
  reason?: string | null;
  suspendedUntil?: string | null;
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState<PopupState>({
    open: false,
    type: null,
    title: '',
    message: '',
    reason: null,
    suspendedUntil: null,
  });

  const { loginWithDetails, isLoading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Email format check (same as Signup)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password basic check
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      // We use a generic message here for security
      newErrors.password = 'Invalid email or password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formattedSuspendedUntil = useMemo(() => {
    if (!popup.suspendedUntil) return '';
    const date = new Date(popup.suspendedUntil);
    if (Number.isNaN(date.getTime())) return popup.suspendedUntil;
    return date.toLocaleString();
  }, [popup.suspendedUntil]);

  const closePopup = () => {
    setPopup({
      open: false,
      type: null,
      title: '',
      message: '',
      reason: null,
      suspendedUntil: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await loginWithDetails(formData.email, formData.password);

      if (result.success) {
        // mark that user explicitly signed in so Header can show a notification
        try { sessionStorage.setItem('showLoginNotification', '1'); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('app:signedIn', { detail: { email: formData.email } })); } catch (e) {}
        // If there was a pending selected flight or search, redirect to booking flow
        const pendingSelected = sessionStorage.getItem('pendingSelectedFlight');
        const pendingSearch = sessionStorage.getItem('pendingSearch');
        if (pendingSelected || pendingSearch) {
          navigate('/booking');
        } else {
          navigate('/');
        }
        return;
      }

      // Prevent multiple clicks if already submitting
      if (isSubmitting) return;

      if (!validateForm()) return;

      setIsSubmitting(true);
      setErrors({});

      if (result.status === 'blocked') {
        setPopup({
          open: true,
          type: 'blocked',
          title: 'Account Blocked',
          message: result.message || 'Your account has been blocked by admin.',
          reason: result.reason || null,
          suspendedUntil: null,
        });
        return;
      }

      if (result.status === 'suspended') {
        setPopup({
          open: true,
          type: 'suspended',
          title: 'Account Suspended',
          message: result.message || 'Your account is temporarily suspended.',
          reason: result.reason || null,
          suspendedUntil: result.suspendedUntil || null,
        });
        return;
      }

      setErrors({
        general: result.message || 'Invalid email or password',
      });
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user starts typing in that field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Clear general error when user touches any field
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
            {/* Left panel */}
            <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-blue-700/20 via-slate-900/40 to-cyan-600/10 p-10 text-white lg:flex">
              <div>
                <div className="mb-6 inline-flex rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Secure Login
                </div>

                <h1 className="text-4xl font-bold leading-tight">
                  Welcome back to your account
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-blue-100/80">
                  Sign in to continue your booking journey, manage flights, and access your travel information.
                </p>

                <div className="mt-10 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Protected access</p>
                    <p className="mt-1 text-sm text-blue-100/70">
                      Account restrictions like block or suspension are checked at sign in.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Clear account notices</p>
                    <p className="mt-1 text-sm text-blue-100/70">
                      If your account is restricted, you will see the exact reason on screen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-100/80">
                Travel smarter with a cleaner and safer login experience.
              </div>
            </div>

            {/* Right panel */}
            <div className="bg-white px-5 py-8 sm:px-8 md:px-10">
              <div className="mx-auto max-w-md">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
                </div>

                {errors.general && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <span className="text-sm font-medium text-red-700">{errors.general}</span>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        name="email"
                        type="text"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full rounded-2xl border bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:ring-4 ${errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                          }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full rounded-2xl border bg-white py-3 pl-12 pr-12 text-slate-900 outline-none transition focus:ring-4 ${errors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                          }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
                      Forgot your password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
                  </button>

                  <div className="text-center text-sm text-slate-600">
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                      Sign up
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup modal */}
      {popup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className={`h-1.5 w-full ${popup.type === 'blocked'
                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
            />

            <div className="p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${popup.type === 'blocked'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                      }`}
                  >
                    {popup.type === 'blocked' ? (
                      <Ban className="h-6 w-6" />
                    ) : (
                      <Clock3 className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{popup.title}</h3>
                    <p className="text-sm text-slate-500">
                      Access to this account is currently restricted.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closePopup}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                className={`mb-4 rounded-2xl border p-4 ${popup.type === 'blocked'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    className={`mt-0.5 h-5 w-5 shrink-0 ${popup.type === 'blocked' ? 'text-red-600' : 'text-amber-600'
                      }`}
                  />
                  <p
                    className={`text-sm font-medium ${popup.type === 'blocked' ? 'text-red-700' : 'text-amber-700'
                      }`}
                  >
                    {popup.message}
                  </p>
                </div>
              </div>

              {popup.reason && (
                <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reason
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{popup.reason}</p>
                </div>
              )}

              {popup.type === 'suspended' && formattedSuspendedUntil && (
                <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Suspended Until
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formattedSuspendedUntil}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closePopup}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <Link
                  to="/contact"
                  className={`flex-1 rounded-2xl px-4 py-3 text-center font-semibold text-white transition ${popup.type === 'blocked'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;