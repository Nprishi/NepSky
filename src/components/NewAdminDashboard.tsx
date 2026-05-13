import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plane, BookOpen, LogOut, BarChart3,DollarSign, Settings as SettingsIcon, CreditCard, Globe,
  RefreshCw, AlertCircle, TrendingUp, Activity, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAdmin } from '../contexts/AdminContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import UserManagement from './UserManagement';
import FlightManagement from './FlightManagement';
import BookingManagement from './BookingManagement';
import PaymentManagement from './PaymentManagement';
import AdminSettings from './AdminSettings';

type Tab = 'overview' | 'users' | 'flights' | 'bookings' | 'payments' | 'settings';

const NewAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFlights: 0,
    totalBookings: 0,
    revenueUSD: 0,
    revenueNPR: 0,
  });
  const [exchangeRate, setExchangeRate] = useState(132.5);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [bookingStats, setBookingStats] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  const { admin, logout } = useAdmin();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatCurrencyUSD = useCallback((value: number) => {
    return `$${Number(value || 0).toLocaleString()}`;
  }, []);

  const formatCurrencyNPR = useCallback((value: number) => {
    return `रू ${Number(value || 0).toLocaleString()}`;
  }, []);

  const translatedWelcome = useMemo(() => {
    return language === 'en' ? 'Welcome back' : 'फेरि स्वागत छ';
  }, [language]);

  const tabList = useMemo(
    () => [
      { key: 'overview' as Tab, label: t('admin.overview'), icon: BarChart3 },
      { key: 'users' as Tab, label: t('admin.users'), icon: Users },
      { key: 'flights' as Tab, label: t('admin.flights'), icon: Plane },
      { key: 'bookings' as Tab, label: t('admin.bookings'), icon: BookOpen },
      { key: 'payments' as Tab, label: t('admin.payments'), icon: CreditCard },
      { key: 'settings' as Tab, label: t('admin.settings'), icon: SettingsIcon },
    ],
    [t]
  );

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [admin, navigate]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setDashboardRefreshing(true);
    } else {
      setDashboardLoading(true);
    }

    setDashboardError('');

    try {
      await Promise.all([loadStats(), loadChartData()]);
    } catch (error: any) {
      setDashboardError(error?.message || 'Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
      setDashboardRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      // Safer settings fetch: get latest available rate
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('usd_to_npr_rate, updated_at')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1);

      if (settingsError) {
        console.error('Settings load error:', settingsError);
      }

      const rate = settingsData?.[0]?.usd_to_npr_rate
        ? Number(settingsData[0].usd_to_npr_rate)
        : 132.5;

      setExchangeRate(rate);

      const [usersRes, flightsRes, bookingsRes, paymentsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('flights').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase
          .from('payments')
          .select('amount_usd, amount_npr')
          .eq('status', 'completed'),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (flightsRes.error) throw flightsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const revenueUSD =
        paymentsRes.data?.reduce(
          (sum: number, payment: any) => sum + Number(payment.amount_usd || 0),
          0
        ) || 0;

      const revenueNPR =
        paymentsRes.data?.reduce(
          (sum: number, payment: any) => sum + Number(payment.amount_npr || 0),
          0
        ) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalFlights: flightsRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        revenueUSD,
        revenueNPR,
      });
    } catch (error) {
      console.error('Stats load error:', error);
      throw error;
    }
  };

  const loadChartData = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_date, total_amount, status')
        .order('booking_date', { ascending: true });

      if (error) throw error;

      if (!bookings || bookings.length === 0) {
        setMonthlyRevenue([]);
        setBookingStats([]);
        return;
      }

      const monthlyData: Record<string, number> = {};

      bookings.forEach((booking: any) => {
        const bookingDate = booking.booking_date ? new Date(booking.booking_date) : null;
        if (!bookingDate || Number.isNaN(bookingDate.getTime())) return;

        const month = bookingDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });

        monthlyData[month] = (monthlyData[month] || 0) + Number(booking.total_amount || 0);
      });

      const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue: Number(Number(revenue).toFixed(2)),
      }));

      setMonthlyRevenue(chartData.slice(-6));

      const statusCounts = bookings.reduce((acc: Record<string, number>, booking: any) => {
        const status = booking.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

      setBookingStats(statusData);
    } catch (error) {
      console.error('Chart data load error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };


  const renderOverview = () => {
    if (dashboardLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="animate-pulse">
                  <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-200" />
                  <div className="mb-2 h-4 w-24 rounded bg-slate-200" />
                  <div className="h-8 w-20 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="animate-pulse">
                  <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
                  <div className="h-72 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {dashboardError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {language === 'en' ? 'Failed to load dashboard data' : 'ड्यासबोर्ड डाटा लोड गर्न सकिएन'}
              </p>
              <p className="mt-1 text-sm text-red-700">{dashboardError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-1" />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Live
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{t('stats.totalUsers')}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-violet-600 to-purple-500 p-1" />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                  <Plane className="h-7 w-7 text-violet-600" />
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  Active
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{t('stats.totalFlights')}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalFlights}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-1" />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <BookOpen className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Updated
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{t('stats.totalBookings')}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalBookings}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1" />
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                  <DollarSign className="h-7 w-7 text-amber-600" />
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Revenue
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{t('stats.totalRevenue')}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrencyUSD(stats.revenueUSD)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatCurrencyNPR(stats.revenueNPR)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'en' ? 'Monthly Revenue Trend' : 'मासिक राजस्व प्रवृत्ति'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {language === 'en'
                    ? 'Last 6 months revenue performance'
                    : 'पछिल्ला ६ महिनाको राजस्व प्रदर्शन'}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                <TrendingUp className="h-4 w-4" />
                USD
              </div>
            </div>

            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <div>
                  <Activity className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    {language === 'en' ? 'No revenue data available yet' : 'अहिलेसम्म राजस्व डाटा उपलब्ध छैन'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Quick Summary' : 'द्रुत सारांश'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {language === 'en'
                  ? 'Current operational dashboard snapshot'
                  : 'हालको सञ्चालन स्थिति'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Exchange Rate
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  1 USD = {exchangeRate} NPR
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Revenue (USD)
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatCurrencyUSD(stats.revenueUSD)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Revenue (NPR)
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatCurrencyNPR(stats.revenueNPR)}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('settings')}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span>{language === 'en' ? 'Manage Settings' : 'सेटिङ व्यवस्थापन'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              {language === 'en' ? 'Booking Status Distribution' : 'बुकिङ स्थिति वितरण'}
            </h3>

            {bookingStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={bookingStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}`}
                    outerRadius={105}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingStats.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <div>
                  <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    {language === 'en' ? 'No booking status data found' : 'बुकिङ स्थिति डाटा फेला परेन'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              {language === 'en' ? 'Revenue by Month (USD)' : 'मासिक राजस्व (अमेरिकी डलर)'}
            </h3>

            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <div>
                  <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    {language === 'en' ? 'No monthly revenue chart data available' : 'मासिक राजस्व चार्ट डाटा उपलब्ध छैन'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t('admin.dashboard')}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {translatedWelcome},{' '}
                <span className="font-semibold text-slate-800">{admin?.full_name || 'Admin'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={dashboardRefreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${dashboardRefreshing ? 'animate-spin' : ''}`} />
              {language === 'en' ? 'Refresh' : 'रिफ्रेस'}
            </button>

            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Globe className="h-4 w-4" />
              {language === 'en' ? 'नेपाली' : 'English'}
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'flights' && <FlightManagement />}
        {activeTab === 'bookings' && <BookingManagement />}
        {activeTab === 'payments' && <PaymentManagement />}
        {activeTab === 'settings' && <AdminSettings onUpdate={() => fetchDashboardData(true)} />}
      </div>
    </div>
  );
};

export default NewAdminDashboard;