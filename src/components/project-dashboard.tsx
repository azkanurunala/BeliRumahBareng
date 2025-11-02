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
                    <Badge>In Progress</Badge>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                        {project.propertyName}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Welcome to your collaborative project dashboard. Track progress, manage documents, and communicate with your group here.
                    </p>
                </div>
            </div>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall status of your co-buy project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>KYC Verification</p>
                <p className='font-medium'>{project.progress.kyc}%</p>
              </div>
              <Progress value={project.progress.kyc} aria-label={`${project.progress.kyc}% KYC verified`} />
            </div>
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Group Funding</p>
                <p className='font-medium'>{project.progress.funding}%</p>
              </div>
              <Progress value={project.progress.funding} aria-label={`${project.progress.funding}% funded`} />
            </div>
            <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Legal & Documentation</p>
                <p className='font-medium'>{project.progress.legal}%</p>
              </div>
              <Progress value={project.progress.legal} aria-label={`${project.progress.legal}% legal complete`} />
            </div>
             <div className="space-y-2">
              <div className='flex justify-between text-sm'>
                <p>Closing</p>
                <p className='font-medium'>{project.progress.closing}%</p>
              </div>
              <Progress value={project.progress.closing} aria-label={`${project.progress.closing}% complete`} />
            </div>
          </CardContent>
        </Card>

        {/* Document Management */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Manage and sign shared legal documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2"><FileText size={16} /> {doc.name}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'Verified' ? 'default' : doc.status === 'Signed' ? 'secondary' : 'outline'}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.status === 'Pending' && <Button size="sm">Sign Now</Button>}
                      {doc.status !== 'Pending' && <Button size="sm" variant="outline">View</Button>}
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
            <CardTitle>Project Members</CardTitle>
            <CardDescription>{project.members.length} people in this group</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {project.members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{member.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Group Chat */}
        <Card className="flex h-[34rem] flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle /> Group Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
             <ScrollArea className="h-full px-6">
                <div className="space-y-4">
                {project.messages.map((msg, index) => {
                    const member = project.members.find(m => m.id === msg.userId);
                    const isCurrentUser = msg.userId === project.members[0].id; // Assuming current user is the first member
                    return (
                    <div key={index} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                        {!isCurrentUser && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member?.avatarUrl} data-ai-hint={member?.avatarHint} />
                                <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`max-w-xs rounded-lg p-3 ${isCurrentUser ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-secondary'}`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{member?.name}, {msg.timestamp}</p>
                        </div>
                         {isCurrentUser && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member?.avatarUrl} data-ai-hint={member?.avatarHint} />
                                <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                    )
                })}
                </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t p-2">
            <div className="flex w-full items-center gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
                <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Attach file</span>
                </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
