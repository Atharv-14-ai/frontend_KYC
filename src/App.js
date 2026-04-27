import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantKycForm from './pages/MerchantKycForm';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewDetail from './pages/ReviewDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant"
            element={
              <ProtectedRoute role="merchant">
                <Layout>
                  <MerchantDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/kyc/:id"
            element={
              <ProtectedRoute role="merchant">
                <Layout>
                  <MerchantKycForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer"
            element={
              <ProtectedRoute role="reviewer">
                <Layout>
                  <ReviewerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviewer/submission/:id"
            element={
              <ProtectedRoute role="reviewer">
                <Layout>
                  <ReviewDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;