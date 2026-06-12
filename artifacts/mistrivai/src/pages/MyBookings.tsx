import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Wrench, ThumbsUp, ThumbsDown, Star, Flag, Shield } from 'lucide-react';

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
  has_review: boolean;
  has_complaint: boolean;
}

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  requested: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
  completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={14} /> },
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110">
          <Star size={28} className={`${(hover || value) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ booking, onClose, onSubmit }: { booking: Booking; onClose: () => void; onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!rating) { setError('Please select a rating'); return; }
    setLoading(true);
    try {
      const res = await apiPost(`/bookings/${booking.id}/review`, { rating, comment });
      const data = await res.json();
      if (data.success) { onSubmit(); onClose(); }
      else setError(data.message || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center"><Star size={20} className="text-yellow-500 fill-yellow-400" /></div>
          <div>
            <h3 className="font-black text-gray-900">Rate {booking.mechanic_name}</h3>
            <p className="text-xs text-gray-400">Booking #{booking.id}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Your Rating *</p>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && <p className="text-xs text-gray-400 mt-1">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comment (optional)</label>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Share your experience to help others..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] resize-none text-sm" />
        </div>
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700 mb-4">
          <Shield size={12} className="inline mr-1" /> Reviews are verified through EasyMistri bookings only, ensuring authenticity.
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Star size={14} />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintModal({ booking, onClose, onSubmit }: { booking: Booking; onClose: () => void; onSubmit: () => void }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!description.trim()) { setError('Please describe the issue'); return; }
    setLoading(true);
    try {
      const res = await apiPost(`/bookings/${booking.id}/complaint`, { description: description.trim() });
      const data = await res.json();
      if (data.success) { onSubmit(); onClose(); }
      else setError(data.message || 'Failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Flag size={20} className="text-red-500" /></div>
          <div>
            <h3 className="font-black text-gray-900">File a Complaint</h3>
            <p className="text-xs text-gray-400">Against {booking.mechanic_name}</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Describe the issue *</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What went wrong? (poor quality, no-show, overcharged, etc.)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none text-sm" />
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-xs text-orange-700 mb-4">
          Complaints lower the mechanic's Trust Score. Our team reviews all complaints within 24 hours.
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> : <Flag size={14} />}
            Submit Complaint
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [complaintModal, setComplaintModal] = useState<Booking | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    apiGet('/bookings').then(res => res.json()).then(data => {
      if (data.success) setBookings(data.bookings);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const completeBooking = async (id: number) => {
    setActioning(id);
    await apiPost(`/bookings/${id}/complete`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
    setActioning(null);
  };

  const acceptCounter = async (id: number, counterOffer: number) => {
    setActioning(id);
    const res = await apiPost(`/bookings/${id}/counter-accept`);
    const data = await res.json();
    if (data.success) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', offer: counterOffer } : b));
    setActioning(null);
  };

  const rejectCounter = async (id: number) => {
    setActioning(id);
    const res = await apiPost(`/bookings/${id}/counter-reject`);
    const data = await res.json();
    if (data.success) setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected', counter_offer: null, counter_note: null } : b));
    setActioning(null);
  };

  const onReviewSubmitted = (bookingId: number) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, has_review: true } : b));
  };

  const onComplaintSubmitted = (bookingId: number) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, has_complaint: true } : b));
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
              const hasCounter = b.counter_offer && b.status === 'requested';
              const isCompleted = b.status === 'completed';
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
                        <span className={`font-bold ${hasCounter ? 'line-through text-gray-400' : 'text-gray-900'}`}>৳{b.offer}</span>
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

                    {hasCounter && (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                        <p className="text-sm font-black text-amber-800 mb-3">Mechanic sent a counter offer of ৳{b.counter_offer}</p>
                        <div className="flex gap-3">
                          <button onClick={() => acceptCounter(b.id, b.counter_offer!)} disabled={actioning === b.id}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#20c997] text-white font-bold text-sm hover:opacity-90 disabled:opacity-60">
                            <ThumbsUp size={15} /> Accept ৳{b.counter_offer}
                          </button>
                          <button onClick={() => rejectCounter(b.id)} disabled={actioning === b.id}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-60">
                            <ThumbsDown size={15} /> Decline
                          </button>
                        </div>
                      </div>
                    )}

                    {b.status === 'confirmed' && (
                      <button onClick={() => completeBooking(b.id)} disabled={actioning === b.id}
                        className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                        {actioning === b.id ? 'Marking...' : 'Mark as Completed'}
                      </button>
                    )}

                    {isCompleted && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2 text-xs text-blue-700 font-semibold">
                          <Shield size={14} /> EasyMistri Guarantee: 30-day service warranty on all platform bookings
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {!b.has_review ? (
                            <button onClick={() => setReviewModal(b)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold text-sm hover:bg-yellow-100 transition-colors">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" /> Leave Review
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" /> Reviewed
                            </div>
                          )}
                          {!b.has_complaint ? (
                            <button onClick={() => setComplaintModal(b)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
                              <Flag size={14} /> File Complaint
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold">
                              <Flag size={14} /> Complaint Filed
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={() => onReviewSubmitted(reviewModal.id)}
        />
      )}
      {complaintModal && (
        <ComplaintModal
          booking={complaintModal}
          onClose={() => setComplaintModal(null)}
          onSubmit={() => onComplaintSubmitted(complaintModal.id)}
        />
      )}
    </div>
  );
}
