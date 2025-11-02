'use client';

import Link from 'next/link';
import { Bell, CircleUser } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
import { Badge } from './ui/badge';
import { mockUsers } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const currentUser = mockUsers[0];

const navLinks = [
  { href: '/discover', label: 'Jelajahi' },
  { href: '/projects', label: 'Proyek Saya' },
  { href: '/partners', label: 'Cari Rekan' },
  { href: '/recommendations', label: 'Rekomendasi' },
];

export default function Header() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <CoBuyLogo className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">BeliRumahBareng</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-4 lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                isClient && pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
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
            <DropdownMenuItem asChild>
              <Link href="/property/prop-001" className="flex-col items-start gap-1 cursor-pointer">
                <p className='font-semibold'>Kecocokan Proyek Baru</p>
                <p className='text-xs text-muted-foreground'>Sebuah lahan di Sidoarjo cocok dengan profil Anda.</p>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/projects/proj-001" className="flex-col items-start gap-1 cursor-pointer">
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
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${currentUser.id}`}>Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
