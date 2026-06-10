import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus, Wrench, CheckCircle } from 'lucide-react';

export default function Signup() {
  const { refresh } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const FLASK_BASE = import.meta.env.VITE_FLASK_API_URL || '/flask';
      const res = await fetch(`${FLASK_BASE}/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await refresh();
        navigate('/');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const perks = ['Free to join', 'Instant booking', 'Verified mechanics', 'Safe & secure'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 pb-20 md:pb-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shadow-md">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-black text-2xl text-gray-900">MistriVai</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 mt-2">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of happy customers</p>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle size={12} className="text-[#20c997]" /> {p}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                  placeholder="username"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                  placeholder="Min. 6 characters" minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <span className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center shrink-0 text-xs font-bold">!</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-[#7e57c2]/25 hover:opacity-90 transition-opacity disabled:opacity-60 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> Creating Account...</>
              ) : (
                <><UserPlus size={18} /> Create Free Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5 pt-5 border-t border-gray-100">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#7e57c2] no-underline hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Want to register as mechanic?{' '}
            <Link href="/mechanic-registration" className="font-bold text-[#20c997] no-underline hover:underline">Join here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
