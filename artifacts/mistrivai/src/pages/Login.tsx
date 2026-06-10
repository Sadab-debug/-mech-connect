import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Wrench, LogIn } from 'lucide-react';

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
        setError(result.message || 'Login failed');
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
          <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-3xl border border-black/10 shadow-2xl p-8">
          <div className="flex rounded-xl border border-black/10 p-1 mb-6 bg-gray-50/80">
            {(['user', 'mechanic', 'admin'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${role === r ? 'bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white shadow-md' : 'text-gray-600 hover:bg-white/70'}`}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-black/10 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 focus:border-[#7e57c2]" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-teal-500/25 hover:opacity-90 transition-opacity disabled:opacity-60">
              {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-[#7e57c2] hover:underline no-underline">Sign up</Link>
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Are you a mechanic?{' '}
            <Link href="/mechanic-registration" className="font-bold text-[#20c997] hover:underline no-underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
