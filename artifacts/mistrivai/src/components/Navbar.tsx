import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Menu, X, Wrench, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navLinks = () => {
    if (!user) {
      return [
        { label: 'Home', href: '/' },
        { label: 'Find Mechanics', href: '/mechanics' },
        { label: 'Login', href: '/login' },
        { label: 'Sign Up', href: '/signup' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Bookings', href: '/admin/bookings' },
        { label: 'Chat', href: '/chat' },
      ];
    }
    if (user.role === 'mechanic') {
      return [
        { label: 'Dashboard', href: '/mechanic-dashboard' },
        { label: 'Bookings', href: '/mechanic-dashboard' },
        { label: 'Chat', href: '/chat' },
      ];
    }
    return [
      { label: 'Home', href: '/' },
      { label: 'Find Mechanics', href: '/mechanics' },
      { label: 'My Bookings', href: '/bookings' },
      { label: 'Chat', href: '/chat' },
    ];
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10"
      style={{ background: 'rgba(3,51,43,0.85)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-[#20c997] to-[#7e57c2] shadow-lg shadow-teal-500/30"></span>
          <span className="text-white font-black text-xl tracking-wide font-[Poppins]">MistriVai</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks().map(link => (
            <Link key={link.href} href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 no-underline
                ${location === link.href ? 'bg-white/20' : 'hover:bg-[#7e57c2]/70'}`}>
              {link.label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
              <span className="text-white/80 text-sm">{user.full_name || user.username}</span>
              <button onClick={handleLogout}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        <button className="md:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-1 border-t border-white/10">
          {navLinks().map(link => (
            <Link key={link.href} href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-xl text-sm font-semibold text-white hover:bg-white/10 no-underline">
              {link.label}
            </Link>
          ))}
          {user && (
            <button onClick={handleLogout}
              className="block w-full text-left px-4 py-2 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
