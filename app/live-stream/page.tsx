'use client';

import LiveStream from '@/src/pages/LiveStream';
import Sidebar from '@/src/components/Sidebar';
import RequireAuth from '@/src/components/RequireAuth';

export default function LiveStreamPage() {
  return (
    <RequireAuth roles={['admin', 'user']}>
      <div className="min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0">
          <LiveStream />
        </main>
      </div>
    </RequireAuth>
  );
}
