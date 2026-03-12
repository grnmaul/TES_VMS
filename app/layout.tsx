import type { Metadata } from 'next';
import { AuthProvider } from '@/src/context/AuthContext';
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
