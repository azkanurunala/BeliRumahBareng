'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notification.actions';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getNotifications({
        userId: user.id,
        page: 1,
        limit: 100,
      });

      if (result.success && result.data) {
        setNotifications(result.data);
        setUnreadCount(result.meta?.unreadCount || 0);
      } else {
        console.error('Failed to load notifications:', result.error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat notifikasi',
        });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat notifikasi',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const result = await markAllNotificationsAsRead(user.id);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast({
          title: 'Berhasil',
          description: 'Semua notifikasi telah ditandai sebagai dibaca',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menandai semua notifikasi sebagai dibaca',
      });
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

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Silakan login untuk melihat notifikasi
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
        <p className="text-muted-foreground">
          Daftar semua notifikasi untuk admin
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Semua Notifikasi</CardTitle>
              <CardDescription>
                Daftar semua pembaruan terkait sistem dan aktivitas admin.
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Tandai semua sebagai dibaca
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const NotificationContent = (
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                      notif.read
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <Bell size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${notif.read ? '' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                );

                if (notif.href) {
                  return (
                    <Link
                      href={notif.href}
                      key={notif.id}
                      className="block rounded-lg border p-4 transition-colors hover:bg-background"
                      onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                    >
                      {NotificationContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    className="block rounded-lg border p-4 transition-colors hover:bg-background cursor-pointer"
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  >
                    {NotificationContent}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

