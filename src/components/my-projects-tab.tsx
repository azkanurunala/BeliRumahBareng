import { mockProject } from "@/lib/mock-data";
import ProjectDashboard from "./project-dashboard";

export default function MyProjectsTab() {
  return (
    <div>
        <ProjectDashboard project={mockProject} />
    </div>
  )
}
