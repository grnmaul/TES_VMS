'use client';

import Settings from '@/src/views/Settings';
import Sidebar from '@/src/components/Sidebar';
import RequireAuth from '@/src/components/RequireAuth';

export default function SettingsPage() {
  return (
    <RequireAuth roles={['admin']}>
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 transition-colors duration-300">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <Settings />
        </main>
      </div>
    </RequireAuth>
  );
}
