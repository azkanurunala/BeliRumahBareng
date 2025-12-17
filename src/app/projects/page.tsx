'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getProjects } from '@/lib/actions/project.actions';
import ProjectsList from "@/components/projects-list";
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const router = useRouter();

    // Load projects directly from database
    useEffect(() => {
        const loadProjects = async () => {
            try {
                setProjectsLoading(true);
                const result = await getProjects({ page: 1, limit: 1000 });
                if (result.success && result.data) {
                    setProjects(result.data);
                } else {
                    console.error('Failed to load projects:', result.error);
                    setProjects([]);
                }
            } catch (error) {
                console.error('Error loading projects:', error);
                setProjects([]);
            } finally {
                setProjectsLoading(false);
            }
        };

        if (isAuthenticated && !isAdmin) {
            loadProjects();
        }
    }, [isAuthenticated, isAdmin]);

    useEffect(() => {
        if (!isLoading) {
            if (isAdmin) {
                router.push('/admin/dashboard');
            } else if (!isAuthenticated) {
                router.push('/auth/login');
            }
        }
    }, [isAuthenticated, isLoading, isAdmin, router]);

    if (isLoading || projectsLoading) {
        return (
            <div className="container mx-auto py-6 sm:py-10">
                <div className="text-center">Memuat...</div>
            </div>
        );
    }

    if (!isAuthenticated || isAdmin) {
        return null;
    }

    return (
        <div className="container mx-auto py-6 sm:py-10">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        Proyek Saya
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Kelola dan pantau semua proyek co-buy Anda di sini
                    </p>
                </div>
                <ProjectsList projects={projects} />
            </div>
        </div>
    )
}