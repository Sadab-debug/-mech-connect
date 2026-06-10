import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import {
  Wrench, Star, Clock, Shield, ChevronRight, CheckCircle,
  Car, Zap, Droplets, Settings, Phone, MapPin, ArrowRight,
  Users, TrendingUp, Award
} from 'lucide-react';

const services = [
  { icon: <Car size={26} />, label: 'Car Repair', color: 'from-blue-500 to-blue-600' },
  { icon: <Zap size={26} />, label: 'Electrical', color: 'from-yellow-500 to-orange-500' },
  { icon: <Droplets size={26} />, label: 'Oil Change', color: 'from-emerald-500 to-teal-500' },
  { icon: <Settings size={26} />, label: 'Tune-Up', color: 'from-purple-500 to-[#7e57c2]' },
  { icon: <Shield size={26} />, label: 'AC Repair', color: 'from-cyan-500 to-blue-500' },
  { icon: <Wrench size={26} />, label: 'Inspection', color: 'from-rose-500 to-pink-500' },
];

const stats = [
  { value: '500+', label: 'Verified Mechanics', icon: <Users size={20} /> },
  { value: '10K+', label: 'Happy Customers', icon: <Star size={20} /> },
  { value: '64', label: 'Districts Covered', icon: <MapPin size={20} /> },
  { value: '4.8★', label: 'Avg. Rating', icon: <Award size={20} /> },
];

const steps = [
  { num: '01', title: 'Search & Filter', desc: 'Find mechanics by location, expertise, and ratings.' },
  { num: '02', title: 'Book Instantly', desc: 'Choose a time slot and confirm your booking online.' },
  { num: '03', title: 'Get Serviced', desc: 'Mechanic arrives at your location and fixes your vehicle.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#20c997]/10 text-[#20c997] text-xs font-bold mb-5 border border-[#20c997]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20c997] animate-pulse"></span>
                বাংলাদেশের #১ মেকানিক প্ল্যাটফর্ম
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4">
                আপনার গাড়ির জন্য<br />
                <span className="bg-gradient-to-r from-[#20c997] to-[#7e57c2] bg-clip-text text-transparent">
                  বিশ্বস্ত মিস্ত্রি
                </span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg mb-7 leading-relaxed">
                Verified, professional mechanics at your doorstep. Fast booking, transparent pricing, guaranteed service across Bangladesh.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/mechanics"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-[#7e57c2]/30 hover:opacity-90 transition-opacity no-underline">
                  Find Mechanics <ArrowRight size={18} />
                </Link>
                {!user && (
                  <Link href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-base hover:border-[#7e57c2] hover:text-[#7e57c2] transition-colors no-underline">
                    Create Account
                  </Link>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-100">
                {[
                  { icon: <CheckCircle size={16} className="text-[#20c997]" />, text: 'Verified Mechanics' },
                  { icon: <Shield size={16} className="text-[#7e57c2]" />, text: 'Secure Booking' },
                  { icon: <Clock size={16} className="text-blue-500" />, text: 'Same-Day Service' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                    {b.icon} {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map(s => (
                <div key={s.label} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#20c997]/15 to-[#7e57c2]/15 flex items-center justify-center text-[#7e57c2] mb-3">
                    {s.icon}
                  </div>
                  <div className="text-2xl font-black text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Our Services</h2>
            <p className="text-gray-400 text-sm mt-1">Pick a service category to find specialists</p>
          </div>
          <Link href="/mechanics" className="text-sm font-bold text-[#7e57c2] flex items-center gap-1 no-underline hover:gap-2 transition-all">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {services.map(s => (
            <Link key={s.label} href="/mechanics"
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all no-underline group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{s.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">How It Works</h2>
            <p className="text-gray-400 text-sm mt-1">Book a mechanic in 3 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center p-6">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[calc(50%+3rem)] right-0 border-t-2 border-dashed border-gray-200"></div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#20c997]/15 to-[#7e57c2]/15 flex items-center justify-center mb-4 relative z-10">
                  <span className="text-2xl font-black text-[#7e57c2]">{step.num}</span>
                </div>
                <h3 className="font-black text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Why MistriVai?</h2>
          <p className="text-gray-400 text-sm mt-1">Trusted by thousands across Bangladesh</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: <Award size={28} />, title: 'Verified Experts', desc: 'Every mechanic is background-checked, trained, and reviewed before joining the platform.', color: 'text-[#7e57c2]', bg: 'from-[#7e57c2]/10 to-[#7e57c2]/5' },
            { icon: <TrendingUp size={28} />, title: 'Best Prices', desc: 'Transparent pricing with no hidden charges. Compare rates and choose what suits your budget.', color: 'text-[#20c997]', bg: 'from-[#20c997]/10 to-[#20c997]/5' },
            { icon: <Shield size={28} />, title: 'Service Guarantee', desc: "All work is backed by our quality guarantee. Not satisfied? We'll make it right.", color: 'text-blue-600', bg: 'from-blue-500/10 to-blue-500/5' },
          ].map(c => (
            <div key={c.title} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center ${c.color} mb-4`}>
                {c.icon}
              </div>
              <h3 className="font-black text-gray-900 text-base mb-2">{c.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 sm:px-6 pb-10 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-[#03332b] to-[#7e57c2] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="text-white/60 text-sm font-semibold mb-1">For Mechanics & Workshops</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Grow Your Business</h2>
            <p className="text-white/70 text-sm sm:text-base">Join 500+ mechanics earning more with MistriVai. Free registration, instant bookings.</p>
          </div>
          <Link href="/mechanic-registration"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white text-[#7e57c2] font-black text-base hover:bg-white/90 transition-colors no-underline shadow-lg whitespace-nowrap">
            Join as Mechanic <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-6 mb-6">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center">
                  <Wrench size={14} className="text-white" />
                </div>
                <span className="font-black text-gray-900">MistriVai</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Bangladesh's trusted platform connecting vehicle owners with verified mechanics.</p>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Services</div>
              {['Car Repair', 'Electrical', 'Oil Change', 'AC Repair'].map(s => (
                <Link key={s} href="/mechanics" className="block text-sm text-gray-500 hover:text-[#7e57c2] mb-1.5 no-underline transition-colors">{s}</Link>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company</div>
              {['About Us', 'How It Works', 'Careers', 'Contact'].map(s => (
                <div key={s} className="block text-sm text-gray-500 mb-1.5">{s}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Phone size={13} /> +880 1700-000000
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} /> Dhaka, Bangladesh
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© 2025 MistriVai. All rights reserved.</p>
            <p className="text-xs text-gray-400">Made with ❤️ in Bangladesh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
