import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CoBuyLogo } from '@/components/icons';
import { Users, Target, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-background py-4 px-3 sm:py-10">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-primary/10">
        <div className="container mx-auto text-center px-4">
          <CoBuyLogo className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Tentang BeliRumahBareng</h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">
            Membuka gerbang kepemilikan properti untuk semua orang, melalui kekuatan kebersamaan.
          </p>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center px-4">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Misi Kami</h2>
            <p className="text-muted-foreground">
              Misi kami adalah mendemokratisasi kepemilikan properti di Indonesia. Kami percaya bahwa setiap orang berhak memiliki properti impiannya tanpa harus terbebani oleh harga yang selangit. Dengan menyediakan platform yang transparan, aman, dan mudah digunakan, kami memberdayakan individu untuk bersatu, mengumpulkan sumber daya, dan membeli properti secara kolektif.
            </p>
            <p className="text-muted-foreground">
              Kami memotong jalur birokrasi dan biaya-biaya yang tidak perlu yang seringkali dibebankan oleh pengembang, sehingga harga properti menjadi jauh lebih terjangkau.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Visi Kami</h2>
            <p className="text-muted-foreground">
              Kami membayangkan masa depan di mana kepemilikan properti bukanlah sebuah kemewahan, melainkan sebuah kemungkinan yang dapat diakses oleh semua lapisan masyarakat. Visi kami adalah membangun komunitas co-buying terbesar di Asia Tenggara, menciptakan ekosistem properti yang adil, kolaboratif, dan berkelanjutan.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-bold">Nilai-Nilai Kami</h2>
            <p className="mt-2 text-muted-foreground">
              Tiga pilar utama yang menjadi landasan kami dalam melayani Anda.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Kolaborasi</h3>
              <p className="mt-2 text-muted-foreground">Kami percaya pada kekuatan kebersamaan. Dengan bersatu, hal yang mustahil menjadi mungkin.</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Transparansi & Keamanan</h3>
              <p className="mt-2 text-muted-foreground">Setiap proses, mulai dari pendanaan hingga legalitas, dilakukan secara terbuka dan aman dengan mitra terpercaya.</p>
            </div>
            <div className="text-center p-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Inovasi</h3>
              <p className="mt-2 text-muted-foreground">Kami terus berinovasi untuk menyederhanakan proses kepemilikan properti dan memberikan pengalaman terbaik bagi pengguna.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
