import { mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import ProfileDetailClient from './profile-detail-client';


export default function ProfilePage({ params }: { params: { id: string } }) {
  const user = mockUsers.find((u) => u.id === params.id);

  if (!user) {
    notFound();
  }

  return <ProfileDetailClient user={user} />;
}
