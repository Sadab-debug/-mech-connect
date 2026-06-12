import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import {
  Menu, X, Wrench, LogOut, User, ChevronDown,
  Home, Search, BookOpen, LayoutDashboard, Settings,
  UserPlus, Shield, MessageCircle, Clock, Star, Phone
} from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  desc?: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: DropdownItem[];
}

function DropdownMenu({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {items.map((item, i) => (
        <Link key={i} href={item.href}
          onClick={onClose}
          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors no-underline group border-b border-gray-50 last:border-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20c997]/15 to-[#7e57c2]/15 flex items-center justify-center text-[#7e57c2] shrink-0 group-hover:from-[#20c997]/25 group-hover:to-[#7e57c2]/25 transition-colors mt-0.5">
            {item.icon}
          </span>
          <div>
            <div className="text-sm font-semibold text-gray-800 group-hover:text-[#7e57c2] transition-colors">{item.label}</div>
            {item.desc && <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    await logout();
    window.location.href = '/';
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const servicesDropdown: DropdownItem[] = [
    { label: 'Find Mechanics', href: '/mechanics', icon: <Search size={16} />, desc: 'Browse verified mechanics near you' },
    { label: 'Book a Service', href: '/mechanics', icon: <BookOpen size={16} />, desc: 'Schedule car repair & maintenance' },
    { label: 'Emergency Service', href: '/mechanics', icon: <Phone size={16} />, desc: '24/7 roadside assistance' },
    { label: 'Rated Mechanics', href: '/mechanics', icon: <Star size={16} />, desc: 'Top-rated professionals' },
  ];

  const mechanicDropdown: DropdownItem[] = [
    { label: 'Join as Mechanic', href: '/mechanic-registration', icon: <UserPlus size={16} />, desc: 'Register your workshop' },
    { label: 'Mechanic Dashboard', href: '/mechanic-dashboard', icon: <LayoutDashboard size={16} />, desc: 'Manage your bookings' },
    { label: 'Application Status', href: '/mechanic-status', icon: <Clock size={16} />, desc: 'Check your approval status' },
  ];

  const getNavItems = (): NavItem[] => {
    if (!user) {
      return [
        { label: 'Home', href: '/' },
        { label: 'Services', dropdown: servicesDropdown },
        { label: 'For Mechanics', dropdown: mechanicDropdown },
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', href: '/admin' },
        { label: 'Mechanics', href: '/mechanics' },
        { label: 'Chat', href: '/chat' },
      ];
    }
    if (user.role === 'mechanic') {
      return [
        { label: 'Dashboard', href: '/mechanic-dashboard' },
        { label: 'Find Jobs', href: '/mechanics' },
        { label: 'Messages', href: '/chat' },
      ];
    }
    return [
      { label: 'Home', href: '/' },
      { label: 'Services', dropdown: servicesDropdown },
      { label: 'My Bookings', href: '/bookings' },
      { label: 'Messages', href: '/chat' },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shadow-md">
                <Wrench size={18} className="text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-gray-900 font-black text-lg tracking-tight">EasyMistri</span>
                <span className="text-[10px] text-[#20c997] font-semibold tracking-wider uppercase">Bangladesh</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <div key={item.label} className="relative">
                  {item.href ? (
                    <Link href={item.href}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 no-underline
                        ${location === item.href
                          ? 'bg-[#7e57c2]/10 text-[#7e57c2]'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150
                        ${openDropdown === item.label ? 'bg-[#7e57c2]/10 text-[#7e57c2]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                      {item.label}
                      <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {item.dropdown && openDropdown === item.label && (
                    <DropdownMenu items={item.dropdown} onClose={() => setOpenDropdown(null)} />
                  )}
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {!user ? (
                <>
                  <Link href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors no-underline">
                    Login
                  </Link>
                  <Link href="/signup"
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white hover:opacity-90 transition-opacity no-underline shadow-md shadow-[#7e57c2]/20">
                    Sign Up
                  </Link>
                </>
              ) : (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center">
                      <span className="text-white text-sm font-black">
                        {(user.full_name || user.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-800 leading-none">{user.full_name || user.username}</div>
                      <div className="text-[10px] text-gray-400 capitalize mt-0.5">{user.role}</div>
                    </div>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-gradient-to-r from-[#20c997]/10 to-[#7e57c2]/10 border-b border-gray-100">
                        <div className="text-sm font-bold text-gray-800">{user.full_name || user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      {user.role === 'mechanic' && (
                        <Link href="/mechanic-dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 font-medium no-underline transition-colors">
                          <LayoutDashboard size={15} className="text-[#7e57c2]" /> Dashboard
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 font-medium no-underline transition-colors">
                          <Shield size={15} className="text-[#7e57c2]" /> Admin Panel
                        </Link>
                      )}
                      {user.role === 'user' && (
                        <Link href="/bookings" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 font-medium no-underline transition-colors">
                          <BookOpen size={15} className="text-[#7e57c2]" /> My Bookings
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-sm text-red-600 font-medium border-t border-gray-100 transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
            {!user && (
              <div className="flex gap-2 pb-3 border-b border-gray-100 mb-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 no-underline hover:bg-gray-50">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white text-sm font-bold no-underline shadow-md">
                  Sign Up Free
                </Link>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#20c997]/10 to-[#7e57c2]/10 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center shrink-0">
                  <span className="text-white font-black">{(user.full_name || user.username || 'U')[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{user.full_name || user.username}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role} · {user.email}</div>
                </div>
              </div>
            )}

            {navItems.map(item => (
              <div key={item.label}>
                {item.href ? (
                  <Link href={item.href} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold no-underline transition-colors
                      ${location === item.href ? 'bg-[#7e57c2]/10 text-[#7e57c2]' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.label}
                  </Link>
                ) : (
                  <div>
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
                    {item.dropdown?.map(sub => (
                      <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 no-underline transition-colors">
                        <span className="text-[#7e57c2]">{sub.icon}</span>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {user && (
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100">
                <LogOut size={16} /> Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-xl">
          <div className="flex items-center justify-around px-2 py-2">
            {user.role === 'user' && [
              { href: '/', icon: <Home size={22} />, label: 'Home' },
              { href: '/mechanics', icon: <Search size={22} />, label: 'Find' },
              { href: '/bookings', icon: <BookOpen size={22} />, label: 'Bookings' },
              { href: '/chat', icon: <MessageCircle size={22} />, label: 'Chat' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl no-underline transition-colors
                  ${location === item.href ? 'text-[#7e57c2]' : 'text-gray-400 hover:text-gray-600'}`}>
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            ))}
            {user.role === 'mechanic' && [
              { href: '/mechanic-dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
              { href: '/mechanics', icon: <Search size={22} />, label: 'Jobs' },
              { href: '/chat', icon: <MessageCircle size={22} />, label: 'Messages' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl no-underline transition-colors
                  ${location === item.href ? 'text-[#7e57c2]' : 'text-gray-400'}`}>
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            ))}
            {user.role === 'admin' && [
              { href: '/admin', icon: <Shield size={22} />, label: 'Admin' },
              { href: '/mechanics', icon: <Wrench size={22} />, label: 'Mechanics' },
              { href: '/chat', icon: <MessageCircle size={22} />, label: 'Chat' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl no-underline transition-colors
                  ${location === item.href ? 'text-[#7e57c2]' : 'text-gray-400'}`}>
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
