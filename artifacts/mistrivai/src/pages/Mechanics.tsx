import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { apiGet } from '@/lib/api';
import { Star, MapPin, Clock, Wrench, Search, X, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

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
  review_count: number;
  trust_score: number;
  total_bookings: number;
}

function TrustBadge({ score }: { score: number }) {
  if (score >= 4.5) return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 border border-green-200 text-green-700 text-xs font-bold">
      <Shield size={10} className="fill-green-500" /> Highly Trusted
    </div>
  );
  if (score >= 3.5) return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold">
      <Shield size={10} /> Trusted
    </div>
  );
  if (score >= 2.5) return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-700 text-xs font-bold">
      <TrendingUp size={10} /> Average
    </div>
  );
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-600 text-xs font-bold">
      <AlertTriangle size={10} /> Low Trust
    </div>
  );
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Find Mechanics</h1>
          <p className="text-gray-400 text-sm">Browse {mechanics.length} verified mechanics · sorted by Trust Score</p>
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, expertise, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7e57c2]/30 focus:border-[#7e57c2] focus:bg-white transition-colors text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!loading && search && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "<span className="font-semibold text-gray-700">{search}</span>"
          </p>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-28 bg-gray-100"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-100 rounded mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-400">No mechanics found</h3>
            <p className="text-gray-400 text-sm mt-1">{search ? 'Try a different search term' : 'No approved mechanics yet. Check back soon!'}</p>
            {search && (
              <button onClick={() => setSearch('')}
                className="mt-4 px-5 py-2 rounded-xl bg-[#7e57c2]/10 text-[#7e57c2] font-semibold text-sm hover:bg-[#7e57c2]/20">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">
                <div className="h-24 bg-gradient-to-br from-[#20c997]/15 to-[#7e57c2]/15 relative flex items-end justify-between px-4 pb-2">
                  {m.profile_pic ? (
                    <img src={m.profile_pic} alt={m.name}
                      className="w-16 h-16 rounded-xl object-cover border-3 border-white shadow-md absolute -bottom-8 left-4" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#20c997] to-[#7e57c2] flex items-center justify-center border-3 border-white shadow-md absolute -bottom-8 left-4">
                      <span className="text-white font-black text-xl">{(m.name || 'M')[0]}</span>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    {m.rating > 0 && (
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-black text-gray-700">{m.rating.toFixed(1)}</span>
                        {m.review_count > 0 && <span className="text-[10px] text-gray-400">({m.review_count})</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pt-10 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-black text-gray-900 text-base">{m.name}</h3>
                  </div>
                  <p className="text-[#7e57c2] font-semibold text-xs mb-2">{m.workshop}</p>

                  <div className="mb-2.5">
                    <TrustBadge score={m.trust_score ?? 3} />
                  </div>

                  {m.expertise && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.expertise.split(',').slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-lg bg-[#20c997]/10 text-[#20c997] text-xs font-semibold border border-[#20c997]/20">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    {m.address && (
                      <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400 shrink-0" /><span className="truncate">{m.address}</span></div>
                    )}
                    {m.working_hours && (
                      <div className="flex items-center gap-1.5"><Clock size={12} className="text-gray-400 shrink-0" /><span>{m.working_hours}</span></div>
                    )}
                    {m.hourly_rate > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-bold">৳</span>
                        <span className="font-bold text-gray-700">{m.hourly_rate}/hr</span>
                        {m.experience > 0 && <span className="text-gray-400 ml-1">· {m.experience}yr exp</span>}
                        {m.total_bookings > 0 && <span className="text-gray-400 ml-1">· {m.total_bookings} jobs</span>}
                      </div>
                    )}
                  </div>

                  <Link href={`/book/${m.id}`}
                    className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold text-sm hover:opacity-90 transition-opacity no-underline shadow-md shadow-[#7e57c2]/20">
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
