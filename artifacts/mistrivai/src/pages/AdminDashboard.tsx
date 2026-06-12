import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Users, Wrench, Calendar, CheckCircle, XCircle, Eye, ChevronUp, Flag, AlertTriangle } from 'lucide-react';

interface Pending {
  proposal_id: number;
  mechanic_id: number;
  name: string;
  email: string;
  mobile: string;
  profile_pic: string | null;
  submitted_at: string;
  experience_years: number | null;
  skills: string | null;
}

interface Complaint {
  id: number;
  booking_id: number;
  user_name: string;
  mechanic_name: string;
  description: string;
  status: string;
  created_at: string;
}

type Tab = 'pending' | 'users' | 'bookings' | 'complaints';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mechanicDetails, setMechanicDetails] = useState<Record<number, any>>({});
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/'); return; }
    Promise.all([
      apiGet('/api/stats').then(r => r.json()),
      apiGet('/admin/pending-mechanics').then(r => r.json()),
      apiGet('/api/users').then(r => r.json()),
      apiGet('/admin/all-bookings').then(r => r.json()),
      apiGet('/admin/complaints').then(r => r.json()),
    ]).then(([s, p, u, b, c]) => {
      if (s.success) setStats(s);
      if (p.success) setPending(p.pending);
      if (u.success) setUsers(u.users);
      if (b.success) setBookings(b.bookings);
      if (c.success) setComplaints(c.complaints);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const approveMechanic = async (mechanic_id: number) => {
    await apiPost(`/admin/mechanic/${mechanic_id}/approve`);
    setPending(prev => prev.filter(p => p.mechanic_id !== mechanic_id));
    if (stats) setStats((s: any) => ({ ...s, total_mechanics: s.total_mechanics + 1 }));
  };

  const rejectMechanic = async (mechanic_id: number) => {
    await apiPost(`/admin/mechanic/${mechanic_id}/reject`, { notes: '' });
    setPending(prev => prev.filter(p => p.mechanic_id !== mechanic_id));
  };

  const loadMechanicDetails = async (mechanic_id: number) => {
    if (mechanicDetails[mechanic_id]) return;
    const res = await apiGet(`/admin/mechanic/${mechanic_id}`);
    const data = await res.json();
    if (data.success) setMechanicDetails(prev => ({ ...prev, [mechanic_id]: data.mechanic }));
  };

  const toggleExpand = (mid: number) => {
    setExpanded(prev => prev === mid ? null : mid);
    loadMechanicDetails(mid);
  };

  const resolveComplaint = async (id: number, action: 'resolved' | 'dismissed') => {
    setResolvingId(id);
    await apiPost(`/admin/complaints/${id}/resolve`, { action });
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
    setResolvingId(null);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  const openComplaints = complaints.filter(c => c.status === 'open');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'users', label: 'Users', count: users.length },
    { key: 'bookings', label: 'Bookings', count: bookings.length },
    { key: 'complaints', label: 'Complaints', count: openComplaints.length },
  ];

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage EasyMistri platform</p>
        </div>

        {stats && (
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Users size={20} className="text-blue-500" />, label: 'Total Users', value: stats.total_users, cls: 'bg-blue-50 border-blue-200' },
              { icon: <Wrench size={20} className="text-[#20c997]" />, label: 'Mechanics', value: stats.total_mechanics, cls: 'bg-teal-50 border-teal-200' },
              { icon: <Calendar size={20} className="text-[#7e57c2]" />, label: 'Bookings', value: stats.total_bookings, cls: 'bg-purple-50 border-purple-200' },
              { icon: <Flag size={20} className="text-red-500" />, label: 'Open Complaints', value: openComplaints.length, cls: 'bg-red-50 border-red-200' },
            ].map(s => (
              <div key={s.label} className={`p-5 rounded-2xl border ${s.cls} flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">{s.icon}</div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex rounded-xl border border-black/10 p-1 bg-gray-50/80 mb-6 w-fit flex-wrap gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white shadow-md' : 'text-gray-600 hover:bg-white/70'}`}>
              {t.key === 'complaints' && <Flag size={13} />}
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/30' : 'bg-gray-200'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 && (
              <div className="text-center py-16 bg-white/80 rounded-3xl border border-black/10">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
                <p className="font-bold text-gray-500">No pending applications</p>
              </div>
            )}
            {pending.map(p => (
              <div key={p.mechanic_id} className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.profile_pic ? (
                        <img src={p.profile_pic} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center border-2 border-white shadow">
                          <span className="text-white font-black text-xl">{p.name[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-black text-gray-900">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.email}</p>
                        <p className="text-xs text-gray-400">{new Date(p.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleExpand(p.mechanic_id)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                        {expanded === p.mechanic_id ? <ChevronUp size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => approveMechanic(p.mechanic_id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#20c997] text-white font-bold text-sm hover:opacity-90">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => rejectMechanic(p.mechanic_id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white font-bold text-sm hover:opacity-90">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                  {expanded === p.mechanic_id && mechanicDetails[p.mechanic_id] && (
                    <div className="mt-4 pt-4 border-t border-black/10 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      {Object.entries(mechanicDetails[p.mechanic_id]).filter(([k, v]) => v && !['id', 'profile_pic', 'is_approved', 'is_active'].includes(k)).map(([k, v]) => (
                        <div key={k}><strong className="text-gray-700 capitalize">{k.replace(/_/g, ' ')}:</strong> {String(v)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-black/10">
                  <tr>{['ID', 'Username', 'Email', 'Full Name', 'Role', 'Joined'].map(h => <th key={h} className="text-left px-4 py-3 font-bold text-gray-700">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600">{u.full_name || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold capitalize">{u.role}</span></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center py-10 text-gray-400">No users yet</p>}
            </div>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-black/10">
                  <tr>{['ID', 'User', 'Mechanic', 'Status', 'Offer', 'Address', 'Date'].map(h => <th key={h} className="text-left px-4 py-3 font-bold text-gray-700">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">#{b.id}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{b.user_name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.mechanic_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">৳{b.offer}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-32 truncate">{b.address}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <p className="text-center py-10 text-gray-400">No bookings yet</p>}
            </div>
          </div>
        )}

        {tab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 && (
              <div className="text-center py-16 bg-white/80 rounded-3xl border border-black/10">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
                <p className="font-bold text-gray-500">No complaints filed yet</p>
              </div>
            )}
            {complaints.map(c => (
              <div key={c.id} className={`bg-white/80 backdrop-blur rounded-2xl border shadow-lg p-5 ${c.status === 'open' ? 'border-red-200' : 'border-black/10'}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.status === 'open' ? 'bg-red-100' : c.status === 'resolved' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {c.status === 'open' ? <AlertTriangle size={16} className="text-red-500" /> : c.status === 'resolved' ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-gray-900 text-sm">{c.user_name}</span>
                        <span className="text-gray-400 text-xs">→</span>
                        <span className="font-semibold text-gray-700 text-sm">{c.mechanic_name}</span>
                        <span className="text-xs text-gray-400">Booking #{c.booking_id}</span>
                      </div>
                      <p className="text-sm text-gray-600">{c.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${c.status === 'open' ? 'bg-red-100 text-red-700' : c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status}
                    </span>
                    {c.status === 'open' && (
                      <>
                        <button
                          onClick={() => resolveComplaint(c.id, 'resolved')}
                          disabled={resolvingId === c.id}
                          className="px-3 py-1.5 rounded-lg bg-green-500 text-white font-bold text-xs hover:opacity-90 disabled:opacity-60">
                          Resolve
                        </button>
                        <button
                          onClick={() => resolveComplaint(c.id, 'dismissed')}
                          disabled={resolvingId === c.id}
                          className="px-3 py-1.5 rounded-lg bg-gray-400 text-white font-bold text-xs hover:opacity-90 disabled:opacity-60">
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
