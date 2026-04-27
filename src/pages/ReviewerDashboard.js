import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const ReviewerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [queueRes, metricsRes] = await Promise.all([
        api.get('/review/queue/'),
        api.get('/review/metrics/')
      ]);
      setQueue(queueRes.data.results || []);
      setMetrics(metricsRes.data);
    } catch (err) {
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage KYC submissions and track metrics</p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">In Queue</h3>
              <span className="text-2xl">📥</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.queue_metrics.in_queue}</p>
            <p className="text-xs text-gray-500 mt-1">Pending review</p>
          </div>
          
          <div className={`card ${metrics.queue_metrics.at_risk > 0 ? 'border-red-300 bg-red-50' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">At Risk</h3>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className={`text-3xl font-bold ${metrics.queue_metrics.at_risk > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {metrics.queue_metrics.at_risk}
            </p>
            <p className="text-xs text-gray-500 mt-1">Over 24 hours in queue</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">7-Day Total</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.seven_day_metrics.total_submissions}</p>
            <p className="text-xs text-gray-500 mt-1">Submissions this week</p>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Approval Rate</h3>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{metrics.seven_day_metrics.approval_rate}%</p>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </div>
        </div>
      )}

      {/* Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Review Queue</h2>
          <button onClick={fetchData} className="btn-secondary flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-6xl block mb-4">🎉</span>
            <p className="text-lg font-medium">Queue is empty</p>
            <p className="text-sm mt-1">All submissions have been processed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map(sub => (
              <Link
                key={sub.id}
                to={`/reviewer/submission/${sub.id}`}
                className={`block p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  sub.at_risk 
                    ? 'border-red-300 bg-red-50 hover:border-red-400' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      sub.at_risk ? 'bg-red-200' : 'bg-gray-200'
                    }`}>
                      <span className="font-semibold text-sm">
                        {sub.merchant_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {sub.merchant_name}
                        <span className="text-gray-500 font-normal ml-2">#{sub.id}</span>
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-600">
                          ⏱ {sub.time_in_queue_hours}h in queue
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className={`badge ${
                          sub.state === 'submitted' ? 'badge-submitted' : 'badge-review'
                        }`}>
                          {sub.state.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          📄 {sub.document_count} docs
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {sub.at_risk && (
                      <span className="flex items-center text-red-600 animate-pulse-slow">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        AT RISK
                      </span>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerDashboard;