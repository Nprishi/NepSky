import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Save,
  DollarSign,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import AdminKeyGate from './AdminKeyGate';

interface AdminSettingsProps {
  onUpdate?: () => void;
}

const SETTINGS_ROW_ID = '11111111-1111-1111-1111-111111111111';

const AdminSettings: React.FC<AdminSettingsProps> = ({ onUpdate }) => {
  const { t } = useLanguage();


  // ADD STATES
  const [isEditing, setIsEditing] = useState(false);

  // Pop up Modal State
  const [showModal, setShowModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [settings, setSettings] = useState({
    usd_to_npr_rate: '132.50',
    site_name: 'Nepal International Air Ticketing',
    site_email: 'info@nepalairlines.com',
    site_phone: '+977-1-1234567',
    esewa_merchant_id: '',
    esewa_secret_key: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const loadSettings = async () => {
    setInitialLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          usd_to_npr_rate: data.usd_to_npr_rate?.toString() || '132.50',
          site_name: data.site_name || 'Nepal International Air Ticketing',
          site_email: data.site_email || 'info@nepalairlines.com',
          site_phone: data.site_phone || '+977-1-1234567',
          esewa_merchant_id: data.esewa_merchant_id || '',
          esewa_secret_key: data.esewa_secret_key || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const usdRate = parseFloat(settings.usd_to_npr_rate);

      if (Number.isNaN(usdRate) || usdRate <= 0) {
        throw new Error('Please enter a valid USD to NPR exchange rate');
      }

      const payload = {
        id: SETTINGS_ROW_ID,
        usd_to_npr_rate: usdRate,
        site_name: settings.site_name.trim(),
        site_email: settings.site_email.trim(),
        site_phone: settings.site_phone.trim(),
        esewa_merchant_id: settings.esewa_merchant_id.trim(),
        esewa_secret_key: settings.esewa_secret_key.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      setSuccess(true);
      onUpdate?.();
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // ADD  FUNCTION for password change
  const handlePasswordChange = async () => {
    const { newPassword, confirmPassword } = passwordData;

    // Validation
    if (!newPassword || !confirmPassword) {
      return Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all password fields',
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: 'error',
        title: 'Mismatch',
        text: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters',
      });
    }

    // Confirm before changing
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change your password?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, change it',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Success Alert
      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been changed successfully',
        timer: 2000,
        showConfirmButton: false,
      });

      setPasswordData({ newPassword: '', confirmPassword: '' });

    } catch (err: any) {
      // Error Alert
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err.message || 'Failed to update password',
      });
    }
  };

  const ratePreview = useMemo(() => {
    const rate = parseFloat(settings.usd_to_npr_rate || '0');
    if (Number.isNaN(rate)) return '0.00';
    return rate.toFixed(2);
  }, [settings.usd_to_npr_rate]);

  const secretKeyMasked = useMemo(() => {
    if (!settings.esewa_secret_key) return 'Not configured';
    if (settings.esewa_secret_key.length <= 4) return '••••';
    return `••••••••${settings.esewa_secret_key.slice(-4)}`;
  }, [settings.esewa_secret_key]);

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Settings className="h-7 w-7 text-blue-200" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('admin.settings')}</h2>
                <p className="mt-1 text-sm text-blue-100/80">
                  Manage exchange rate, site information, and payment gateway details.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading || initialLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${initialLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Settings saved successfully</p>
            <p className="mt-1 text-sm text-emerald-700">Your settings are now stored permanently.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Something went wrong</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {/* ✅ NEW EDIT BUTTON */}
        <button
          type="button"
          onClick={() => {
            if (isEditing) loadSettings(); // reset if cancel
            setIsEditing(!isEditing);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>

        {/* NEW Password Change Button */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
        >
          Change Password
        </button>


        <button
          type="button"
          onClick={loadSettings}
          disabled={loading || initialLoading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white"
        >
          <RefreshCw className={`h-4 w-4 ${initialLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Exchange Rate Settings</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Set the USD to NPR conversion rate used across the system.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {t('settings.exchangeRate')}
              </label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.usd_to_npr_rate}
                  onChange={(e) => handleChange('usd_to_npr_rate', e.target.value)}
                  disabled={loading || initialLoading}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  required
                />
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-700">
                  Current preview: <span className="font-semibold">1 USD = रू {ratePreview} NPR</span>
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Site Information</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your site identity and public contact details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('settings.siteName')}
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  disabled={!isEditing || loading || initialLoading}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('settings.siteEmail')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={settings.site_email}
                    onChange={(e) => handleChange('site_email', e.target.value)}
                    disabled={!isEditing || loading || initialLoading}
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('settings.sitePhone')}
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={settings.site_phone}
                    onChange={(e) => handleChange('site_phone', e.target.value)}
                    disabled={!isEditing || loading || initialLoading}
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Payment Gateway Settings</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Configure your eSewa payment credentials used by the system.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('settings.esewaId')}
                </label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={settings.esewa_merchant_id}
                    onChange={(e) => handleChange('esewa_merchant_id', e.target.value)}
                    disabled={!isEditing || loading || initialLoading}
                    placeholder="Enter eSewa Merchant ID"
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t('settings.esewaKey')}
                </label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={settings.esewa_secret_key}
                    onChange={(e) => handleChange('esewa_secret_key', e.target.value)}
                    disabled={!isEditing || loading || initialLoading}
                    placeholder="Enter eSewa Secret Key"
                    className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey((prev) => !prev)}
                    disabled={!isEditing || loading || initialLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                  >
                    {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isEditing || loading || initialLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {t('settings.save')}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Configuration Summary</h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exchange Rate</p>
                <p className="mt-1 text-base font-bold text-slate-900">1 USD = रू {ratePreview} NPR</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Site Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900 break-words">{settings.site_name || 'Not configured'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 text-sm font-medium text-slate-900 break-words">{settings.site_email || 'Not configured'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{settings.site_phone || 'Not configured'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">eSewa Merchant ID</p>
                <p className="mt-1 text-sm font-medium text-slate-900 break-words">{settings.esewa_merchant_id || 'Not configured'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secret Key</p>
                <p className="mt-1 text-sm font-medium text-slate-900 break-words">{secretKeyMasked}</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* NEW PASSWORD CHANGE SECTION */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

          {/* MODAL BOX */}
          <div className="relative max-h-[90vh] w-[95%] max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

            {/* CLOSE BUTTON */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-white"
            >
              X
            </button>

            {/* YOUR EXISTING FORM GOES HERE */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Securely update your admin password.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2 text-white shadow-lg"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
    </AdminKeyGate>
  );
};

export default AdminSettings;