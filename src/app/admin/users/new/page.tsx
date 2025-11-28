'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/admin/user-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { User } from '@/lib/types';

export default function NewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createUser } = useAdminData();

  const handleSubmit = (data: any) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...data,
    };
    
    createUser(newUser);
    
    toast({
      title: 'Berhasil',
      description: 'User berhasil ditambahkan',
    });
    
    router.push('/admin/users');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah User Baru</h1>
        <p className="text-muted-foreground">
          Tambahkan user baru ke sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form User</CardTitle>
          <CardDescription>
            Isi informasi lengkap tentang user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/users')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

