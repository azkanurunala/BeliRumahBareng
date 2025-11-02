import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { FileText, MessageCircle, Paperclip, Send } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';

type ProjectDashboardProps = {
  project: Project;
};

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Project Header */}
        <Card className="overflow-hidden">
            <div className='grid md:grid-cols-5'>
                <div className="relative aspect-video md:aspect-square md:col-span-2">
                    <Image
                        src={project.propertyImageUrl}
                        alt={project.propertyName}
                        fill
                        className="object-cover"
                        data-ai-hint={project.propertyImageHint}
                    />
                </div>
                <div className='p-6 md:col-span-3'>
                    <Badge>Sedang Berjalan</Badge>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                        {project.propertyName}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Selamat datang di dasbor proyek kolaboratif Anda. Lacak kemajuan, kelola dokumen, dan berkomunikasi dengan grup Anda di sini.
                    </p>
                </div>
            </div>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Kemajuan Proyek</CardTitle>
            <CardDescription>Status keseluruhan dari proyek co-buy Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Verifikasi KYC</p>
                <p className='font-medium'>{project.progress.kyc}%</p>
              </div>
              <Progress value={project.progress.kyc} aria-label={`${project.progress.kyc}% KYC terverifikasi`} />
            </div>
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Pendanaan Grup</p>
                <p className='font-medium'>{project.progress.funding}%</p>
              </div>
              <Progress value={project.progress.funding} aria-label={`${project.progress.funding}% didanai`} />
            </div>
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Legal & Dokumentasi</p>
                <p className='font-medium'>{project.progress.legal}%</p>
              </div>
              <Progress value={project.progress.legal} aria-label={`${project.progress.legal}% legal selesai`} />
            </div>
             <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Penutupan</p>
                <p className='font-medium'>{project.progress.closing}%</p>
              </div>
              <Progress value={project.progress.closing} aria-label={`${project.progress.closing}% selesai`} />
            </div>
          </CardContent>
        </Card>

        {/* Document Management */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen</CardTitle>
            <CardDescription>
              Kelola dan tanda tangani dokumen legal bersama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2"><FileText size={16} /> {doc.name}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'Terverifikasi' ? 'default' : doc.status === 'Tertanda' ? 'secondary' : 'outline'}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.status === 'Menunggu' && <Button size="sm">Tanda Tangan</Button>}
                      {doc.status !== 'Menunggu' && <Button size="sm" variant="outline">Lihat</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
      <div className="space-y-6 lg:col-span-1">
        {/* Project Members */}
        <Card>
          <CardHeader>
            <CardTitle>Anggota Proyek</CardTitle>
            <CardDescription>{project.members.length} orang di grup ini</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {project.members.map((member) => (
              <Link href={`/profile/${member.id}`} key={member.id} className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} className="object-cover" />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{member.name}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
