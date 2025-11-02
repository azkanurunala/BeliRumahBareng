import ProjectDashboard from '@/components/project-dashboard';
import Header from '@/components/header';
import { mockProject } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default function ProjectPage({ params }: { params: { id: string } }) {
    if (params.id !== mockProject.id) {
        notFound();
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="container mx-auto flex-1 py-6 sm:py-10">
                <ProjectDashboard project={mockProject} />
            </main>
        </div>
    )
}
