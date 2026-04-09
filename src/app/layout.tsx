import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AdminLayoutWrapper } from '@/components/admin-layout-wrapper';
import { AuthProvider } from '@/contexts/auth-context';
import { UserDataProvider } from '@/contexts/user-data-context';
import { AdminDataProvider } from '@/contexts/admin-data-context';

export const metadata: Metadata = {
  title: 'BeliRumahBareng - Kepemilikan Properti Kolektif',
  description: 'Platform untuk pembelian properti kolektif, membuat kepemilikan properti lebih mudah diakses.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <UserDataProvider>
            <AdminDataProvider>
              <div className="flex min-h-screen w-full flex-col">
                <AdminLayoutWrapper>
                  {children}
                </AdminLayoutWrapper>
              </div>
            </AdminDataProvider>
          </UserDataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
