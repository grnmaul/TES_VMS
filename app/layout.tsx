import type { Metadata } from 'next';
import { AuthProvider } from '@/src/context/AuthContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'VMS Kota Madiun',
  description: 'Video Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster position="bottom-right" />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
