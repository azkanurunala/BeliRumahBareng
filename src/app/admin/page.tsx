import { DashboardStats } from '@/components/admin/dashboard-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview dan statistik aplikasi BeliRumahBareng
        </p>
      </div>
      <DashboardStats />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terkini</CardTitle>
            <CardDescription>Log aktivitas sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur aktivitas log akan segera tersedia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Laporan</CardTitle>
            <CardDescription>Laporan dan analitik</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur laporan akan segera tersedia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
            <CardDescription>Konfigurasi sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur pengaturan akan segera tersedia
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

