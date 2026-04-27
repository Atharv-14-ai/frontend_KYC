import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { role } = useAuth();

  if (role === 'merchant') {
    return <Navigate to="/merchant" />;
  }
  if (role === 'reviewer') {
    return <Navigate to="/reviewer" />;
  }
  // fallback
  return <div>Unknown user role</div>;
};

export default Dashboard;