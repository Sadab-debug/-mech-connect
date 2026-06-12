import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Wrench, LogIn, User, Shield } from 'lucide-react';

const roles = [
  { value: 'user', label: 'Customer', icon: <User size={18} />, desc: 'Book mechanics' },
  { value: 'mechanic', label: 'Mechanic', icon: <Wrench size={18} />, desc: 'Manage jobs' },
  { value: 'admin', label: 'Admin', icon: <Shield size={18} />, desc: 'Admin panel' },
] as const;

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'mechanic' | 'admin'>('user');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, role);
      if (result.success) {
        if (role === 'admin') navigate('/admin');
        else if (role === 'mechanic') navigate('/mechanic-dashboard');
        else navigate('/');
      } else {
        setError(result.message || 'Login failed. Check your credentials and selected role.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 no-underline mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shadow-md">
              <Wrench size={18} className="text-white" />
            </div>
            <span className="font-black text-2xl text-gray-900">EasyMistri</span>
          </Link>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 sm:p-8">

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sign in as</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center
                    ${role === r.value
                      ? 'border-[#7e57c2] bg-[#7e57c2]/8 text-[#7e57c2] shadow-sm'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'}`}>
                  <span className={`transition-colors ${role === r.value ? 'text-[#7e57c2]' : 'text-gray-400'}`}>
                    {r.icon}
                  </span>
                  <span className="text-xs font-bold leading-none">{r.label}</span>
                  <span className="text-[10px] text-gray-400 leading-none hidden sm:block">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <span className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center shrink-0 text-red-600 font-bold text-xs mt-0.5">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-[#7e57c2]/25 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-1">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> Signing in...</>
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-center text-sm text-gray-500">
            <p>Don't have an account?{' '}
              <Link href="/signup" className="font-bold text-[#7e57c2] no-underline hover:underline">Sign up free</Link>
            </p>
            <p>Are you a mechanic?{' '}
              <Link href="/mechanic-registration" className="font-bold text-[#20c997] no-underline hover:underline">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
