import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { apiGet } from '@/lib/api';
import { Star, MapPin, Clock, Wrench, Search } from 'lucide-react';

interface Mechanic {
  id: number;
  name: string;
  workshop: string;
  expertise: string;
  experience: number;
  hourly_rate: number;
  working_hours: string;
  address: string;
  profile_pic: string | null;
  rating: number;
}

export default function Mechanics() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet('/mechanics').then(res => res.json()).then(data => {
      if (data.success) setMechanics(data.mechanics);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = mechanics.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.workshop?.toLowerCase().includes(search.toLowerCase()) ||
    m.expertise?.toLowerCase().includes(search.toLowerCase()) ||
    m.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(1200px 600px at 20% 10%, rgba(32,201,151,0.10), transparent 60%), radial-gradient(900px 500px at 80% 0%, rgba(126,87,194,0.12), transparent 55%), linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Find Mechanics</h1>
          <p className="text-gray-500 text-lg">Browse verified, professional mechanics near you</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, workshop, expertise, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-black/10 bg-white/80 backdrop-blur text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/40 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-white/60 animate-pulse border border-black/10"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No mechanics found</h3>
            <p className="text-gray-400 mt-2">{search ? 'Try a different search term' : 'No approved mechanics yet. Check back soon!'}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(m => (
              <div key={m.id} className="bg-white/80 backdrop-blur rounded-2xl border border-black/10 shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                <div className="h-32 bg-gradient-to-br from-[#20c997]/20 to-[#7e57c2]/20 relative flex items-center justify-center">
                  {m.profile_pic ? (
                    <img src={m.profile_pic} alt={m.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center border-4 border-white shadow-md">
                      <span className="text-white font-black text-2xl">{(m.name || 'M')[0]}</span>
                    </div>
                  )}
                  {m.rating > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-lg">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold text-gray-700">{m.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-900 text-lg mb-1">{m.name}</h3>
                  <p className="text-[#7e57c2] font-semibold text-sm mb-3">{m.workshop}</p>
                  {m.expertise && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.expertise.split(',').slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-full bg-[#20c997]/10 text-[#20c997] text-xs font-semibold">{skill.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    {m.address && <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 shrink-0" /><span className="truncate">{m.address}</span></div>}
                    {m.working_hours && <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400 shrink-0" /><span>{m.working_hours}</span></div>}
                    {m.hourly_rate > 0 && <div className="flex items-center gap-2"><span className="text-gray-400 text-xs">৳</span><span className="font-semibold text-gray-700">{m.hourly_rate}/hr</span></div>}
                  </div>
                  <Link href={`/book/${m.id}`}
                    className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 transition-opacity no-underline">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
