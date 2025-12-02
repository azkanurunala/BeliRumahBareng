'use client';

import Link from 'next/link';
import { Bell, CircleUser, Eye, FolderKanban, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CoBuyLogo } from '@/components/icons';
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
import { Badge } from './ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/discover', label: 'Jelajahi' },
  { href: '/partners', label: 'Cari Rekan' },
  { href: '/recommendations', label: 'Rekomendasi' },
  { href: '/sell-property', label: 'Jual Properti' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <CoBuyLogo className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block text-primary">BeliRumahBareng</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors relative whitespace-nowrap",
                isClient && pathname.startsWith(link.href) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {link.label}
              {isClient && pathname.startsWith(link.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {isAuthenticated ? (
          <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs" variant="destructive">2</Badge>
              <span className="sr-only">Buka notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="items-start">
              <Link href="/property/prop-001" className="flex flex-col gap-1 cursor-pointer">
                <p className='font-semibold'>Kecocokan Proyek Baru</p>
                <p className='text-xs text-muted-foreground'>Sebuah lahan di Sidoarjo cocok dengan profil Anda.</p>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="items-start">
              <Link href="/projects/proj-001" className="flex flex-col gap-1 cursor-pointer">
                <p className='font-semibold'>Pembaruan Dana Grup</p>
                <p className='text-xs text-muted-foreground'>Proyek Sidoarjo Anda sekarang 50% didanai.</p>
              </Link>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/notifications" className='justify-center text-sm text-muted-foreground cursor-pointer'>
                  Lihat semua notifikasi
                </Link>
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Buka menu pengguna</span>
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
                {!isAdmin && (
                  <>
                    <DropdownMenuItem asChild className="px-4 py-2.5">
                      <Link href={`/profile/${user?.id}`} className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="px-4 py-2.5">
                      <Link href="/projects" className="flex items-center gap-3">
                        <FolderKanban className="h-4 w-4" />
                        <span>Proyek Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="px-4 py-2.5">
                      <Link href="/dashboard" className="flex items-center gap-3">
                        <Eye className="h-4 w-4" />
                        <span>Minat dan Watchlist</span>
                      </Link>
            </DropdownMenuItem>
                  </>
                )}
                
            <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="px-4 py-2.5 flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">Daftar</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
