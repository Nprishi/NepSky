import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Edit2,
  User,
  RefreshCw,
  Ban,
  Clock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  CalendarClock,
  X,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminKeyGate from './AdminKeyGate';
import Swal from 'sweetalert2';
import { useLanguage } from '../contexts/LanguageContext';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended' | 'blocked' | 'deleted';
  created_at: string;
  last_login: string | null;
  blocked: boolean;
  suspended_until: string | null;
  blocked_reason: string | null;
  suspended_reason: string | null;
}

const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const [blockReason, setBlockReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDays, setSuspendDays] = useState(7);

  const [formData, setFormData] = useState({
    email: '',
    role: 'user' as 'admin' | 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const closeFeedback = () => {
    setError('');
    setSuccessMessage('');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const resolveUserStatus = (user: any): 'active' | 'suspended' | 'blocked' => {
    if (user?.blocked) return 'blocked';

    if (user?.suspended_until) {
      const suspendedUntil = new Date(user.suspended_until).getTime();
      if (!Number.isNaN(suspendedUntil) && suspendedUntil > Date.now()) {
        return 'suspended';
      }
    }

    return 'active';
  };

  const loadUsers = async () => {
    setLoading(true);
    closeFeedback();

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers: UserData[] = (data || []).map((user: any) => ({
        ...user,
        name: user.full_name || user.name || 'Unnamed User',
        status: resolveUserStatus(user),
      }));

      setUsers(mappedUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return users;

    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term) ||
        getUserStatus(user).toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const syncUserAction = async (
    userId: string,
    payload: Record<string, any>,
    successText: string
  ): Promise<boolean> => {
    setActionLoadingId(userId);
    closeFeedback();

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      await loadUsers();
      showSuccess(successText);
      return true;
    } catch (err: any) {
      console.error('User action failed:', err);
      const msg = err?.message || err?.details || JSON.stringify(err);
      setError(msg || 'Failed to update user');
      await Swal.fire({ icon: 'error', title: 'Operation failed', text: String(msg) });
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = async (user: UserData) => {
    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    if (!expected) {
      await Swal.fire({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'Confirm admin key',
      input: 'password',
      inputAttributes: { autocomplete: 'new-password', name: 'admin_key', autocapitalize: 'off', spellcheck: 'false' },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify & Edit',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return;

    if ((value as string).toString().trim() !== expected) {
      await Swal.fire({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return;
    }

    sessionStorage.setItem('supabase_key_verified', 'true');

    setEditingUser(user);
    setFormData({
      email: user.email,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleBlock = async (user: UserData) => {
    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    if (!expected) {
      await Swal.fire({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'Confirm admin key',
      input: 'password',
      inputAttributes: { autocomplete: 'new-password', name: 'admin_key', autocapitalize: 'off', spellcheck: 'false' },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify & Block',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return;

    if ((value as string).toString().trim() !== expected) {
      await Swal.fire({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return;
    }

    sessionStorage.setItem('supabase_key_verified', 'true');

    setSelectedUser(user);
    setBlockReason('');
    setShowBlockModal(true);
  };

  const handleSuspend = async (user: UserData) => {
    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();

    if (!expected) {
      await Swal.fire({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'Confirm admin key',
      input: 'password',
      inputAttributes: { autocomplete: 'new-password', name: 'admin_key', autocapitalize: 'off', spellcheck: 'false' },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify & Suspend',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return;

    if ((value as string).toString().trim() !== expected) {
      await Swal.fire({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return;
    }

    sessionStorage.setItem('supabase_key_verified', 'true');

    setSelectedUser(user);
    setSuspendReason('');
    setSuspendDays(7);
    setShowSuspendModal(true);
  };

  const openUnblockModal = (user: UserData) => {
    setSelectedUser(user);
    setShowUnblockModal(true);
  };

  const handleUnsuspend = async (userId: string) => {
    await syncUserAction(
      userId,
      {
        suspended_until: null,
        suspended_reason: null,
        blocked: false,
        blocked_reason: null,
        status: 'active',
      },
      'Suspension removed successfully'
    );
  };

  const confirmBlock = async () => {
    if (!selectedUser) return;

    if (!blockReason.trim()) {
      setError('Please provide a reason for blocking');
      return;
    }
    const ok = await syncUserAction(
      selectedUser.id,
      {
        blocked: true,
        blocked_reason: blockReason.trim(),
        suspended_until: null,
        suspended_reason: null,
      },
      'User blocked successfully'
    );

    if (!ok) return;

    setShowBlockModal(false);
    setSelectedUser(null);
    setBlockReason('');
  };

  const confirmSuspend = async () => {
    if (!selectedUser) return;

    if (!suspendReason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    const suspendUntil = new Date();
    suspendUntil.setDate(suspendUntil.getDate() + suspendDays);

    const ok = await syncUserAction(
      selectedUser.id,
      {
        blocked: false,
        blocked_reason: null,
        suspended_until: suspendUntil.toISOString(),
        suspended_reason: suspendReason.trim(),
      },
      'User suspended successfully'
    );

    if (!ok) return;

    setShowSuspendModal(false);
    setSelectedUser(null);
    setSuspendReason('');
    setSuspendDays(7);
  };

  const confirmUnblock = async () => {
    if (!selectedUser) return;

    const ok = await syncUserAction(
      selectedUser.id,
      {
        blocked: false,
        blocked_reason: null,
        suspended_until: null,
        suspended_reason: null,
      },
      'User unblocked successfully'
    );

    if (!ok) return;

    setShowUnblockModal(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoadingId(editingUser.id);
    closeFeedback();

    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setShowModal(false);
      setEditingUser(null);
      await loadUsers();
      showSuccess('User role updated successfully');
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setError(err.message || 'Failed to update role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getUserStatus = (user: UserData) => {
    if (user.blocked) return 'Blocked';
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) return 'Suspended';
    return 'Active';
  };

  const getUserStatusColor = (user: UserData) => {
    if (user.blocked) return 'bg-red-100 text-red-700 border-red-200';
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const activeCount = users.filter((u) => getUserStatus(u) === 'Active').length;
  const blockedCount = users.filter((u) => getUserStatus(u) === 'Blocked').length;
  const suspendedCount = users.filter((u) => getUserStatus(u) === 'Suspended').length;

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-1" />
          <div className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('admin.users') || 'User Management'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage users, roles, account block, suspension, and access control.
                </p>
              </div>

              <button
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-3 text-sm font-semibold text-white shadow transition hover:translate-y-[-1px] disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

          {(error || successMessage) && (
            <div className="mt-5 space-y-3">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Users
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suspended
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{suspendedCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blocked
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">{blockedCount}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, role, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isBusy = actionLoadingId === user.id;
                  const statusText = getUserStatus(user);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{user.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getUserStatusColor(
                              user
                            )}`}
                          >
                            {statusText}
                          </span>

                          {user.blocked && user.blocked_reason && (
                            <p className="max-w-xs text-xs text-red-600">
                              Reason: {user.blocked_reason}
                            </p>
                          )}

                          {user.suspended_until &&
                            new Date(user.suspended_until) > new Date() && (
                              <div className="text-xs text-amber-700">
                                <div className="flex items-center gap-1">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  Until: {new Date(user.suspended_until).toLocaleString()}
                                </div>
                                {user.suspended_reason && (
                                  <p className="mt-1">Reason: {user.suspended_reason}</p>
                                )}
                              </div>
                            )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString()
                          : 'Never'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={isBusy}
                            className="inline-flex items-center rounded-xl border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                            title="Edit Role"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {user.blocked ? (
                            <button
                              onClick={() => openUnblockModal(user)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-xl border border-emerald-200 p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                              title="Unblock User"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              title="Block User"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}

                          {!user.blocked &&
                          (!user.suspended_until || new Date(user.suspended_until) <= new Date()) ? (
                            <button
                              onClick={() => handleSuspend(user)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-xl border border-amber-200 p-2 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                              title="Suspend User"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          ) : !user.blocked &&
                            user.suspended_until &&
                            new Date(user.suspended_until) > new Date() ? (
                            <button
                              onClick={() => handleUnsuspend(user.id)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-xl border border-emerald-200 p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                              title="Remove Suspension"
                            >
                              <Unlock className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Edit User Role</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  disabled
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                Admin can update role and control account access from this panel.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoadingId === editingUser.id}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Update Role
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl bg-slate-500 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Block User</h3>
                <p className="text-sm text-slate-500">This will prevent login and access.</p>
              </div>
            </div>

            <p className="mb-4 text-sm text-slate-700">
              You are about to block <strong>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Reason for Blocking
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
              placeholder="Enter reason for blocking this user..."
            />

            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              Blocked users will not be able to log in or access booking features.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmBlock}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Block
              </button>
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 rounded-2xl bg-slate-500 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Suspend User</h3>
                <p className="text-sm text-slate-500">This will temporarily stop access.</p>
              </div>
            </div>

            <p className="mb-4 text-sm text-slate-700">
              You are about to suspend <strong>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Suspension Duration (Days)
              </label>
              <select
                value={suspendDays}
                onChange={(e) => setSuspendDays(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Reason for Suspension
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                placeholder="Enter reason for suspension..."
              />
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              Suspended users will not be able to access the system until the suspension expires.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmSuspend}
                className="flex-1 rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white transition hover:bg-amber-700"
              >
                Confirm Suspension
              </button>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 rounded-2xl bg-slate-500 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Modal */}
      {showUnblockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Unblock User</h3>
                <p className="text-sm text-slate-500">Restore account access for this user.</p>
              </div>
            </div>

            <p className="mb-4 text-sm text-slate-700">
              Are you sure you want to unblock <strong>{selectedUser.name}</strong> ({selectedUser.email})?
            </p>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              This user will be able to log in and access booking features again.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmUnblock}
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                Confirm Unblock
              </button>
              <button
                onClick={() => setShowUnblockModal(false)}
                className="flex-1 rounded-2xl bg-slate-500 px-4 py-3 font-semibold text-white transition hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminKeyGate>
  );
};

export default UserManagement;