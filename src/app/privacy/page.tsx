import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-4 sm:py-10 px-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Kebijakan Privasi</CardTitle>
          <CardDescription>Terakhir diperbarui: 24 Juli 2024</CardDescription>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
          <p>
            Kebijakan Privasi ini menjelaskan bagaimana BeliRumahBareng ("kami") mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat Anda menggunakan platform kami.
          </p>

          <h2 className="text-xl font-semibold mt-6">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami mengumpulkan beberapa jenis informasi, termasuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Informasi Pendaftaran:</strong> Nama, alamat email, nomor telepon, dan kata sandi saat Anda membuat akun.</li>
            <li><strong>Informasi Profil:</strong> Preferensi investasi, kapasitas finansial, dan tujuan kepemilikan yang Anda berikan untuk fitur matchmaking dan rekomendasi.</li>
            <li><strong>Informasi Transaksi:</strong> Detail pembayaran dan transaksi saat Anda berpartisipasi dalam proyek co-buying.</li>
            <li><strong>Informasi Teknis:</strong> Alamat IP, jenis peramban, dan data penggunaan saat Anda berinteraksi dengan platform kami.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
          <p>Informasi Anda digunakan untuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Menyediakan, mengoperasikan, dan memelihara layanan kami.</li>
            <li>Memfasilitasi fitur perjodohan pengguna dan rekomendasi properti yang dipersonalisasi.</li>
            <li>Memproses transaksi dan mengelola partisipasi Anda dalam proyek co-buying.</li>
            <li>Mengirimkan notifikasi penting terkait akun dan proyek Anda.</li>
            <li>Meningkatkan dan mempersonalisasi pengalaman Anda di platform kami.</li>
            <li>Mematuhi kewajiban hukum dan peraturan yang berlaku.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">3. Pembagian Informasi</h2>
          <p>
            Kami tidak menjual informasi pribadi Anda. Kami dapat membagikan informasi Anda dengan pihak ketiga hanya dalam situasi berikut:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Dengan mitra tepercaya seperti notaris, bank, dan agen properti untuk memfasilitasi proses co-buying.</li>
            <li>Dengan pengguna lain dalam grup co-buying Anda sesuai dengan kebutuhan proyek.</li>
            <li>Jika diwajibkan oleh hukum atau untuk melindungi hak dan keamanan kami.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">4. Keamanan Data</h2>
          <p>
            Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi informasi Anda dari akses, pengungkapan, perubahan, atau penghancuran yang tidak sah. Namun, tidak ada metode transmisi melalui internet atau penyimpanan elektronik yang 100% aman.
          </p>

          <h2 className="text-xl font-semibold mt-6">5. Hak Anda</h2>
          <p>
            Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus informasi pribadi Anda. Anda dapat mengelola informasi profil Anda melalui pengaturan akun atau dengan menghubungi kami.
          </p>

          <h2 className="text-xl font-semibold mt-6">6. Kontak Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui halaman <a href="/contact">Kontak</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
