import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-4 sm:py-10 px-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Syarat & Ketentuan</CardTitle>
          <CardDescription>Terakhir diperbarui: 24 Juli 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
          <p>
            Selamat datang di BeliRumahBareng. Harap baca Syarat dan Ketentuan ini
            dengan saksama sebelum menggunakan platform kami. Dengan mengakses atau menggunakan
            layanan, Anda setuju untuk terikat oleh syarat dan ketentuan ini.
          </p>

          <h2 className="text-xl font-semibold mt-6">1. Definisi</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Platform:</strong> Merujuk pada situs web dan aplikasi BeliRumahBareng.</li>
            <li><strong>Pengguna:</strong> Setiap individu yang mendaftar dan menggunakan layanan Platform.</li>
            <li><strong>Proyek Co-Buying:</strong> Proyek pembelian properti secara kolektif yang difasilitasi oleh Platform.</li>
            <li><strong>Mitra:</strong> Pihak ketiga seperti notaris, agen properti, atau kontraktor yang bekerja sama dengan Platform.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">2. Penggunaan Platform</h2>
          <p>
            Anda setuju untuk menggunakan Platform hanya untuk tujuan yang sah dan sesuai dengan semua hukum yang berlaku. Anda bertanggung jawab penuh atas semua informasi yang Anda berikan dan aktivitas yang terjadi di bawah akun Anda.
          </p>

          <h2 className="text-xl font-semibold mt-6">3. Proses Co-Buying</h2>
          <p>
            Platform memfasilitasi proses co-buying mulai dari penemuan properti, pembentukan grup, hingga proses legal. Kami tidak bertindak sebagai pemilik atau penjual properti, melainkan sebagai fasilitator.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Semua properti yang terdaftar telah melalui proses kurasi awal, namun pengguna tetap diwajibkan untuk melakukan uji tuntas (due diligence) sendiri.</li>
            <li>Pembentukan grup pembelian didasarkan pada kesamaan minat dan profil yang diisi oleh pengguna.</li>
            <li>Semua transaksi finansial akan dikelola melalui rekening bersama (escrow) yang aman dan diawasi oleh notaris yang ditunjuk.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">4. Aspek Legal</h2>
          <p>
            Kepemilikan properti akan diatur dalam Perjanjian Kepemilikan Bersama (Co-Ownership Agreement) yang sah secara hukum. BeliRumahBareng akan memfasilitasi pembuatan dokumen ini dengan mitra notaris kami. Setiap anggota grup wajib mematuhi perjanjian tersebut.
          </p>

          <h2 className="text-xl font-semibold mt-6">5. Batasan Tanggung Jawab</h2>
          <p>
            BeliRumahBareng berusaha untuk memberikan informasi yang akurat dan terkini. Namun, kami tidak menjamin keakuratan, kelengkapan, atau keandalan informasi apa pun di Platform. Platform disediakan "apa adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kerugian finansial atau non-finansial yang mungkin timbul dari penggunaan Platform.
          </p>

          <h2 className="text-xl font-semibold mt-6">6. Perubahan Ketentuan</h2>
          <p>
            Kami berhak untuk mengubah atau mengganti Syarat dan Ketentuan ini kapan saja. Jika ada perubahan, kami akan memberitahu Anda melalui email atau notifikasi di platform. Dengan terus menggunakan layanan setelah perubahan tersebut, Anda setuju untuk terikat oleh syarat dan ketentuan yang telah direvisi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
