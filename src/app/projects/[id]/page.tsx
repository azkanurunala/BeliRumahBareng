'use client';

import { useEffect, useState } from 'react';
import ProjectDashboard from '@/components/project-dashboard';
import { useAdminData } from '@/contexts/admin-data-context';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { getProject } = useAdminData();
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        params.then(({ id }) => setProjectId(id));
    }, [params]);

    if (!projectId) {
        return <div className="container mx-auto py-6 sm:py-10">Memuat...</div>;
    }

    const project = getProject(projectId);

    if (!project) {
        notFound();
    }

    return (
        <main className="container mx-auto flex-1 py-6 sm:py-10">
            <ProjectDashboard project={project} />
        </main>
    )
}
