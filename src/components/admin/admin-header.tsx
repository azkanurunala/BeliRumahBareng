'use client';

import { useEffect, useState } from 'react';
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
  readAt: string | null;
  createdAt: string;
};

export function AdminHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      // Polling removed to save database quota - notifications load once on mount
    }
  }, [user?.id]);

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
                  <Link href="/admin/notifications" className='justify-center text-sm text-muted-foreground cursor-pointer'>
                    Lihat semua notifikasi
                  </Link>
                </DropdownMenuItem>
              </>
            )}
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


