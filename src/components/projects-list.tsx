'use client';

import type { Project } from '@/lib/types';
import ProjectCard from './project-card';
import { Card, CardContent } from '@/components/ui/card';
import { Building } from 'lucide-react';

type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Belum ada proyek</p>
          <p className="text-sm text-muted-foreground mt-2">
            Mulai proyek co-buy pertama Anda untuk melihatnya di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

