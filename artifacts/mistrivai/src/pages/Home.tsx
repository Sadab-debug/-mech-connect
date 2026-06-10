import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Wrench, Star, Clock, Shield, ChevronRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e7eef7]"
      style={{ background: 'radial-gradient(1200px 600px at 20% 10%, rgba(32,201,151,0.12), transparent 60%), radial-gradient(900px 500px at 80% 0%, rgba(126,87,194,0.14), transparent 55%), linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        <div className="grid md:grid-cols-2 gap-8 items-center mb-20 bg-white/70 backdrop-blur rounded-3xl border border-black/10 shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-black/10 text-sm font-bold text-gray-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#20c997]"></span>
              Bangladesh's #1 Mechanic Platform
            </div>
            <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">
              Find Your <span className="bg-gradient-to-r from-[#20c997] to-[#7e57c2] bg-clip-text text-transparent">Trusted</span> Mechanic
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Book verified, professional mechanics for your vehicle. Fast, affordable, and reliable service at your doorstep.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/mechanics"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-base shadow-lg shadow-teal-500/25 hover:opacity-90 transition-opacity no-underline">
                Find Mechanics <ChevronRight size={18} />
              </Link>
              {!user && (
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#7e57c2] text-[#7e57c2] font-bold text-base hover:bg-[#7e57c2]/10 transition-colors no-underline">
                  Create Account
                </Link>
              )}
              {user && (
                <Link href="/bookings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#7e57c2] text-[#7e57c2] font-bold text-base hover:bg-[#7e57c2]/10 transition-colors no-underline">
                  My Bookings
                </Link>
              )}
            </div>
          </div>
          <div className="p-8 flex justify-center items-center bg-gradient-to-br from-[#20c997]/10 to-[#7e57c2]/10">
            <div className="text-center space-y-4">
              {[
                { icon: <CheckCircle className="text-[#20c997]" size={28} />, text: 'Verified Mechanics' },
                { icon: <Clock className="text-[#7e57c2]" size={28} />, text: 'Same-Day Booking' },
                { icon: <Star className="text-yellow-400" size={28} />, text: 'Rated Service' },
                { icon: <Shield className="text-blue-500" size={28} />, text: 'Secure Payments' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 shadow-sm border border-black/5">
                  {item.icon}
                  <span className="font-semibold text-gray-800">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <Wrench size={32} />, title: 'Expert Mechanics', desc: 'All mechanics are verified, trained, and experienced professionals.' },
            { icon: <Clock size={32} />, title: 'Fast Booking', desc: 'Book in minutes. Get confirmed within hours. Service at your door.' },
            { icon: <Star size={32} />, title: 'Rated & Reviewed', desc: 'Read genuine reviews from other customers before you book.' },
          ].map(card => (
            <div key={card.title} className="p-8 rounded-2xl bg-white/80 border border-black/10 shadow-lg backdrop-blur text-center group hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#20c997]/20 to-[#7e57c2]/20 flex items-center justify-center mx-auto mb-4 text-[#7e57c2] group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{card.title}</h3>
              <p className="text-gray-500 text-sm">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center p-10 rounded-3xl bg-gradient-to-br from-[#20c997] to-[#7e57c2] text-white shadow-2xl">
          <h2 className="text-3xl font-black mb-3">Are you a Mechanic?</h2>
          <p className="text-white/80 text-lg mb-6">Join MistriVai and grow your business. Get more customers, manage bookings, and earn more.</p>
          <Link href="/mechanic-registration"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#7e57c2] font-bold text-lg hover:bg-white/90 transition-colors no-underline shadow-lg">
            Join as Mechanic <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
