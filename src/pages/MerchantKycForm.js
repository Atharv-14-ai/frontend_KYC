import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

const STEPS = [
  { id: 'personal', label: 'Personal Details', icon: '👤' },
  { id: 'business', label: 'Business Details', icon: '🏢' },
  { id: 'documents', label: 'Documents', icon: '📄' },
];

const MerchantKycForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAck, setSavedAck] = useState({ personal: false, business: false });
  
  const [personal, setPersonal] = useState({ name: '', email: '', phone: '' });
  const [business, setBusiness] = useState({ business_name: '', type: '', monthly_volume: '' });
  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [docType, setDocType] = useState('pan');
  const [uploading, setUploading] = useState(false);

  const fetchSubmission = async () => {
    try {
      const res = await api.get(`/kyc/${id}/`);
      setSubmission(res.data);
      setPersonal(res.data.personal_details || { name: '', email: '', phone: '' });
      setBusiness(res.data.business_details || { business_name: '', type: '', monthly_volume: '' });
      setDocuments(res.data.documents || []);
    } catch (err) {
      addToast('Failed to load submission', 'error');
      navigate('/merchant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const updateSection = async (section, data) => {
    setSaving(true);
    try {
      const payload = section === 'personal' 
        ? { personal_details: data }
        : { business_details: data };
      
      await api.put(`/kyc/${id}/update/`, payload);
      addToast(`${section === 'personal' ? 'Personal' : 'Business'} details saved`, 'success');
      // show inline acknowledgement
      setSavedAck(prev => ({ ...prev, [section]: true }));
      setTimeout(() => setSavedAck(prev => ({ ...prev, [section]: false })), 4000);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Error saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      addToast('Please select a file', 'warning');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(uploadFile.type)) {
      addToast('Only PDF, JPG, and PNG files are allowed', 'error');
      return;
    }

    if (uploadFile.size > maxSize) {
      addToast('File too large. Maximum allowed size is 5MB', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('doc_type', docType);
    
    try {
      await api.post(`/kyc/${id}/upload/`, formData);
      addToast('Document uploaded successfully', 'success');
      setUploadFile(null);
      fetchSubmission();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/kyc/${id}/submit/`);
      addToast('KYC submitted for review!', 'success');
      navigate('/merchant');
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Submit failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isEditable = submission?.state === 'draft' || submission?.state === 'more_info_requested';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/merchant')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Submissions</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">KYC Submission #{id}</h1>
            <p className="mt-1 text-gray-600">
              Status: <span className="font-semibold capitalize">{submission?.state.replace('_', ' ')}</span>
            </p>
          </div>
          {submission?.state === 'draft' && (
            <button
              onClick={handleSubmit}
              disabled={saving || documents.length === 0}
              className="btn-success flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Submit for Review</span>
            </button>
          )}
          {submission?.state === 'more_info_requested' && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Resubmit</span>
            </button>
          )}
        </div>
      </div>

      {submission?.state === 'more_info_requested' && submission?.review_reason && (
        <div className="mb-6 rounded-2xl border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <p className="font-semibold text-yellow-800">More information requested</p>
          <p className="text-sm text-yellow-700 mt-1">{submission.review_reason}</p>
        </div>
      )}

      {/* Steps Navigation */}
      <div className="mb-8">
        <div className="flex space-x-4 bg-white rounded-xl p-2 shadow-sm border">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setStep(idx)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                step === idx
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{s.icon}</span>
              <span className="font-medium hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={personal.name}
                  onChange={(e) => setPersonal({...personal, name: e.target.value})}
                  className="input-field"
                  placeholder="Enter your full name"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setPersonal({...personal, email: e.target.value})}
                  className="input-field"
                  placeholder="your@email.com"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="text"
                  value={personal.phone}
                  onChange={(e) => setPersonal({...personal, phone: e.target.value})}
                  className="input-field"
                  placeholder="+91-9876543210"
                  disabled={!isEditable}
                />
              </div>
              {isEditable && (
                <button
                  onClick={() => updateSection('personal', personal)}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Personal Details'}
                </button>
              )}
              {savedAck.personal && (
                <div className="mt-3 text-sm text-green-700">Personal details saved successfully.</div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Business Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                <input
                  type="text"
                  value={business.business_name}
                  onChange={(e) => setBusiness({...business, business_name: e.target.value})}
                  className="input-field"
                  placeholder="Your business name"
                  disabled={!isEditable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
                <select
                  value={business.type}
                  onChange={(e) => setBusiness({...business, type: e.target.value})}
                  className="input-field"
                  disabled={!isEditable}
                >
                  <option value="">Select type</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Agency">Agency</option>
                  <option value="Startup">Startup</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Monthly Volume (USD) *</label>
                <input
                  type="number"
                  value={business.monthly_volume}
                  onChange={(e) => setBusiness({...business, monthly_volume: e.target.value})}
                  className="input-field"
                  placeholder="5000"
                  disabled={!isEditable}
                />
              </div>
              {isEditable && (
                <button
                  onClick={() => updateSection('business', business)}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Business Details'}
                </button>
              )}
                {savedAck.business && (
                  <div className="mt-3 text-sm text-green-700">Business details saved successfully.</div>
                )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-6">Documents</h2>
            
            {isEditable && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <h3 className="font-semibold mb-4">Upload New Document</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="input-field"
                    >
                      <option value="pan">PAN Card</option>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="bank">Bank Statement</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF, JPG, PNG - Max 5MB)</label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="input-field"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !uploadFile}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-4">Uploaded Documents ({documents.length})</h3>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">📄</span>
                  <p>No documents uploaded yet</p>
                  {isEditable && <p className="text-sm mt-1">Upload at least one document to submit</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {doc.doc_type === 'pan' ? '🪪' : doc.doc_type === 'aadhaar' ? '🆔' : '🏦'}
                        </span>
                        <div>
                          <p className="font-medium">{doc.doc_type.toUpperCase()}</p>
                          <p className="text-sm text-gray-500">{doc.file?.split('/').pop()}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantKycForm;