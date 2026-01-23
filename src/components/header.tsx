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
import { getNotifications, markNotificationAsRead } from '@/lib/actions/notification.actions';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

type Notification = {
  id: string;
  userId: string;
  title: string;
  description: string;
  href: string | null;
  type: string;
  read: boolean;
  readAt: string | null | undefined;
  createdAt: string;
};

const navLinks = [
  { href: '/discover', label: 'Jelajahi' },
  { href: '/partners', label: 'Cari Rekan' },
  { href: '/recommendations', label: 'Rekomendasi' },
  { href: '/sell-property', label: 'Jual Properti' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications();
      // Polling removed to save database quota - notifications load once on mount
    }
  }, [isAuthenticated, user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const result = await getNotifications({
        userId: user.id,
        page: 1,
        limit: 10, // Max 10 untuk dropdown
      });

      if (result.success && result.data) {
        setNotifications(result.data);
        setUnreadCount(result.meta?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.href) {
      router.push(notification.href);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: id,
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = async () => {
    await logout();
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
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs" variant="destructive">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Buka notifikasi</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <DropdownMenuItem disabled>
                <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
              </DropdownMenuItem>
            ) : notifications.length === 0 ? (
              <DropdownMenuItem disabled>
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
              </DropdownMenuItem>
            ) : (
              <>
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="items-start cursor-pointer"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${notif.read ? '' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                      <p className="text-xs text-muted-foreground/80">{formatTime(notif.createdAt)}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/notifications" className='justify-center text-sm text-muted-foreground cursor-pointer'>
                    Lihat semua notifikasi
                  </Link>
                </DropdownMenuItem>
              </>
            )}
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
                      <Link href="/profile" className="flex items-center gap-3">
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
