import Header from '@/components/header';
import Dashboard from '@/components/dashboard';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
}
