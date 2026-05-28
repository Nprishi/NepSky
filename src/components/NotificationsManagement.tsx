import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Search, Users, Send, User, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminKeyGate from './AdminKeyGate';
import { useAdmin } from '../contexts/AdminContext';

type RecipientMode = 'all' | 'specific' | 'selected';

const NotificationsManagement: React.FC = () => {
  const { admin } = useAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [mode, setMode] = useState<RecipientMode>('all');
  const [specificUser, setSpecificUser] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const [title, setTitle] = useState('');
  const [about, setAbout] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Failed to load users', error);
      return;
    }
    setUsers(data || []);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const recipientCount = async (): Promise<number> => {
    if (mode === 'all') {
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
      return count || 0;
    }
    if (mode === 'specific') return specificUser ? 1 : 0;
    return Object.values(selectedIds).filter(Boolean).length;
  };

  const verifyAdminKey = async (): Promise<boolean> => {
    const expected = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').toString().trim();
    if (!expected) {
      await Swal.fire({ icon: 'error', title: 'Config error', text: 'Admin key not configured.' });
      return false;
    }

    const { value, isConfirmed } = await Swal.fire({
      title: 'Confirm admin key',
      input: 'password',
      inputAttributes: { autocomplete: 'new-password', name: 'admin_key', autocapitalize: 'off', spellcheck: 'false' },
      inputPlaceholder: 'Supabase anon key',
      showCancelButton: true,
      confirmButtonText: 'Verify',
      preConfirm: (v: string) => {
        const trimmed = typeof v === 'string' ? v.trim() : '';
        if (!trimmed) Swal.showValidationMessage('Key is required');
        return trimmed;
      },
    });

    if (!isConfirmed) return false;
    if ((value as string).toString().trim() !== expected) {
      await Swal.fire({ icon: 'error', title: 'Access denied', text: 'Invalid admin key' });
      return false;
    }

    sessionStorage.setItem('supabase_key_verified', 'true');
    return true;
  };

  const handleSend = async () => {
    if (!title.trim()) return Swal.fire({ icon: 'warning', title: 'Missing title', text: 'Please enter event title' });
    if (!description.trim()) return Swal.fire({ icon: 'warning', title: 'Missing description', text: 'Please enter event description' });

    const ok = await verifyAdminKey();
    if (!ok) return;

    setLoading(true);
    try {
      let targets: string[] = [];

      if (mode === 'all') {
        const { data } = await supabase.from('users').select('id');
        targets = (data || []).map((u: any) => u.id);
      } else if (mode === 'specific') {
        if (specificUser) targets = [specificUser];
      } else {
        targets = Object.entries(selectedIds).filter(([,v]) => v).map(([k]) => k);
      }

      if (!targets || targets.length === 0) {
        await Swal.fire({ icon: 'warning', title: 'No recipients', text: 'Please select one or more recipients.' });
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();
      const scheduled = scheduledAt ? new Date(scheduledAt).toISOString() : now;

      const rows = targets.map((userId) => ({
        user_id: userId,
        title: title.trim(),
        body: description.trim(),
        about: about || null,
        scheduled_at: scheduled,
        created_at: now,
        sent_by: admin?.id || null,
        read: false,
      }));

      const { error } = await supabase.from('notifications').insert(rows);
      if (error) {
        console.error('Failed to insert notifications', error);
        await Swal.fire({ icon: 'error', title: 'Failed', text: error.message || 'Could not send notifications' });
        setLoading(false);
        return;
      }

      await Swal.fire({ icon: 'success', title: 'Sent', text: `Notifications queued for ${rows.length} users.` });
      // reset
      setTitle('');
      setDescription('');
      setAbout('');
      setScheduledAt(null);
      setSelectedIds({});
      setSpecificUser(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      await Swal.fire({ icon: 'error', title: 'Error', text: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminKeyGate>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Send Notification</h2>
            <div className="text-sm text-gray-500">Use this panel to send alerts to users</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <input className="w-full rounded-lg border px-4 py-2" placeholder="Event title" value={title} onChange={(e)=>setTitle(e.target.value)} />
              <textarea className="w-full rounded-lg border px-4 py-2 min-h-[120px]" placeholder="Event description" value={description} onChange={(e)=>setDescription(e.target.value)} />
              <input className="w-full rounded-lg border px-4 py-2" placeholder="About (optional)" value={about} onChange={(e)=>setAbout(e.target.value)} />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold">Recipients</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='all'} onChange={()=>setMode('all')} /> All users</label>
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='specific'} onChange={()=>setMode('specific')} /> Specific user</label>
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='selected'} onChange={()=>setMode('selected')} /> Selected users</label>
              </div>

              {mode === 'specific' && (
                <select className="w-full rounded-lg border px-3 py-2" value={specificUser||''} onChange={(e)=>setSpecificUser(e.target.value||null)}>
                  <option value="">Select user</option>
                  {users.map(u=> <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              )}

              {mode === 'selected' && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input placeholder="Filter users..." className="flex-1 rounded-lg border px-3 py-2" value={filter} onChange={(e)=>setFilter(e.target.value)} />
                  </div>
                  <div className="max-h-48 overflow-auto rounded-lg border p-2">
                    {users.filter(u=> (u.full_name||u.email).toLowerCase().includes(filter.toLowerCase())).map(u=> (
                      <label key={u.id} className="flex items-center justify-between gap-2 py-1 px-2 hover:bg-gray-50">
                        <div className="flex items-center gap-2"><input type="checkbox" checked={!!selectedIds[u.id]} onChange={()=>toggleSelect(u.id)} /> <div className="text-sm">{u.full_name || u.email}</div></div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold">Schedule time (optional)</label>
                <input type="datetime-local" className="w-full rounded-lg border px-3 py-2" value={scheduledAt||''} onChange={(e)=>setScheduledAt(e.target.value||null)} />
              </div>

              <div className="flex gap-2">
                <button disabled={loading} onClick={handleSend} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
                  <Send className="h-4 w-4" /> Send
                </button>
                <button type="button" onClick={()=>{setTitle(''); setDescription(''); setAbout(''); setSelectedIds({}); setSpecificUser(null); setScheduledAt(null);}} className="inline-flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg">
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminKeyGate>
  );
};

export default NotificationsManagement;
