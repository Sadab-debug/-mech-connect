import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Clock, DollarSign, Wrench, Zap, MapPin, Phone, Shield, Star, TrendingDown, TrendingUp } from 'lucide-react';

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

interface EmergencyReq {
  id: number;
  description: string;
  location: string;
  contact_number: string;
  budget: number | null;
  user_name: string;
  created_at: string;
}

function TrustScoreCard({ score, rating, reviewCount, complaintCount }: { score: number; rating: number; reviewCount: number; complaintCount: number }) {
  const color = score >= 4.5 ? 'text-green-600' : score >= 3.5 ? 'text-blue-600' : score >= 2.5 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 4.5 ? 'from-green-50 to-emerald-50 border-green-200' : score >= 3.5 ? 'from-blue-50 to-sky-50 border-blue-200' : score >= 2.5 ? 'from-yellow-50 to-amber-50 border-yellow-200' : 'from-red-50 to-rose-50 border-red-200';
  const label = score >= 4.5 ? 'Highly Trusted' : score >= 3.5 ? 'Trusted' : score >= 2.5 ? 'Average' : 'Low Trust';
  const stars = Math.round(score);

  return (
    <div className={`p-5 rounded-2xl border bg-gradient-to-br ${bg} mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className={color} />
          <span className="font-black text-gray-900 text-sm">Trust Score</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} bg-white/70 border`}>{label}</span>
      </div>
      <div className="flex items-end gap-3 mb-3">
        <span className={`text-4xl font-black ${color}`}>{(score ?? 3).toFixed(1)}</span>
        <span className="text-gray-400 text-sm mb-1">/ 5.0</span>
        <div className="flex mb-1">
          {[1,2,3,4,5].map(n => <Star key={n} size={14} className={n <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/60 rounded-xl p-2">
          <p className="text-lg font-black text-gray-900">{(rating || 0).toFixed(1)}</p>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2">
          <p className="text-lg font-black text-gray-900">{reviewCount || 0}</p>
          <p className="text-xs text-gray-500">Reviews</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2">
          <p className={`text-lg font-black ${(complaintCount || 0) > 0 ? 'text-red-500' : 'text-gray-900'}`}>{complaintCount || 0}</p>
          <p className="text-xs text-gray-500">Complaints</p>
        </div>
      </div>
      {(complaintCount || 0) > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
          <TrendingDown size={12} /> Each complaint reduces your trust score by 0.3 points
        </div>
      )}
      {(reviewCount || 0) === 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
          <TrendingUp size={12} /> Complete jobs and get 5-star reviews to boost your score
        </div>
      )}
    </div>
  );
}

export default function MechanicDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyReq[]>([]);
  const [mechanicData, setMechanicData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [counterForms, setCounterForms] = useState<Record<number, { offer: string; note: string }>>({});

  const loadData = useCallback(() => {
    if (!user) return;
    Promise.all([
      apiGet('/mechanic/bookings').then(r => r.json()),
      apiGet('/emergency').then(r => r.json()),
      apiGet('/mechanic/profile').then(r => r.json()),
    ]).then(([bd, ed, md]) => {
      if (bd.success) setBookings(bd.bookings);
      if (ed.success) setEmergencies(ed.requests);
      if (md.success) setMechanicData(md.mechanic);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'mechanic') { navigate('/'); return; }
    if (!user.is_approved) { navigate('/mechanic-status'); return; }
    loadData();
    const interval = setInterval(() => {
      apiGet('/emergency').then(r => r.json()).then(d => { if (d.success) setEmergencies(d.requests); });
    }, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading, loadData]);

  const accept = async (id: number) => {
    await apiPost(`/mechanic/bookings/${id}/accept`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
  };
  const reject = async (id: number) => {
    await apiPost(`/mechanic/bookings/${id}/reject`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
  };
  const sendCounter = async (id: number) => {
    const cf = counterForms[id];
    if (!cf) return;
    await apiPost(`/mechanic/bookings/${id}/counter`, { counter_offer: parseFloat(cf.offer), note: cf.note });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, counter_offer: parseFloat(cf.offer), counter_note: cf.note } : b));
    setCounterForms(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const acceptEmergency = async (id: number) => {
    setAccepting(id);
    try {
      const res = await apiPost(`/emergency/${id}/accept`);
      const data = await res.json();
      if (data.success) {
        setEmergencies(prev => prev.filter(e => e.id !== id));
        alert(`Emergency accepted! A booking has been created (৳${data.premium_offer}). Check your bookings.`);
        loadData();
      }
    } finally { setAccepting(null); }
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
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Mechanic Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || user?.username}</p>
        </div>

        {mechanicData && (
          <TrustScoreCard
            score={mechanicData.trust_score}
            rating={mechanicData.rating}
            reviewCount={mechanicData.review_count}
            complaintCount={mechanicData.complaint_count}
          />
        )}

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

        {emergencies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <Zap size={18} className="text-red-500" />
              </div>
              Emergency Requests ({emergencies.length})
              <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </h2>
            <div className="space-y-3">
              {emergencies.map(e => (
                <div key={e.id} className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-black">EMERGENCY</span>
                        <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="font-bold text-gray-900">{e.user_name}</p>
                    </div>
                    {e.budget && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Budget</p>
                        <p className="font-black text-gray-900">৳{e.budget}</p>
                        <p className="text-xs text-orange-600 font-semibold">+20% premium = ৳{Math.round(e.budget * 1.2)}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    <div className="flex items-start gap-2"><Wrench size={14} className="text-gray-400 mt-0.5 shrink-0" /><span>{e.description}</span></div>
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 shrink-0" /><span>{e.location}</span></div>
                    {e.contact_number && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400 shrink-0" /><span>{e.contact_number}</span></div>}
                  </div>
                  <button
                    onClick={() => acceptEmergency(e.id)}
                    disabled={accepting === e.id}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-red-500/30">
                    {accepting === e.id ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Zap size={16} />}
                    Accept Emergency (+20% fee)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{b.problem_description}</p>
                    </div>
                    <span className="font-black text-[#20c997] text-lg shrink-0">৳{b.offer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && emergencies.length === 0 && (
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
