'use client';

import CameraManagement from '@/src/views/CameraManagement';
import Sidebar from '@/src/components/Sidebar';
import RequireAuth from '@/src/components/RequireAuth';

export default function CameraPage() {
  return (
    <RequireAuth roles={['admin']}>
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 transition-colors duration-300">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <CameraManagement />
        </main>
      </div>
    </RequireAuth>
  );
}
