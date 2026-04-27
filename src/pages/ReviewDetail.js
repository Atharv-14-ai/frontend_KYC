import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [reason, setReason] = useState('');

  const fetchSubmission = async () => {
    try {
      const res = await api.get(`/review/${id}/`);
      setSubmission(res.data);
    } catch (err) {
      addToast('Failed to load submission', 'error');
      navigate('/reviewer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmission(); }, [id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'start') {
        await api.post(`/review/${id}/start/`);
        addToast('Review started', 'success');
      } else if (action === 'approve') {
        await api.post(`/review/${id}/approve/`);
        addToast('KYC approved!', 'success');
      } else if (action === 'reject') {
        await api.post(`/review/${id}/reject/`, { reason });
        addToast('KYC rejected', 'success');
      } else if (action === 'request_info') {
        await api.post(`/review/${id}/request-info/`, { reason });
        addToast('More information requested', 'success');
      }
      navigate('/reviewer');
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const canReview = submission?.state === 'submitted' || submission?.state === 'under_review';

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/reviewer')}
        className="text-gray-600 hover:text-gray-900 mb-6 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Queue</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submission #{id}</h1>
              <p className="text-gray-600 mt-1">
                From <span className="font-semibold">{submission?.merchant_name}</span>
                {' • '}
                <span className="capitalize">{submission?.state?.replace('_', ' ')}</span>
              </p>
            </div>
            {submission?.at_risk && (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold animate-pulse-slow">
                ⚠ AT RISK - {submission.time_in_queue_hours}h in queue
              </span>
            )}
          </div>
        </div>

        {submission?.review_reason && (
          <div className="p-4 mb-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">
              {submission.state === 'more_info_requested' ? 'More information requested' : 'Review note'}
            </p>
            <p className="text-sm text-yellow-700 mt-2">{submission.review_reason}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">👤</span> Personal Details
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Name</span>
                  <p className="font-medium">{submission?.personal_details?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium">{submission?.personal_details?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone</span>
                  <p className="font-medium">{submission?.personal_details?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🏢</span> Business Details
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Business Name</span>
                  <p className="font-medium">{submission?.business_details?.business_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Type</span>
                  <p className="font-medium">{submission?.business_details?.type || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Monthly Volume</span>
                  <p className="font-medium">${submission?.business_details?.monthly_volume || '0'} USD</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📄</span> Documents ({submission?.documents?.length || 0})
            </h2>
            {submission?.documents?.length === 0 ? (
              <p className="text-gray-500 bg-gray-50 rounded-lg p-4">No documents uploaded</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {submission?.documents?.map(doc => (
                  <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">
                        {doc.doc_type === 'pan' ? '🪪' : doc.doc_type === 'aadhaar' ? '🆔' : '🏦'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{doc.doc_type.toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{doc.file?.split('/').pop()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canReview && (
          <div className="p-6 bg-gray-50 border-t">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>
            
            {submission?.state === 'submitted' && (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="btn-primary"
              >
                Start Review
              </button>
            )}

            {submission?.state === 'under_review' && (
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="btn-success"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setShowReject(!showReject)}
                    className="btn-danger"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="btn-secondary"
                  >
                    ℹ️ Request Info
                  </button>
                </div>

                {(showReject || showInfo) && (
                  <div className="animate-fade-in bg-white rounded-lg p-4 border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (required)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="input-field mb-3"
                      rows={3}
                      placeholder="Provide detailed reason..."
                    />
                    <div className="flex space-x-3">
                      {showReject && (
                        <button
                          onClick={() => handleAction('reject')}
                          disabled={actionLoading || !reason.trim()}
                          className="btn-danger"
                        >
                          Confirm Rejection
                        </button>
                      )}
                      {showInfo && (
                        <button
                          onClick={() => handleAction('request_info')}
                          disabled={actionLoading || !reason.trim()}
                          className="btn-primary"
                        >
                          Send Request
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowReject(false);
                          setShowInfo(false);
                          setReason('');
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDetail;