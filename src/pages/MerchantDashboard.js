import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const MerchantDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/kyc/');
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      addToast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const createNew = async () => {
    try {
      const res = await api.post('/kyc/create/', {
        personal_details: { name: '', email: '', phone: '' },
        business_details: { business_name: '', type: '', monthly_volume: '' }
      });
      addToast('New KYC draft created!', 'success');
      navigate(`/merchant/kyc/${res.data.id}`);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Error creating draft', 'error');
    }
  };

  const getStateBadge = (state) => {
    const badges = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      under_review: 'badge-review',
      approved: 'badge-approved',
      rejected: 'badge-rejected',
      more_info_requested: 'badge-info',
    };
    return badges[state] || 'badge-draft';
  };

  const getStateIcon = (state) => {
    const icons = {
      draft: '📝',
      submitted: '📤',
      under_review: '⏳',
      approved: '✅',
      rejected: '❌',
      more_info_requested: 'ℹ️',
    };
    return icons[state] || '📋';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My KYC Submissions</h1>
          <p className="mt-1 text-gray-600">Manage your verification submissions</p>
        </div>
        <button onClick={createNew} className="btn-primary flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Submission</span>
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-600 mb-6">Start your KYC verification process to begin accepting international payments.</p>
          <button onClick={createNew} className="btn-primary">
            Create Your First KYC Submission
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map(sub => (
            <Link
              key={sub.id}
              to={`/merchant/kyc/${sub.id}`}
              className="card hover:border-primary-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl">{getStateIcon(sub.state)}</span>
                <span className={`badge ${getStateBadge(sub.state)}`}>
                  {sub.state.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Submission #{sub.id}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {sub.personal_details?.name && (
                  <p>👤 {sub.personal_details.name}</p>
                )}
                {sub.business_details?.business_name && (
                  <p>🏢 {sub.business_details.business_name}</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(sub.created_at).toLocaleDateString()}
                </span>
                <span className="text-primary-600 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;