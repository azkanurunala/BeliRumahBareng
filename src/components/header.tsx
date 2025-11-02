import Link from 'next/link';
import { Bell, CircleUser, Home, Search, Users } from 'lucide-react';

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

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <CoBuyLogo className="h-6 w-6 text-primary" />
          <span className="font-bold">CoBuy</span>
        </Link>
      </nav>
      {/* Mobile nav could be added here with a Sheet component */}
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
            <DropdownMenuItem className="flex-col items-start gap-1">
                <p className='font-semibold'>Kecocokan Proyek Baru</p>
                <p className='text-xs text-muted-foreground'>Sebuah lahan di Bekasi cocok dengan profil Anda.</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex-col items-start gap-1">
                <p className='font-semibold'>Pembaruan Dana Grup</p>
                <p className='text-xs text-muted-foreground'>Proyek Sidoarjo Anda sekarang 50% didanai.</p>
            </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem className='justify-center text-sm text-muted-foreground'>
                Lihat semua notifikasi
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
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuItem>Dukungan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
