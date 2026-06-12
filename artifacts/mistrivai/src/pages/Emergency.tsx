import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Zap, MapPin, Phone, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface EmergencyReq {
  id: number;
  description: string;
  location: string;
  contact_number: string;
  budget: number | null;
  status: string;
  accepted_by: number | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  open: { label: 'Searching for mechanics...', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={14} className="animate-pulse" /> },
  accepted: { label: 'Mechanic on the way!', cls: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={14} /> },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: <XCircle size={14} /> },
};

export default function EmergencyPage() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [requests, setRequests] = useState<EmergencyReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ description: '', location: '', contact_number: '', budget: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'user') { navigate('/'); return; }
    loadRequests();
  }, [user, authLoading]);

  const loadRequests = () => {
    apiGet('/emergency').then(r => r.json()).then(d => {
      if (d.success) setRequests(d.requests);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.location.trim()) {
      setError('Description and location are required');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await apiPost('/emergency', {
        description: form.description.trim(),
        location: form.location.trim(),
        contact_number: form.contact_number.trim(),
        budget: form.budget ? parseFloat(form.budget) : null,
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Emergency request sent! Nearby mechanics have been alerted.');
        setForm({ description: '', location: '', contact_number: '', budget: '' });
        setShowForm(false);
        loadRequests();
      } else {
        setError(data.message || 'Failed to send request');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id: number) => {
    await apiPost(`/emergency/${id}/cancel`);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div></div>;
  }

  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'accepted');
  const pastRequests = requests.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2">Emergency Mode</h1>
          <p className="text-white/80 text-base">Need urgent help? Alert nearby mechanics instantly.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm text-white/70">
            <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-white/90" /> Instant alerts to nearby mechanics</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-white/90" /> First available accepts</div>
            <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-white/90" /> EasyMistri-backed service</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 font-semibold flex items-center gap-2">
            <CheckCircle size={20} /> {success}
          </div>
        )}

        {openRequests.length === 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xl shadow-2xl shadow-red-500/30 hover:opacity-90 transition-opacity flex items-center justify-center gap-3 mb-8">
            <Zap size={28} /> Need Help Now
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-3xl border border-red-200 shadow-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Describe Your Emergency</h2>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">What's the problem? *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Car won't start, flat tyre, engine overheating..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"><MapPin size={14} className="inline mr-1" />Your Location *</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Full address or landmark"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5"><Phone size={14} className="inline mr-1" />Contact Number</label>
                  <input
                    type="tel"
                    value={form.contact_number}
                    onChange={e => setForm({ ...form, contact_number: e.target.value })}
                    placeholder="+880 1700 000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5"><DollarSign size={14} className="inline mr-1" />Budget (৳)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    placeholder="500"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700 font-medium">
                ⚠️ Emergency bookings include a 20% priority surcharge for immediate service.
              </div>
              {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> Sending...</> : <><Zap size={18} /> Send Alert</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {openRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black text-gray-900 mb-4">Active Requests</h2>
            <div className="space-y-4">
              {openRequests.map(r => {
                const st = STATUS_STYLE[r.status];
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${st.cls} mb-4`}>
                      {st.icon} {st.label}
                    </div>
                    <p className="text-gray-800 font-semibold mb-2">{r.description}</p>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5"><MapPin size={13} /> {r.location}</div>
                      {r.contact_number && <div className="flex items-center gap-1.5"><Phone size={13} /> {r.contact_number}</div>}
                      {r.budget && <div className="flex items-center gap-1.5"><DollarSign size={13} /> Budget: ৳{r.budget} (Priority fee: ৳{Math.round(r.budget * 0.20)} extra)</div>}
                    </div>
                    {r.status === 'open' && (
                      <button onClick={() => cancelRequest(r.id)}
                        className="mt-4 px-4 py-2 rounded-lg text-sm font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors">
                        Cancel Request
                      </button>
                    )}
                    {r.status === 'accepted' && (
                      <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-semibold">
                        A mechanic has accepted your request and is on their way!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pastRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4">Past Requests</h2>
            <div className="space-y-3">
              {pastRequests.map(r => {
                const st = STATUS_STYLE[r.status];
                return (
                  <div key={r.id} className="bg-white/80 rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-700 line-clamp-1">{r.description}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${st.cls}`}>{st.icon} {st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
