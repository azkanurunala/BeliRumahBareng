'use client';

import { useEffect, useState } from 'react';
import ProjectDashboard from '@/components/project-dashboard';
import { getProject } from '@/lib/actions/project.actions';
import { notFound } from 'next/navigation';
import type { Project } from '@/lib/types';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const [projectId, setProjectId] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract project ID from params
    useEffect(() => {
        params.then(({ id }) => {
            setProjectId(id);
        });
    }, [params]);

    // Fetch project data using server action
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;

            setIsLoading(true);
            setError(null);

            try {
                const result = await getProject(projectId);
                
                if (result.success && result.data) {
                    setProject(result.data);
                } else {
                    setError(result.error?.message || 'Project tidak ditemukan');
                    setProject(null);
                }
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Terjadi kesalahan saat memuat project');
                setProject(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [projectId]);

    // Show loading state
    if (isLoading || !projectId) {
        return <div className="container mx-auto py-6 sm:py-10">Memuat...</div>;
    }

    // Show error or not found
    if (error || !project) {
        notFound();
    }

    // Function to refresh project data
    const refreshProject = async () => {
        if (!projectId) return;
        
        setIsLoading(true);
        setError(null);

        try {
            const result = await getProject(projectId);
            
            if (result.success && result.data) {
                setProject(result.data);
            } else {
                setError(result.error?.message || 'Project tidak ditemukan');
                setProject(null);
            }
        } catch (err) {
            console.error('Error fetching project:', err);
            setError('Terjadi kesalahan saat memuat project');
            setProject(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto flex-1 py-6 sm:py-10">
            <ProjectDashboard project={project} onProjectUpdate={refreshProject} />
        </main>
    )
}
