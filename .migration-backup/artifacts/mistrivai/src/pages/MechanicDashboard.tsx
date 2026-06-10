import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Clock, MessageSquare, DollarSign, Calendar, Wrench } from 'lucide-react';

interface Booking {
  id: number;
  user_name: string;
  address: string;
  preferred_time: string;
  problem_description: string;
  offer: number;
  payment_method: string;
  status: string;
  counter_offer: number | null;
  counter_note: string | null;
  created_at: string;
}

export default function MechanicDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterForms, setCounterForms] = useState<Record<number, { offer: string; note: string }>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'mechanic') { navigate('/'); return; }
    if (!user.is_approved) { navigate('/mechanic-status'); return; }
    apiGet('/mechanic/bookings').then(res => res.json()).then(data => {
      if (data.success) setBookings(data.bookings);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const accept = async (id: number) => {
    await apiPost(`/mechanic/bookings/${id}/accept`);
    setBookings(prev => prev.map(b => b.id === id ? {...b, status: 'confirmed'} : b));
  };
  const reject = async (id: number) => {
    await apiPost(`/mechanic/bookings/${id}/reject`);
    setBookings(prev => prev.map(b => b.id === id ? {...b, status: 'rejected'} : b));
  };
  const sendCounter = async (id: number) => {
    const cf = counterForms[id];
    if (!cf) return;
    await apiPost(`/mechanic/bookings/${id}/counter`, { counter_offer: parseFloat(cf.offer), note: cf.note });
    setBookings(prev => prev.map(b => b.id === id ? {...b, counter_offer: parseFloat(cf.offer), counter_note: cf.note} : b));
    setCounterForms(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  const requested = bookings.filter(b => b.status === 'requested');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const completed = bookings.filter(b => b.status === 'completed');
  const totalEarned = completed.reduce((s, b) => s + (b.offer || 0), 0);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Mechanic Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || user?.username}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', count: requested.length, icon: <Clock size={20} className="text-yellow-500" />, cls: 'bg-yellow-50 border-yellow-200' },
            { label: 'Confirmed', count: confirmed.length, icon: <CheckCircle size={20} className="text-green-500" />, cls: 'bg-green-50 border-green-200' },
            { label: 'Total Earned', count: `৳${totalEarned.toFixed(0)}`, icon: <DollarSign size={20} className="text-[#20c997]" />, cls: 'bg-teal-50 border-teal-200' },
          ].map(stat => (
            <div key={stat.label} className={`p-5 rounded-2xl border ${stat.cls} flex items-center gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">{stat.icon}</div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stat.count}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {requested.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" /> Pending Requests ({requested.length})
            </h2>
            <div className="space-y-4">
              {requested.map(b => (
                <div key={b.id} className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-black text-gray-900 text-lg">{b.user_name}</span>
                      <p className="text-xs text-gray-400">{new Date(b.created_at).toLocaleString()}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">Pending</span>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    <p><strong>Address:</strong> {b.address}</p>
                    <p><strong>Time:</strong> {new Date(b.preferred_time).toLocaleString()}</p>
                    <p><strong>Problem:</strong> {b.problem_description}</p>
                    <p><strong>Offer:</strong> <span className="font-bold text-gray-900">৳{b.offer}</span> ({b.payment_method})</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => accept(b.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#20c997] text-white font-bold text-sm hover:opacity-90">
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button onClick={() => reject(b.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:opacity-90">
                      <XCircle size={16} /> Reject
                    </button>
                    <button onClick={() => setCounterForms(prev => ({ ...prev, [b.id]: { offer: '', note: '' } }))}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#7e57c2] text-[#7e57c2] font-bold text-sm hover:bg-[#7e57c2]/10">
                      Counter Offer
                    </button>
                  </div>
                  {counterForms[b.id] && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" placeholder="Counter offer (৳)" value={counterForms[b.id].offer}
                          onChange={e => setCounterForms(prev => ({ ...prev, [b.id]: { ...prev[b.id], offer: e.target.value } }))}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40" />
                        <input type="text" placeholder="Note (optional)" value={counterForms[b.id].note}
                          onChange={e => setCounterForms(prev => ({ ...prev, [b.id]: { ...prev[b.id], note: e.target.value } }))}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40" />
                      </div>
                      <button onClick={() => sendCounter(b.id)}
                        className="px-5 py-2 rounded-lg bg-[#7e57c2] text-white font-bold text-sm hover:opacity-90">
                        Send Counter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {confirmed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" /> Confirmed Jobs ({confirmed.length})
            </h2>
            <div className="space-y-3">
              {confirmed.map(b => (
                <div key={b.id} className="bg-white/80 rounded-2xl border border-green-200 shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900">{b.user_name}</span>
                      <p className="text-sm text-gray-500">{b.address} · {new Date(b.preferred_time).toLocaleString()}</p>
                    </div>
                    <span className="font-black text-[#20c997] text-lg">৳{b.offer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <div className="text-center py-20 bg-white/80 rounded-3xl border border-black/10 shadow-lg">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No bookings yet</h3>
            <p className="text-gray-400 mt-2">Customers will book you once they find your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
