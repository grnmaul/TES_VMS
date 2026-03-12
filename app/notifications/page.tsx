'use client';

import NotificationCenter from '@/src/pages/NotificationCenter';
import Sidebar from '@/src/components/Sidebar';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <NotificationCenter />
      </main>
    </div>
  );
}
