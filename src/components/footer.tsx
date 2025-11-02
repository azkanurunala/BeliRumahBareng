import Link from 'next/link';
import { CoBuyLogo } from './icons';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <CoBuyLogo className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">BeliRumahBareng</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Platform kepemilikan properti kolektif untuk masa depan finansial Anda.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-2">
            <div>
              <h3 className="font-semibold">Navigasi</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/discover" className="text-muted-foreground hover:text-primary">Jelajahi</Link></li>
                <li><Link href="/projects" className="text-muted-foreground hover:text-primary">Proyek Saya</Link></li>
                <li><Link href="/partners" className="text-muted-foreground hover:text-primary">Cari Rekan</Link></li>
                <li><Link href="/recommendations" className="text-muted-foreground hover:text-primary">Rekomendasi</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Syarat & Ketentuan</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Kebijakan Privasi</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Perusahaan</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Tentang Kami</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Kontak</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">FAQ</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BeliRumahBareng. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
