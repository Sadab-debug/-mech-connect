import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function MechanicStatus() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/mechanic/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data.proposal);
        if (data.proposal?.status === 'approved') {
          await refresh();
          navigate('/mechanic-dashboard');
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'mechanic') { navigate('/'); return; }
    if (user.is_approved) { navigate('/mechanic-dashboard'); return; }
    checkStatus();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#7e57c2] border-t-transparent animate-spin"></div></div>;
  }

  const isPending = status?.status === 'pending';
  const isRejected = status?.status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e7eef7 100%)' }}>
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur rounded-3xl border border-black/10 shadow-2xl p-10 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isPending ? 'bg-yellow-100' : isRejected ? 'bg-red-100' : 'bg-green-100'}`}>
            {isPending ? <Clock size={40} className="text-yellow-500" /> :
             isRejected ? <XCircle size={40} className="text-red-500" /> :
             <CheckCircle size={40} className="text-green-500" />}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {isPending ? 'Application Under Review' :
             isRejected ? 'Application Rejected' : 'Approved!'}
          </h2>

          {status && (
            <div className="text-gray-500 space-y-2 mb-6">
              <p>Name: <strong className="text-gray-700">{status.full_name}</strong></p>
              <p>Email: <strong className="text-gray-700">{status.email}</strong></p>
              {status.submitted_at && <p className="text-sm">Submitted: {new Date(status.submitted_at).toLocaleDateString()}</p>}
            </div>
          )}

          {isPending && (
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 mb-6">
              Your application is being reviewed by our admin team. This typically takes 2-3 business days. You'll be notified once approved.
            </div>
          )}

          {isRejected && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-6">
              Your application was not approved at this time. Please contact support for more information or submit a new application.
            </div>
          )}

          <div className="space-y-3">
            <button onClick={checkStatus}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#20c997] to-[#7e57c2] text-white font-bold hover:opacity-90">
              <RefreshCw size={18} /> Refresh Status
            </button>
            <button onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl border border-black/10 text-gray-600 font-bold hover:bg-gray-50">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
