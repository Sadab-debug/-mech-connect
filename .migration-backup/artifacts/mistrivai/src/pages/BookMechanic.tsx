import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Wrench, CreditCard, ChevronLeft } from 'lucide-react';

interface Mechanic {
  id: number;
  name: string;
  workshop: string;
  expertise: string;
  hourly_rate: number;
  profile_pic: string | null;
}

export default function BookMechanic() {
  const [, params] = useRoute('/book/:id');
  const mechanicId = params?.id;
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    address: '',
    preferred_time: '',
    problem_description: '',
    offer: '',
    payment_method: 'cash',
  });

  useEffect(() => {
    if (!mechanicId) return;
    apiGet(`/mechanics/${mechanicId}`).then(res => res.json()).then(data => {
      if (data.success) setMechanic(data.mechanic);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [mechanicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await apiPost('/bookings', {
        mechanic_id: Number(mechanicId),
        address: form.address,
        preferred_time: new Date(form.preferred_time).toISOString(),
        problem_description: form.problem_description,
        offer: parseFloat(form.offer),
        payment_method: form.payment_method,
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.message || 'Booking failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  if (!mechanic) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Mechanic not found</p></div>;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
        <div className="text-center max-w-md bg-white/80 rounded-3xl border border-black/10 shadow-2xl p-10">
          <div className="w-16 h-16 rounded-full bg-[#20c997]/20 flex items-center justify-center mx-auto mb-4">
            <Wrench className="text-[#20c997]" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Sent!</h2>
          <p className="text-gray-500 mb-6">Your booking request has been sent to {mechanic.name}. You'll be notified when they respond.</p>
          <button onClick={() => navigate('/bookings')}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold hover:opacity-90 transition-opacity">
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
        <div className="text-center max-w-md bg-white/80 rounded-3xl border border-black/10 shadow-2xl p-10">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Sign in Required</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to book a mechanic.</p>
          <a href="/login" className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold no-underline">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/mechanics')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-semibold">
          <ChevronLeft size={18} /> Back to Mechanics
        </button>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-black/10 shadow-2xl p-8">
          <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-gradient-to-r from-[#20c997]/10 to-[#7e57c2]/10 border border-black/5">
            {mechanic.profile_pic ? (
              <img src={mechanic.profile_pic} alt={mechanic.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center border-2 border-white shadow">
                <span className="text-white font-black text-xl">{mechanic.name[0]}</span>
              </div>
            )}
            <div>
              <h2 className="font-black text-gray-900 text-xl">{mechanic.name}</h2>
              <p className="text-[#7e57c2] font-semibold">{mechanic.workshop}</p>
              {mechanic.hourly_rate > 0 && <p className="text-sm text-gray-500">৳{mechanic.hourly_rate}/hr</p>}
            </div>
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-6">Book This Mechanic</h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />Your Address
              </label>
              <input type="text" required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                placeholder="Your full address..."
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />Preferred Date & Time
              </label>
              <input type="datetime-local" required value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <Wrench size={14} className="inline mr-1" />Problem Description
              </label>
              <textarea required value={form.problem_description} onChange={e => setForm({...form, problem_description: e.target.value})}
                placeholder="Describe your vehicle problem in detail..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Offer (৳)</label>
                <input type="number" required min="1" step="0.01" value={form.offer} onChange={e => setForm({...form, offer: e.target.value})}
                  placeholder="500"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <CreditCard size={14} className="inline mr-1" />Payment Method
                </label>
                <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40">
                  <option value="cash">Cash</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60">
              {submitting ? 'Sending Request...' : 'Send Booking Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
