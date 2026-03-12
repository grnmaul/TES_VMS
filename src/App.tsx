import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import CameraManagement from './pages/CameraManagement';
import NotificationCenter from './pages/NotificationCenter';
import Settings from './pages/Settings';
import LiveStream from './pages/LiveStream';
import LandingPage from './pages/LandingPage';
import SmartMap from './pages/SmartMap';

function DashboardRouter() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Dashboard /> : <UserDashboard />;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AppLayout><DashboardRouter /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/cameras" element={
            <PrivateRoute>
              <AppLayout><CameraManagement /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <AppLayout><NotificationCenter /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <AppLayout><Settings /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/smart-map" element={
            <PrivateRoute>
              <AppLayout><SmartMap /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/stream/:id?" element={
            <PrivateRoute>
              <LiveStream />
            </PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
