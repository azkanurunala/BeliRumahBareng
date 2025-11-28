'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft, Edit, User, MapPin, DollarSign, Target, Clock, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getUser, projects } = useAdminData();
  
  const user = getUser(id);
  
  if (!user) {
    notFound();
  }

  // Find projects where user is a member
  const userProjects = projects.filter(p => p.members.some(m => m.id === id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground">
              Detail informasi user
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/users/${id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferensi Properti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lokasi Pilihan</p>
                <p className="font-semibold">{user.profile.locationPreference}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rentang Harga</p>
                <p className="font-semibold">{user.profile.priceRange}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Target size={18} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tujuan Kepemilikan</p>
                <p className="font-semibold">{user.profile.investmentGoals}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Home size={18} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kapasitas Finansial</p>
                <p className="font-semibold">{user.profile.financialCapacity}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horison Waktu</p>
                <p className="font-semibold">{user.profile.timeHorizon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Projects */}
      {userProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project yang Diikuti</CardTitle>
            <CardDescription>
              {userProjects.length} project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}/detail`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{project.propertyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.members.length} anggota • {project.unitAssignments.length} unit
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Lihat
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

