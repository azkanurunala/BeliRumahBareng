import ProjectsList from "@/components/projects-list";
import { mockProjects } from "@/lib/mock-data";

export default function ProjectsPage() {
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
                <ProjectsList projects={mockProjects} />
            </div>
        </div>
    )
}