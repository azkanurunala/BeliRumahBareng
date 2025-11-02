import { Home, Users, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyProjectsTab from './my-projects-tab';
import DiscoverTab from './discover-tab';
import FindPartnersTab from './find-partners-tab';

export default function Dashboard() {
  return (
    <div className="container mx-auto py-6 sm:py-10">
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-fit">
          <TabsTrigger value="projects">
            <Home className="mr-2 h-4 w-4" />
            Proyek Saya
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Search className="mr-2 h-4 w-4" />
            Jelajahi
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Users className="mr-2 h-4 w-4" />
            Cari Rekan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-6">
          <MyProjectsTab />
        </TabsContent>
        <TabsContent value="discover" className="mt-6">
          <DiscoverTab />
        </TabsContent>
        <TabsContent value="partners" className="mt-6">
          <FindPartnersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
