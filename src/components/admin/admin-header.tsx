'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CircleUser, User, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-end gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs" variant="destructive">3</Badge>
              <span className="sr-only">Buka notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="items-start">
              <Link href="/admin/property-submissions" className="flex flex-col gap-1 cursor-pointer">
                <p className='font-semibold'>Pengajuan Properti Baru</p>
                <p className='text-xs text-muted-foreground'>Ada pengajuan properti baru yang perlu ditinjau.</p>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="items-start">
              <Link href="/admin/users" className="flex flex-col gap-1 cursor-pointer">
                <p className='font-semibold'>Pengguna Baru Terdaftar</p>
                <p className='text-xs text-muted-foreground'>2 pengguna baru telah mendaftar hari ini.</p>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="items-start">
              <Link href="/admin/payments" className="flex flex-col gap-1 cursor-pointer">
                <p className='font-semibold'>Pembayaran Baru</p>
                <p className='text-xs text-muted-foreground'>Ada pembayaran baru yang perlu diverifikasi.</p>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className='justify-center text-sm text-muted-foreground cursor-pointer'>
                Lihat semua notifikasi
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Buka menu admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {/* Header dengan Avatar, Nama, Email */}
            {user && (
              <>
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Menu Items dengan Icon */}
            <DropdownMenuItem asChild className="px-4 py-2.5">
              <Link href="/admin/dashboard" className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="px-4 py-2.5 flex items-center gap-3">
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


