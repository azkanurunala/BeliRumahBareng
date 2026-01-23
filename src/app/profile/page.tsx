'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ProfileDetailClient from './[id]/profile-detail-client';
import { LoadingScreen } from '@/components/loading-screen';

export default function MyProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 sm:py-10">
        <LoadingScreen message="Memuat profil..." fullScreen={false} />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <ProfileDetailClient user={user} isOwnProfile={true} />;
}
