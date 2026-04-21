import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppGroupsPage from './pages/AppGroupsPage';
import AppGroupDetailPage from './pages/AppGroupDetailPage';
import AppDetailPage from './pages/AppDetailPage';
import AdminPage from './pages/AdminPage';
import MasterDataPage from './pages/MasterDataPage';
import PendingPage from './pages/PendingPage';
import './App.css';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isApproved) return <Navigate to="/pending" replace />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (user && user.isApproved) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="app-groups" element={<AppGroupsPage />} />
          <Route path="app-groups/:id" element={<AppGroupDetailPage />} />
          <Route path="apps/:id" element={<AppDetailPage />} />
          <Route path="admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
          <Route path="master" element={<PrivateRoute adminOnly><MasterDataPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
