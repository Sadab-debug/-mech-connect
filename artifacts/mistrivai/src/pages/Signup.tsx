import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(1200px 600px at 20% 10%, rgba(32,201,151,0.12), transparent 60%), radial-gradient(900px 500px at 80% 0%, rgba(126,87,194,0.14), transparent 55%), linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#20c997] to-[#7e57c2]"></span>
            <span className="font-black text-2xl text-gray-900">MistriVai</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500">Join MistriVai today</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-black/10 shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                  placeholder="username"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                  placeholder="••••••••" minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-teal-500/25 hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? 'Creating Account...' : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#7e57c2] hover:underline no-underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
