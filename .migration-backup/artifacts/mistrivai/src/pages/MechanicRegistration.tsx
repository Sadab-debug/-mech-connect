import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Wrench, ChevronRight, User, Mail, Lock, Phone, MapPin } from 'lucide-react';

export default function MechanicRegistration() {
  const { refresh } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', mobile: '', address: '',
    workshop_name: '', experience: '', expertise: '', hourly_rate: '',
    working_hours: '', education: '', age: '',
    nid_number: '', birth_certificate_number: '', work_history: '',
  });

  const update = (k: keyof typeof form, v: string) => setForm(prev => ({...prev, [k]: v}));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiPost('/mechanic/submit-proposal', form);
      const data = await res.json();
      if (data.success) {
        await refresh();
        navigate('/mechanic-status');
      } else {
        setError(data.message || 'Submission failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]";

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#20c997] to-[#7e57c2]"></span>
            <span className="font-black text-2xl text-gray-900">MistriVai</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Join as a Mechanic</h1>
          <p className="text-gray-500">Submit your application to become a verified mechanic</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all
                ${step >= s ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2]' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-black/10 shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input value={form.full_name} onChange={e => update('full_name', e.target.value)} required placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
                    <input type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="25" min="18" max="70" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="your@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                  <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required placeholder="••••••••" minLength={6} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                  <input type="tel" value={form.mobile} onChange={e => update('mobile', e.target.value)} placeholder="+880 1700000000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Your full address" className={inputCls} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 mb-4">Professional Details</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Workshop Name *</label>
                  <input value={form.workshop_name} onChange={e => update('workshop_name', e.target.value)} required placeholder="Your workshop name" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience (years)</label>
                    <input type="number" value={form.experience} onChange={e => update('experience', e.target.value)} placeholder="5" min="0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hourly Rate (৳)</label>
                    <input type="number" value={form.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} placeholder="200" min="0" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Expertise / Skills</label>
                  <input value={form.expertise} onChange={e => update('expertise', e.target.value)} placeholder="Engine repair, AC, Brakes (comma separated)" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Working Hours</label>
                  <input value={form.working_hours} onChange={e => update('working_hours', e.target.value)} placeholder="9 AM - 6 PM" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                  <input value={form.education} onChange={e => update('education', e.target.value)} placeholder="SSC / Diploma / BSc" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Work History</label>
                  <textarea value={form.work_history} onChange={e => update('work_history', e.target.value)} placeholder="Describe previous work experience..." rows={3} className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 mb-4">Identity Verification</h3>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
                  Your identity information is kept confidential and only used for verification purposes.
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NID Number</label>
                  <input value={form.nid_number} onChange={e => update('nid_number', e.target.value)} placeholder="National ID number" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Birth Certificate Number</label>
                  <input value={form.birth_certificate_number} onChange={e => update('birth_certificate_number', e.target.value)} placeholder="Birth certificate number" className={inputCls} />
                </div>

                {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

                <div className="p-4 rounded-xl bg-gradient-to-r from-[#20c997]/10 to-[#7e57c2]/10 border border-black/5 text-sm text-gray-600">
                  By submitting, you agree to our terms and confirm that all information provided is accurate. Your application will be reviewed within 2-3 business days.
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="px-6 py-3 rounded-xl border border-black/10 text-gray-700 font-bold hover:bg-gray-50">
                  Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold hover:opacity-90">
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold hover:opacity-90 disabled:opacity-60">
                  {loading ? 'Submitting...' : <><Wrench size={18} /> Submit Application</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
