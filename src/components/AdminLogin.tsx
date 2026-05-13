import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { useLanguage } from '../contexts/LanguageContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAdmin();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isFormValid = useMemo(() => {
    return email.trim().length > 0 && password.length > 0;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const success = await login(email.trim(), password);

      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Something went wrong while signing in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_30%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />

      {/* Decorative blur */}
      <div className="absolute left-[-80px] top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute bottom-10 right-[-60px] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
          <div className="grid min-h-[680px] lg:grid-cols-2">
            {/* Left Info Panel */}
            <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-blue-700/20 via-slate-900/40 to-cyan-600/10 p-10 text-white lg:flex">
              <div>
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>

                <p className="mb-3 inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Secure Admin Access
                </p>

                <h1 className="max-w-md text-4xl font-bold leading-tight">
                  {t('login.admin')}
                </h1>

                <p className="mt-4 max-w-md text-sm leading-7 text-blue-100/80">
                  Sign in to manage flights, bookings, users, payments, and operational
                  activities from your central admin dashboard.
                </p>

                <div className="mt-10 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold">Protected access</h3>
                      <p className="mt-1 text-sm text-blue-100/70">
                        Admin login remains connected to your existing authentication flow.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold">Operational control</h3>
                      <p className="mt-1 text-sm text-blue-100/70">
                        Access bookings, flight scheduling, airport details, and customer
                        records securely.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold">Responsive design</h3>
                      <p className="mt-1 text-sm text-blue-100/70">
                        A cleaner layout for desktop and mobile without affecting backend logic.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-300/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-100/50">
                  Platform
                </p>
                <p className="mt-2 text-lg font-semibold">{t('app.title')}</p>
                <p className="mt-1 text-sm text-blue-100/70">
                  Airline administration portal
                </p>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex items-center justify-center bg-white/95 px-5 py-8 sm:px-8 md:px-10">
              <div className="w-full max-w-md">
                {/* Mobile heading */}
                <div className="mb-8 text-center lg:hidden">
                  <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                    <Shield className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">{t('login.admin')}</h1>
                  <p className="mt-2 text-sm text-slate-600">{t('app.title')}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Enter your admin email and password to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      {t('login.email')}
                    </label>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                      <input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@airlines.com"
                        autoComplete="email"
                        disabled={loading}
                        required
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      {t('login.password')}
                    </label>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        autoComplete="current-password"
                        disabled={loading}
                        required
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={loading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-5 w-5" />
                        {t('login.signIn')}
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    Admin Credentials
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-slate-700">
                      <span className="font-semibold">Email:</span> adminself@gmail.com
                    </p>
                    <p className="text-slate-700">
                      <span className="font-semibold">Password:</span> adminself
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => navigate('/select-login')}
                    disabled={loading}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
    </div>
  );
};

export default AdminLogin;