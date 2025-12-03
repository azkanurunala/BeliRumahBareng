'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/actions/user.actions';
import { notFound } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import ProfileDetailClient from './profile-detail-client';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@/lib/types';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push('/admin/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUser(params.id);
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setError(result.error?.message || 'User tidak ditemukan');
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Terjadi kesalahan saat memuat profil');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && !isAdmin) {
      loadUser();
    }
  }, [params.id, authLoading, isAdmin]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-6 sm:py-10">
        <LoadingScreen message="Memuat profil..." fullScreen={false} />
      </div>
    );
  }

  if (isAdmin) {
    return null;
  }

  if (error || !user) {
    notFound();
  }

  return <ProfileDetailClient user={user} />;
}
