import ProjectDashboard from '@/components/project-dashboard';
import { mockProject } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }: { params: { id: string } }) {
    if (params.id !== mockProject.id) {
        notFound();
    }

    return (
        <main className="container mx-auto flex-1 py-6 sm:py-10">
            <ProjectDashboard project={mockProject} />
        </main>
    )
}
