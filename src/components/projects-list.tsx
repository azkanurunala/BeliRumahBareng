'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@/lib/types';
import type { Property } from '@/lib/types';
import ProjectCard from './project-card';
import PropertyCard from './property-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Search } from 'lucide-react';
import { getProperties } from '@/lib/actions/property.actions';
import { LoadingInline } from './loading-inline';

type ProjectsListProps = {
  projects: Project[];
};

export default function ProjectsList({ projects }: ProjectsListProps) {
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  useEffect(() => {
    const loadRecommendedProperties = async () => {
      if (projects.length === 0) {
        setIsLoadingProperties(true);
        try {
          const result = await getProperties({ page: 1, limit: 3 });
          if (result.success && result.data) {
            setRecommendedProperties(result.data);
          }
        } catch (error) {
          console.error('Error loading recommended properties:', error);
        } finally {
          setIsLoadingProperties(false);
        }
      }
    };

    loadRecommendedProperties();
  }, [projects.length]);

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Belum ada proyek</p>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
              Mulai proyek co-buy pertama Anda untuk melihatnya di sini
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/discover">
                <Search className="mr-2 h-4 w-4" />
                Jelajahi Properti
              </Link>
            </Button>
          </CardContent>
        </Card>

        {isLoadingProperties ? (
          <Card>
            <CardContent className="py-12">
              <LoadingInline message="Memuat rekomendasi properti..." />
            </CardContent>
          </Card>
        ) : recommendedProperties.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-[#243665] to-foreground bg-clip-text text-transparent">
                Mulai dengan Properti Ini
              </h2>
              <p className="text-muted-foreground mt-2">
                Jelajahi properti yang tersedia untuk memulai proyek co-buy pertama Anda
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="text-center pt-4">
              <Button asChild variant="outline" className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105">
                <Link href="/discover">Lihat Semua Properti</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
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

