'use client';

import Settings from '@/src/pages/Settings';
import Sidebar from '@/src/components/Sidebar';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <Settings />
      </main>
    </div>
  );
}
