import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Wrench } from 'lucide-react';

interface Booking {
  id: number;
  mechanic_id: number;
  mechanic_name: string;
  mechanic_profile_pic: string | null;
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

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  requested: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={14} /> },
};

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    apiGet('/bookings').then(res => res.json()).then(data => {
      if (data.success) setBookings(data.bookings);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const completeBooking = async (id: number) => {
    await apiPost(`/bookings/${id}/complete`);
    setBookings(prev => prev.map(b => b.id === id ? {...b, status: 'completed'} : b));
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-1">Track all your mechanic bookings</p>
          </div>
          <Link href="/mechanics" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 transition-opacity no-underline">
            + New Booking
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white/80 rounded-3xl border border-black/10 shadow-lg">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No bookings yet</h3>
            <p className="text-gray-400 mt-2 mb-6">Find a mechanic and make your first booking!</p>
            <Link href="/mechanics" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold no-underline">
              Find Mechanics
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const st = STATUS_STYLES[b.status] || { label: b.status, cls: 'bg-gray-100 text-gray-600', icon: <AlertCircle size={14} /> };
              return (
                <div key={b.id} className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {b.mechanic_profile_pic ? (
                          <img src={b.mechanic_profile_pic} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center border-2 border-white shadow">
                            <span className="text-white font-black">{(b.mechanic_name || 'M')[0]}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-black text-gray-900">{b.mechanic_name}</h3>
                          <p className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                        {st.icon} {st.label}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" /><span>{b.address}</span></div>
                      <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400 shrink-0" /><span>{new Date(b.preferred_time).toLocaleString()}</span></div>
                      <div className="flex items-start gap-2"><Wrench size={14} className="text-gray-400 mt-0.5 shrink-0" /><span className="line-clamp-2">{b.problem_description}</span></div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Offer:</span>
                        <span className="font-bold text-gray-900">৳{b.offer}</span>
                      </div>
                      {b.counter_offer && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Counter:</span>
                          <span className="font-bold text-[#7e57c2]">৳{b.counter_offer}</span>
                        </div>
                      )}
                      <span className="text-gray-400 capitalize">{b.payment_method}</span>
                    </div>

                    {b.counter_note && (
                      <div className="mt-3 p-3 rounded-xl bg-[#7e57c2]/10 text-sm text-[#7e57c2]">
                        <strong>Mechanic note:</strong> {b.counter_note}
                      </div>
                    )}

                    {b.status === 'confirmed' && (
                      <button onClick={() => completeBooking(b.id)}
                        className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                        Mark as Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
