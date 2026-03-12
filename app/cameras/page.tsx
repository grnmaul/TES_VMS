'use client';

import CameraManagement from '@/src/pages/CameraManagement';
import Sidebar from '@/src/components/Sidebar';

export default function CameraPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <CameraManagement />
      </main>
    </div>
  );
}
