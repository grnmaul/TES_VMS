'use client';

import SmartMap from '@/src/pages/SmartMap';
import Sidebar from '@/src/components/Sidebar';
import RequireAuth from '@/src/components/RequireAuth';

export default function SmartMapPage() {
  return (
    <RequireAuth roles={['user']}>
      <div className="min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <SmartMap />
        </main>
      </div>
    </RequireAuth>
  );
}
