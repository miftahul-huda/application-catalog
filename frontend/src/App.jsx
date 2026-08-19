import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppGroupsPage from './pages/AppGroupsPage';
import AppGroupDetailPage from './pages/AppGroupDetailPage';
import AppDetailPage from './pages/AppDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import DocumentationsPage from './pages/DocumentationsPage';
import SourceCodesPage from './pages/SourceCodesPage';
import BacklogsPage from './pages/BacklogsPage';
import BugsPage from './pages/BugsPage';
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

const InternalRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.role === 'External') return <Navigate to="/bugs" replace />;
  return children;
};

const HomeRoute = () => {
  const { user } = useAuth();
  if (user && user.role === 'External') return <Navigate to="/bugs" replace />;
  return <DashboardPage />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<HomeRoute />} />
          <Route path="bugs" element={<BugsPage />} />
          <Route path="app-groups" element={<InternalRoute><AppGroupsPage /></InternalRoute>} />
          <Route path="app-groups/:id" element={<InternalRoute><AppGroupDetailPage /></InternalRoute>} />
          <Route path="applications" element={<InternalRoute><ApplicationsPage /></InternalRoute>} />
          <Route path="documentations" element={<InternalRoute><DocumentationsPage /></InternalRoute>} />
          <Route path="source-codes" element={<InternalRoute><SourceCodesPage /></InternalRoute>} />
          <Route path="backlogs" element={<InternalRoute><BacklogsPage /></InternalRoute>} />
          <Route path="apps/:id" element={<InternalRoute><AppDetailPage /></InternalRoute>} />
          <Route path="admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
          <Route path="master" element={<PrivateRoute adminOnly><MasterDataPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
