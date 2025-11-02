import Header from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import Link from 'next/link';

const notifications = [
    {
        title: 'Kecocokan Proyek Baru',
        description: 'Sebuah lahan di Sidoarjo cocok dengan profil Anda.',
        href: '/property/prop-001',
        time: '2 jam yang lalu'
    },
    {
        title: 'Pembaruan Dana Grup',
        description: 'Proyek Sidoarjo Anda sekarang 50% didanai.',
        href: '/projects/proj-001',
        time: '4 jam yang lalu'
    },
    {
        title: 'Dokumen Baru Ditambahkan',
        description: 'Perjanjian Kepemilikan Bersama telah ditambahkan ke Proyek Sidoarjo.',
        href: '/projects/proj-001',
        time: '1 hari yang lalu'
    },
    {
        title: 'Selamat Datang!',
        description: 'Selamat datang di BeliRumahBareng! Mari mulai investasi properti pertama Anda.',
        href: '/',
        time: '2 hari yang lalu'
    }
]

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-2xl py-6 sm:py-10">
          <Card>
            <CardHeader>
              <CardTitle>Semua Notifikasi</CardTitle>
              <CardDescription>Daftar semua pembaruan terkait akun dan proyek Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif, index) => (
                  <Link href={notif.href} key={index} className="block rounded-lg border p-4 transition-colors hover:bg-background">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bell size={18} />
                      </div>
                      <div className='flex-1'>
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">{notif.description}</p>
                        <p className='mt-1 text-xs text-muted-foreground/80'>{notif.time}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
