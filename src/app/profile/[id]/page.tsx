'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ProfileDetailClient from './profile-detail-client';


export default function ProfilePage({ params }: { params: { id: string } }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const user = mockUsers.find((u) => u.id === params.id);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 sm:py-10">
        <div className="text-center">Memuat...</div>
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  if (!user) {
    notFound();
  }

  return <ProfileDetailClient user={user} />;
}
