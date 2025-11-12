import ProjectDashboard from '@/components/project-dashboard';
import { mockProjects } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }: { params: { id: string } }) {
    const project = mockProjects.find(p => p.id === params.id);

    if (!project) {
        notFound();
    }

    return (
        <main className="container mx-auto flex-1 py-6 sm:py-10">
            <ProjectDashboard project={project} />
        </main>
    )
}
