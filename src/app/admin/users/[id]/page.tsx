'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/admin/user-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getUser, updateUser } = useAdminData();
  
  const user = getUser(id);
  
  if (!user) {
    notFound();
  }

  const handleSubmit = (data: any) => {
    updateUser(id, data);
    
    toast({
      title: 'Berhasil',
      description: 'User berhasil diperbarui',
    });
    
    router.push('/admin/users');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            Edit informasi user
          </p>
          <div className="mt-2">
            <Breadcrumb items={[
              { label: 'Users', href: '/admin/users' },
              { label: user.name, href: `/admin/users/${id}/detail` },
              { label: 'Edit' }
            ]} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>
            Edit informasi lengkap tentang user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            user={user}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/users')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

