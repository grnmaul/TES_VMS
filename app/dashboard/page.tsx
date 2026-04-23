'use client';

import { useAuth } from '@/src/context/AuthContext';
import Dashboard from '@/src/pages/Dashboard';
import UserDashboard from '@/src/pages/UserDashboard';
import Sidebar from '@/src/components/Sidebar';
import RequireAuth from '@/src/components/RequireAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const DashboardComponent = user?.role === 'admin' ? Dashboard : UserDashboard;

  return (
    <RequireAuth roles={['admin', 'user']}>
      <div className="min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <DashboardComponent />
        </main>
      </div>
    </RequireAuth>
  );
}