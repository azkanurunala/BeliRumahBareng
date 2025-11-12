import type { Property, User, Project } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  return {
    url: img?.imageUrl ?? 'https://picsum.photos/seed/error/200/200',
    hint: img?.imageHint ?? 'image'
  };
};

// Helper function untuk mendapatkan path gambar lokal
const getLocalImage = (filename: string, hint: string = 'property image') => ({
  url: `/images/floor-plans/${filename}`,
  hint
});

export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: 'Kavling Tanah di Sidoarjo',
    description: 'Sebidang tanah luas di Sidoarjo, ideal untuk dibagi menjadi beberapa kavling perumahan. Beli tanahnya bersama, bangun rumah impian Anda sendiri.',
    price: 1800000000,
    location: 'Sidoarjo, Surabaya',
    images: [
      getLocalImage('01.png', 'property cover'),
      getLocalImage('04.png', 'floor plan'),
      getLocalImage('05.png', 'floor plan'),
      getLocalImage('06.png', 'floor plan'),
      getLocalImage('07.png', 'property image'),
    ],
    type: 'co-owning',
    totalUnits: 9,
    unitName: 'Kavling',
    unitSize: 110,
    unitMeasure: 'm²',
    planningInfo: {
      sitePlanUrl: '/images/floor-plans/04.png',
      sitePlanHint: 'floor plan',
      developmentPlan: `Proyek pengembangan lahan di Sidoarjo ini dirancang dengan pendekatan bertahap untuk memastikan kualitas dan efisiensi. Fase pertama akan berfokus pada persiapan infrastruktur dasar yang krusial. Ini mencakup pematangan lahan secara menyeluruh, pembersihan, dan perataan kontur tanah untuk memastikan setiap kavling berada pada elevasi yang optimal dan aman. Proses ini juga melibatkan pembuatan jalan utama dengan lebar 8 meter yang akan menjadi akses sentral di dalam area perumahan.

Fase kedua adalah tahap realisasi kavling dan penyerahan kepada para pemilik. Setelah infrastruktur jalan utama dan saluran drainase primer selesai, tim akan melakukan pembagian kavling secara akurat sesuai dengan denah yang telah disetujui bersama. Setiap kavling akan memiliki patok batas yang jelas. Setelah proses administrasi dan serah terima selesai, para pemilik kavling diberikan kebebasan untuk memulai proses desain dan pembangunan rumah impian mereka masing-masing, sesuai dengan pedoman desain umum yang telah ditetapkan untuk menjaga keserasian lingkungan.

Manajemen proyek akan bertanggung jawab penuh atas penyediaan semua fasilitas umum yang tertera dalam rencana. Ini termasuk instalasi jaringan listrik dan air bersih hingga ke depan setiap kavling, serta pembangunan sistem drainase sekunder yang terhubung ke saluran utama. Kami berkomitmen untuk memastikan semua infrastruktur ini siap sebelum atau bersamaan dengan selesainya pembangunan unit rumah pertama.

Untuk menjaga nilai investasi dan kenyamanan jangka panjang, akan dibentuk sebuah badan pengelola lingkungan atau 'homeowners association' (HOA). Badan ini, yang terdiri dari perwakilan pemilik kavling, akan bertanggung jawab atas pemeliharaan fasilitas umum, pengelolaan kebersihan dan keamanan, serta penerapan aturan lingkungan. Iuran bulanan yang wajar akan ditetapkan bersama untuk mendanai operasional badan pengelola ini, memastikan lingkungan perumahan tetap asri, aman, dan terawat dengan baik.`,
      environmentalAnalysis: `Lokasi properti ini telah melalui analisis hidrologi yang mendalam dan terbukti berada di zona bebas banjir. Kontur tanah yang sedikit lebih tinggi dari area sekitarnya serta adanya sistem drainase yang direncanakan secara matang memastikan aliran air hujan dapat dikelola dengan efektif, mengurangi risiko genangan air bahkan saat curah hujan tinggi. Keunggulan ini memberikan rasa aman dan jaminan investasi jangka panjang bagi para pemilik.

Dari segi aksesibilitas, lokasi ini sangat strategis. Terletak hanya 10 menit dari gerbang tol Waru, properti ini menawarkan konektivitas yang sangat baik ke pusat kota Surabaya, bandara Juanda, dan kawasan industri di sekitarnya. Kemudahan akses ini tidak hanya mempersingkat waktu tempuh harian tetapi juga secara signifikan meningkatkan potensi apresiasi nilai properti di masa depan seiring dengan terus berkembangnya infrastruktur di koridor ini.

Potensi pertumbuhan nilai investasi di area ini sangat menjanjikan. Analisis pasar properti menunjukkan tren kenaikan harga tanah rata-rata sebesar 15-20% per tahun, didorong oleh ekspansi area komersial dan residensial di sekitarnya. Beberapa pengembang besar telah memulai proyek di dekat lokasi, yang akan menciptakan efek ganda (multiplier effect) pada harga dan permintaan. Ini menjadikan pembelian kavling saat ini sebagai langkah investasi yang sangat cerdas.

Kualitas hidup di sekitar lokasi didukung oleh ketersediaan fasilitas umum yang sangat lengkap. Dalam radius kurang dari 3 kilometer, terdapat beberapa sekolah unggulan, mulai dari tingkat dasar hingga menengah atas, serta institusi pendidikan tinggi. Fasilitas kesehatan seperti rumah sakit modern dan berbagai klinik spesialis juga mudah dijangkau. Selain itu, pusat perbelanjaan, pasar tradisional, dan area kuliner yang beragam memastikan semua kebutuhan harian dan gaya hidup dapat terpenuhi dengan mudah.`,
    }
  },
  {
    id: 'prop-002',
    name: 'Apartemen Co-Build di Bekasi',
    description: 'Proyek patungan untuk membeli tanah dan membangun gedung apartemen 5 lantai di lokasi strategis Bekasi. Miliki satu lantai penuh.',
    price: 2500000000,
    location: 'Bekasi, Jawa Barat',
    images: [
      getLocalImage('02.png', 'property cover'),
      getLocalImage('04.png', 'floor plan'),
      getLocalImage('05.png', 'floor plan'),
      getLocalImage('06.png', 'floor plan'),
      getLocalImage('08.png', 'property image'),
    ],
    type: 'co-building',
    totalUnits: 5,
    unitName: 'Lantai',
    planningInfo: {
      sitePlanUrl: '/images/floor-plans/05.png',
      sitePlanHint: 'floor plan',
      developmentPlan: `Rencana pengembangan proyek apartemen ini akan dieksekusi setelah target pendanaan awal sebesar 70% dari total nilai proyek berhasil tercapai. Dana awal ini akan digunakan untuk akuisisi lahan secara penuh dan biaya perizinan awal, memberikan keamanan hukum bagi seluruh anggota grup. Proses penggalangan dana akan dilakukan secara transparan melalui rekening bersama (escrow account) yang diawasi oleh notaris independen.

Setelah pendanaan dan legalitas lahan aman, tahap konstruksi akan segera dimulai. Perkiraan durasi pembangunan adalah sekitar 18 hingga 24 bulan, tergantung pada kondisi cuaca dan logistik. Kami telah menunjuk kontraktor bereputasi dengan rekam jejak terbukti dalam membangun hunian vertikal berkualitas. Proses pembangunan akan diawasi oleh tim pengawas independen untuk memastikan semua spesifikasi teknis dan standar keselamatan terpenuhi. Laporan kemajuan konstruksi akan dibagikan kepada anggota secara berkala.

Desain gedung apartemen ini mengusung konsep modern-minimalis yang efisien. Gedung akan terdiri dari basement untuk area parkir yang aman, lantai dasar yang dialokasikan untuk fasilitas komersial seperti kafe atau minimarket untuk menambah kenyamanan penghuni, serta empat lantai hunian di atasnya. Setiap anggota grup co-build akan memiliki hak milik atas satu lantai penuh, memberikan privasi dan fleksibilitas untuk menata interior sesuai selera masing-masing.

Fasilitas bersama akan menjadi nilai tambah utama dari proyek ini. Direncanakan akan ada sebuah rooftop garden yang dapat digunakan oleh semua penghuni untuk bersantai, sistem keamanan 24 jam dengan CCTV, serta lobi utama yang representatif. Pengelolaan gedung setelah selesai akan ditangani oleh badan pengelola profesional yang akan bertanggung jawab atas pemeliharaan, kebersihan, dan keamanan, memastikan nilai properti tetap terjaga dalam jangka panjang.`,
      environmentalAnalysis: `Properti ini berlokasi di jantung kawasan pusat bisnis (CBD) Bekasi, sebuah area yang mengalami pertumbuhan pesat dalam satu dekade terakhir. Dikelilingi oleh gedung-gedung perkantoran, pusat perbelanjaan besar seperti Summarecon Mall Bekasi dan Metropolitan Mall, serta hotel-hotel ternama. Keberadaan di pusat aktivitas ekonomi ini menjamin permintaan sewa yang tinggi dan stabil, terutama dari kalangan profesional muda dan ekspatriat yang bekerja di area tersebut.

Konektivitas transportasi menjadi salah satu keunggulan utama lokasi ini. Properti ini hanya berjarak beberapa menit dari stasiun LRT Bekasi Barat dan stasiun KRL Bekasi, memberikan akses mudah dan cepat menuju pusat Jakarta. Selain itu, akses ke Tol Jakarta-Cikampek juga sangat dekat, memudahkan perjalanan menggunakan kendaraan pribadi. Infrastruktur transportasi yang terintegrasi ini menjadikan lokasi sangat ideal bagi para komuter.

Analisis pasar menunjukkan potensi imbal hasil sewa (rental yield) yang sangat menarik di area ini, diperkirakan berada di angka 6-8% per tahun. Permintaan unit hunian di pusat Bekasi terus meningkat, sementara pasokan unit berkualitas masih terbatas. Dengan memiliki satu lantai penuh, investor memiliki fleksibilitas untuk menyewakan sebagai satu unit besar atau membaginya menjadi beberapa unit lebih kecil (tergantung peraturan yang berlaku) untuk memaksimalkan pendapatan sewa.

Dari sisi fasilitas pendukung, lokasi ini tidak perlu diragukan lagi. Berbagai fasilitas pendidikan dari sekolah internasional hingga universitas ternama berada dalam jangkauan. Rumah sakit besar dengan layanan lengkap seperti RS Mitra Keluarga dan RS Awal Bros juga sangat dekat. Kehadiran fasilitas-fasilitas ini tidak hanya meningkatkan kenyamanan hidup tetapi juga menjadi faktor penting yang mendorong apresiasi nilai properti di masa depan.`,
    }
  },
  {
    id: 'prop-003',
    name: 'Flat Co-Build di Jakarta Pusat',
    description: 'Miliki satu lantai di gedung flat modern yang akan kita bangun bersama di jantung kota Jakarta. Investasi cerdas untuk hunian vertikal.',
    price: 3200000000,
    location: 'Jakarta Pusat, DKI Jakarta',
    images: [
      getLocalImage('03.png', 'property cover'),
      getLocalImage('04.png', 'floor plan'),
      getLocalImage('05.png', 'floor plan'),
      getLocalImage('06.png', 'floor plan'),
      getLocalImage('09.png', 'property image'),
    ],
    type: 'co-building',
    totalUnits: 8,
    unitName: 'Lantai',
    planningInfo: {
      sitePlanUrl: '/images/floor-plans/06.png',
      sitePlanHint: 'floor plan',
      developmentPlan: `Proyek flat co-build di Jakarta Pusat ini dirancang untuk memberikan solusi hunian vertikal yang terjangkau di lokasi strategis. Setelah target pendanaan tercapai, konstruksi akan dimulai dengan durasi estimasi 20-24 bulan.`,
      environmentalAnalysis: `Lokasi di jantung Jakarta Pusat memberikan aksesibilitas tinggi ke berbagai fasilitas publik, transportasi massal, dan pusat bisnis. Area ini memiliki potensi apresiasi nilai yang sangat baik.`,
    },
  },
  {
    id: 'prop-004',
    name: 'Tanah Kavling Fleksibel di Tangerang',
    description: 'Kawasan tanah prospektif di Tangerang untuk dimiliki bersama. Jumlah dan luas kavling akan ditentukan bersama berdasarkan jumlah investor final.',
    price: 2000000000,
    totalArea: 1000,
    location: 'Tangerang, Banten',
    images: [
      getLocalImage('01.png', 'property cover'),
      getLocalImage('04.png', 'floor plan'),
      getLocalImage('05.png', 'floor plan'),
      getLocalImage('06.png', 'floor plan'),
      getLocalImage('10.png', 'property image'),
    ],
    type: 'co-owning',
    unitName: 'Kepemilikan',
    unitMeasure: 'm²',
    planningInfo: {
      sitePlanUrl: '/images/floor-plans/04.png',
      sitePlanHint: 'floor plan',
      developmentPlan: `Proyek tanah kavling fleksibel ini memberikan kebebasan kepada investor untuk menentukan pembagian lahan berdasarkan jumlah peserta final. Setelah periode penggalangan dana selesai, lahan akan dibagi secara proporsional.`,
      environmentalAnalysis: `Lokasi di Tangerang menawarkan potensi pertumbuhan yang tinggi dengan akses mudah ke Jakarta dan Bandara Soekarno-Hatta. Area ini sedang berkembang pesat dengan berbagai proyek infrastruktur baru.`,
    },
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: 'Adi',
    avatarUrl: getImage('user-1').url,
    avatarHint: getImage('user-1').hint,
    profile: {
      locationPreference: 'Surabaya',
      priceRange: '300-600 juta IDR',
      investmentGoals: 'Kepemilikan rumah pertama',
      financialCapacity: '500 juta IDR',
      timeHorizon: 'Jangka panjang (10+ tahun)',
    },
  },
  {
    id: 'user-002',
    name: 'Budi',
    avatarUrl: getImage('user-2').url,
    avatarHint: getImage('user-2').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '250-400 juta IDR',
      investmentGoals: 'Pendapatan sewa',
      financialCapacity: '300 juta IDR',
      timeHorizon: 'Jangka menengah (5-10 tahun)',
    },
  },
  {
    id: 'user-003',
    name: 'Citra',
    avatarUrl: getImage('user-3').url,
    avatarHint: getImage('user-3').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '250-450 juta IDR',
      investmentGoals: 'Apresiasi modal',
      financialCapacity: '350 juta IDR',
      timeHorizon: 'Jangka menengah (5-10 tahun)',
    },
  },
  {
    id: 'user-004',
    name: 'Dewi',
    avatarUrl: getImage('user-4').url,
    avatarHint: getImage('user-4').hint,
    profile: {
      locationPreference: 'Yogyakarta',
      priceRange: '400-800 juta IDR',
      investmentGoals: 'Penggunaan bisnis (ruko)',
      financialCapacity: '700 juta IDR',
      timeHorizon: 'Jangka panjang (10+ tahun)',
    },
  },
  {
    id: 'user-005',
    name: 'Eka',
    avatarUrl: getImage('user-5').url,
    avatarHint: getImage('user-5').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '200-400 juta IDR',
      investmentGoals: 'Investasi jangka panjang',
      financialCapacity: '300 juta IDR',
      timeHorizon: 'Jangka panjang (10+ tahun)',
    },
  },
  {
    id: 'user-006',
    name: 'Fajar',
    avatarUrl: getImage('user-6').url,
    avatarHint: getImage('user-6').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '300-500 juta IDR',
      investmentGoals: 'Penggunaan pribadi di masa depan',
      financialCapacity: '400 juta IDR',
      timeHorizon: 'Jangka menengah (5-10 tahun)',
    },
  },
];

const sidoarjoProject = mockProperties[0];
const sidoarjoMembers = [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]];

export const mockProject: Project = {
    id: 'proj-001',
    propertyId: sidoarjoProject.id!,
    propertyName: sidoarjoProject.name,
    propertyImageUrl: sidoarjoProject.images[0].url,
    propertyImageHint: sidoarjoProject.images[0].hint,
    members: sidoarjoMembers,
    unitAssignments: [
      { userId: 'user-001', unitId: 1, price: 200000000, size: 102 },
      { userId: 'user-002', unitId: 3, price: 208000000, size: 106 },
      { userId: 'user-004', unitId: 5, price: 216000000, size: 110 },
    ],
    progress: {
        kyc: 100,
        funding: 100,
        legal: 100,
        closing: 100,
    },
    progressDetails: {
        kyc: {
            title: 'Verifikasi KYC',
            percentage: 100,
            description: 'Proses verifikasi identitas dan dokumen KYC untuk semua anggota grup.',
            checklist: [
                { id: 'kyc-1', label: 'Formulir KYC diisi oleh semua anggota', completed: true, completedBy: 'user-001', completedAt: '2024-01-15T10:00:00Z' },
                { id: 'kyc-2', label: 'Upload KTP/SIM semua anggota', completed: true, completedBy: 'user-002', completedAt: '2024-01-15T11:30:00Z' },
                { id: 'kyc-3', label: 'Upload NPWP semua anggota', completed: true, completedBy: 'user-001', completedAt: '2024-01-16T09:15:00Z' },
                { id: 'kyc-4', label: 'Verifikasi dokumen oleh tim legal', completed: true, completedBy: 'user-001', completedAt: '2024-01-20T17:00:00Z' },
            ],
            completedMembers: ['user-001', 'user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Mulai Verifikasi', date: '2024-01-15T08:00:00Z', status: 'completed' },
                { label: 'Dokumen Lengkap', date: '2024-01-16T12:00:00Z', status: 'completed' },
                { label: 'Verifikasi Selesai', date: '2024-01-20T17:00:00Z', status: 'completed' },
            ],
            notes: 'Semua dokumen KYC telah diverifikasi dan disetujui.',
        },
        funding: {
            title: 'Pendanaan Grup',
            percentage: 100,
            description: 'Pengumpulan dana dari semua anggota untuk pembelian properti.',
            checklist: [
                { id: 'fund-1', label: 'Pembayaran DP dari user-001 (Rp 60.000.000)', completed: true, completedBy: 'user-001', completedAt: '2024-01-18T14:00:00Z' },
                { id: 'fund-2', label: 'Pembayaran DP dari user-002 (Rp 62.400.000)', completed: true, completedBy: 'user-002', completedAt: '2024-01-18T15:30:00Z' },
                { id: 'fund-3', label: 'Pembayaran DP dari user-003 (Rp 60.000.000)', completed: true, completedBy: 'user-003', completedAt: '2024-01-20T10:00:00Z' },
                { id: 'fund-4', label: 'Pembayaran DP dari user-004 (Rp 64.800.000)', completed: true, completedBy: 'user-004', completedAt: '2024-01-19T10:00:00Z' },
                { id: 'fund-5', label: 'Pembayaran pelunasan dari semua anggota', completed: true, completedBy: 'user-001', completedAt: '2024-02-05T14:00:00Z' },
            ],
            completedMembers: ['user-001', 'user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Target DP 30%', date: '2024-01-20T23:59:59Z', status: 'completed' },
                { label: 'Target DP 60%', date: '2024-01-25T23:59:59Z', status: 'completed' },
                { label: 'Pembayaran Lunas', date: '2024-02-05T23:59:59Z', status: 'completed' },
            ],
            notes: 'Semua pembayaran telah lunas. Total terkumpul: Rp 624.000.000.',
        },
        legal: {
            title: 'Legal & Dokumentasi',
            percentage: 100,
            description: 'Proses legal dan penyelesaian dokumen kepemilikan.',
            checklist: [
                { id: 'legal-1', label: 'Perjanjian Kepemilikan Bersama ditandatangani', completed: true, completedBy: 'user-001', completedAt: '2024-01-22T14:00:00Z' },
                { id: 'legal-2', label: 'Sertifikat Hak Milik diverifikasi', completed: true, completedBy: 'user-001', completedAt: '2024-01-10T09:00:00Z' },
                { id: 'legal-3', label: 'Akta Jual Beli disiapkan', completed: true, completedBy: 'user-001', completedAt: '2024-01-30T17:00:00Z' },
                { id: 'legal-4', label: 'Pembagian unit ditetapkan secara legal', completed: true, completedBy: 'user-001', completedAt: '2024-02-01T10:00:00Z' },
            ],
            completedMembers: ['user-001', 'user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Verifikasi Sertifikat', date: '2024-01-10T09:00:00Z', status: 'completed' },
                { label: 'Penandatanganan Perjanjian', date: '2024-01-22T14:00:00Z', status: 'completed' },
                { label: 'Akta Jual Beli Selesai', date: '2024-01-30T17:00:00Z', status: 'completed' },
            ],
            notes: 'Semua dokumen legal telah lengkap dan ditandatangani oleh semua anggota.',
        },
        closing: {
            title: 'Penutupan',
            percentage: 100,
            description: 'Proses akhir penutupan transaksi dan serah terima properti.',
            checklist: [
                { id: 'close-1', label: 'Semua pembayaran lunas', completed: true, completedBy: 'user-001', completedAt: '2024-02-05T14:00:00Z' },
                { id: 'close-2', label: 'Dokumen legal lengkap', completed: true, completedBy: 'user-001', completedAt: '2024-02-01T10:00:00Z' },
                { id: 'close-3', label: 'Sertifikat dibagi sesuai unit', completed: true, completedBy: 'user-001', completedAt: '2024-02-10T14:00:00Z' },
                { id: 'close-4', label: 'Serah terima properti', completed: true, completedBy: 'user-001', completedAt: '2024-02-15T10:00:00Z' },
            ],
            completedMembers: ['user-001', 'user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Pembayaran Lunas', date: '2024-02-05T23:59:59Z', status: 'completed' },
                { label: 'Penutupan Transaksi', date: '2024-02-10T14:00:00Z', status: 'completed' },
                { label: 'Serah Terima', date: '2024-02-15T10:00:00Z', status: 'completed' },
            ],
            notes: 'Proyek telah selesai dan serah terima properti telah dilakukan. Cicilan bulanan sedang berjalan.',
        },
    },
    documents: [
        {
            id: 'doc-01',
            name: 'Perjanjian Kepemilikan Bersama',
            status: 'Tertanda',
            description: 'Dokumen perjanjian yang mengatur hak dan kewajiban semua anggota dalam kepemilikan bersama properti ini.',
            uploadDate: '2024-01-12T10:00:00Z',
            size: 245760, // 240 KB
            uploadedBy: 'user-001',
            signedBy: ['user-001', 'user-002', 'user-003', 'user-004'],
        },
        {
            id: 'doc-02',
            name: 'Sertifikat Hak Milik Properti',
            status: 'Terverifikasi',
            description: 'Sertifikat SHM asli dari properti yang akan dibeli. Sudah diverifikasi oleh tim legal.',
            uploadDate: '2024-01-08T09:00:00Z',
            size: 512000, // 500 KB
            uploadedBy: 'user-001',
            verifiedAt: '2024-01-10T09:00:00Z',
        },
        {
            id: 'doc-03',
            name: 'Formulir KYC (Semua anggota)',
            status: 'Terverifikasi',
            description: 'Formulir Know Your Customer yang harus diisi oleh semua anggota grup. Berisi informasi identitas dan dokumen pendukung.',
            uploadDate: '2024-01-15T08:00:00Z',
            size: 153600, // 150 KB
            uploadedBy: 'user-001',
            signedBy: ['user-001', 'user-002', 'user-003', 'user-004'],
            verifiedAt: '2024-01-20T17:00:00Z',
        },
    ],
    messages: [
        { userId: 'user-002', message: 'Hai semuanya! Senang menjadi bagian dari proyek ini.', timestamp: '10:30' },
        { userId: 'user-001', message: 'Saya juga! Lokasinya kelihatan bagus.', timestamp: '10:31' },
        { userId: 'user-003', message: 'Saya sudah meninjau perjanjiannya. Terlihat bagus bagi saya.', timestamp: '11:15' },
    ],
    status: 'closed',
    installmentPlans: [
        {
            id: 'install-001',
            projectId: 'proj-001',
            userId: 'user-001',
            unitId: 1,
            totalAmount: 200000000,
            downPayment: 60000000, // 30% DP
            installmentAmount: 5000000, // 5 juta per bulan
            totalInstallments: 28, // 28 bulan
            startDate: '2024-03-01T00:00:00Z',
            endDate: '2026-06-01T00:00:00Z',
            status: 'active',
            payments: [
                {
                    id: 'pay-001',
                    projectId: 'proj-001',
                    userId: 'user-001',
                    unitId: 1,
                    amount: 5000000,
                    paymentDate: '2024-03-05T10:00:00Z',
                    dueDate: '2024-03-01T00:00:00Z',
                    period: '2024-03',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-001.pdf',
                    verifiedAt: '2024-03-05T11:00:00Z',
                    createdAt: '2024-03-05T10:00:00Z',
                },
                {
                    id: 'pay-002',
                    projectId: 'proj-001',
                    userId: 'user-001',
                    unitId: 1,
                    amount: 5000000,
                    paymentDate: '2024-04-03T14:30:00Z',
                    dueDate: '2024-04-01T00:00:00Z',
                    period: '2024-04',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-002.pdf',
                    verifiedAt: '2024-04-03T15:00:00Z',
                    createdAt: '2024-04-03T14:30:00Z',
                },
                {
                    id: 'pay-003',
                    projectId: 'proj-001',
                    userId: 'user-001',
                    unitId: 1,
                    amount: 5000000,
                    paymentDate: '2024-05-02T09:15:00Z',
                    dueDate: '2024-05-01T00:00:00Z',
                    period: '2024-05',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-003.pdf',
                    verifiedAt: '2024-05-02T10:00:00Z',
                    createdAt: '2024-05-02T09:15:00Z',
                },
                {
                    id: 'pay-004',
                    projectId: 'proj-001',
                    userId: 'user-001',
                    unitId: 1,
                    amount: 5000000,
                    dueDate: '2024-06-01T00:00:00Z',
                    period: '2024-06',
                    status: 'pending',
                    createdAt: '2024-05-15T00:00:00Z',
                },
            ],
        },
        {
            id: 'install-002',
            projectId: 'proj-001',
            userId: 'user-002',
            unitId: 3,
            totalAmount: 208000000,
            downPayment: 62400000, // 30% DP
            installmentAmount: 5200000, // 5.2 juta per bulan
            totalInstallments: 28,
            startDate: '2024-03-01T00:00:00Z',
            endDate: '2026-06-01T00:00:00Z',
            status: 'active',
            payments: [
                {
                    id: 'pay-005',
                    projectId: 'proj-001',
                    userId: 'user-002',
                    unitId: 3,
                    amount: 5200000,
                    paymentDate: '2024-03-04T11:20:00Z',
                    dueDate: '2024-03-01T00:00:00Z',
                    period: '2024-03',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-005.pdf',
                    verifiedAt: '2024-03-04T12:00:00Z',
                    createdAt: '2024-03-04T11:20:00Z',
                },
                {
                    id: 'pay-006',
                    projectId: 'proj-001',
                    userId: 'user-002',
                    unitId: 3,
                    amount: 5200000,
                    paymentDate: '2024-04-02T16:45:00Z',
                    dueDate: '2024-04-01T00:00:00Z',
                    period: '2024-04',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-006.pdf',
                    verifiedAt: '2024-04-02T17:00:00Z',
                    createdAt: '2024-04-02T16:45:00Z',
                },
                {
                    id: 'pay-007',
                    projectId: 'proj-001',
                    userId: 'user-002',
                    unitId: 3,
                    amount: 5200000,
                    dueDate: '2024-05-01T00:00:00Z',
                    period: '2024-05',
                    status: 'overdue',
                    createdAt: '2024-04-20T00:00:00Z',
                },
                {
                    id: 'pay-008',
                    projectId: 'proj-001',
                    userId: 'user-002',
                    unitId: 3,
                    amount: 5200000,
                    dueDate: '2024-06-01T00:00:00Z',
                    period: '2024-06',
                    status: 'pending',
                    createdAt: '2024-05-15T00:00:00Z',
                },
            ],
        },
        {
            id: 'install-003',
            projectId: 'proj-001',
            userId: 'user-004',
            unitId: 5,
            totalAmount: 216000000,
            downPayment: 64800000, // 30% DP
            installmentAmount: 5400000, // 5.4 juta per bulan
            totalInstallments: 28,
            startDate: '2024-03-01T00:00:00Z',
            endDate: '2026-06-01T00:00:00Z',
            status: 'active',
            payments: [
                {
                    id: 'pay-009',
                    projectId: 'proj-001',
                    userId: 'user-004',
                    unitId: 5,
                    amount: 5400000,
                    paymentDate: '2024-03-06T13:10:00Z',
                    dueDate: '2024-03-01T00:00:00Z',
                    period: '2024-03',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-009.pdf',
                    verifiedAt: '2024-03-06T14:00:00Z',
                    createdAt: '2024-03-06T13:10:00Z',
                },
                {
                    id: 'pay-010',
                    projectId: 'proj-001',
                    userId: 'user-004',
                    unitId: 5,
                    amount: 5400000,
                    paymentDate: '2024-04-01T10:00:00Z',
                    dueDate: '2024-04-01T00:00:00Z',
                    period: '2024-04',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-010.pdf',
                    verifiedAt: '2024-04-01T11:00:00Z',
                    createdAt: '2024-04-01T10:00:00Z',
                },
                {
                    id: 'pay-011',
                    projectId: 'proj-001',
                    userId: 'user-004',
                    unitId: 5,
                    amount: 5400000,
                    paymentDate: '2024-05-01T09:00:00Z',
                    dueDate: '2024-05-01T00:00:00Z',
                    period: '2024-05',
                    status: 'paid',
                    paymentMethod: 'transfer',
                    receiptUrl: '/receipts/pay-011.pdf',
                    verifiedAt: '2024-05-01T10:00:00Z',
                    createdAt: '2024-05-01T09:00:00Z',
                },
                {
                    id: 'pay-012',
                    projectId: 'proj-001',
                    userId: 'user-004',
                    unitId: 5,
                    amount: 5400000,
                    dueDate: '2024-06-01T00:00:00Z',
                    period: '2024-06',
                    status: 'pending',
                    createdAt: '2024-05-15T00:00:00Z',
                },
            ],
        },
    ],
};

// proj-002: Active dengan progress
const bekasiProject = mockProperties[1];
// Members: user-002 (Budi), user-005 (Eka), user-006 (Fajar)
const bekasiMembers = [mockUsers[1], mockUsers[4], mockUsers[5]];

const proj002: Project = {
    id: 'proj-002',
    propertyId: bekasiProject.id!,
    propertyName: bekasiProject.name,
    propertyImageUrl: bekasiProject.images[0].url,
    propertyImageHint: bekasiProject.images[0].hint,
    members: bekasiMembers,
    unitAssignments: [
        { userId: 'user-002', unitId: 1, price: 500000000, size: undefined },
        { userId: 'user-005', unitId: 2, price: 500000000, size: undefined },
        { userId: 'user-006', unitId: 3, price: 500000000, size: undefined },
    ],
    progress: {
        kyc: 100,
        funding: 75,
        legal: 50,
        closing: 0,
    },
    progressDetails: {
        kyc: {
            title: 'Verifikasi KYC',
            percentage: 100,
            description: 'Proses verifikasi identitas dan dokumen KYC untuk semua anggota grup.',
            checklist: [
                { id: 'kyc-1', label: 'Formulir KYC diisi oleh semua anggota', completed: true, completedBy: 'user-002', completedAt: '2024-03-10T10:00:00Z' },
                { id: 'kyc-2', label: 'Upload KTP/SIM semua anggota', completed: true, completedBy: 'user-002', completedAt: '2024-03-10T11:30:00Z' },
                { id: 'kyc-3', label: 'Upload NPWP semua anggota', completed: true, completedBy: 'user-005', completedAt: '2024-03-11T09:15:00Z' },
                { id: 'kyc-4', label: 'Verifikasi dokumen oleh tim legal', completed: true, completedBy: 'user-002', completedAt: '2024-03-12T14:00:00Z' },
            ],
            completedMembers: ['user-002', 'user-005', 'user-006'],
            milestones: [
                { label: 'Mulai Verifikasi', date: '2024-03-10T08:00:00Z', status: 'completed' },
                { label: 'Dokumen Lengkap', date: '2024-03-11T12:00:00Z', status: 'completed' },
                { label: 'Verifikasi Selesai', date: '2024-03-12T14:00:00Z', status: 'completed' },
            ],
            notes: 'Semua dokumen KYC telah diverifikasi dan disetujui.',
        },
        funding: {
            title: 'Pendanaan Grup',
            percentage: 75,
            description: 'Pengumpulan dana dari semua anggota untuk pembelian properti.',
            checklist: [
                { id: 'fund-1', label: 'Pembayaran DP dari user-002 (Rp 150.000.000)', completed: true, completedBy: 'user-002', completedAt: '2024-03-15T14:00:00Z' },
                { id: 'fund-2', label: 'Pembayaran DP dari user-005 (Rp 150.000.000)', completed: true, completedBy: 'user-005', completedAt: '2024-03-16T10:00:00Z' },
                { id: 'fund-3', label: 'Pembayaran DP dari user-006 (Rp 150.000.000)', completed: true, completedBy: 'user-006', completedAt: '2024-03-17T11:00:00Z' },
                { id: 'fund-4', label: 'Pembayaran tahap 2 dari user-002 (Rp 100.000.000)', completed: false },
            ],
            completedMembers: ['user-002', 'user-005', 'user-006'],
            milestones: [
                { label: 'Target DP 30%', date: '2024-03-20T23:59:59Z', status: 'completed' },
                { label: 'Target DP 60%', date: '2024-03-25T23:59:59Z', status: 'pending' },
                { label: 'Pembayaran Lunas', date: '2024-04-10T23:59:59Z', status: 'upcoming' },
            ],
            notes: 'Total terkumpul: Rp 450.000.000 dari target Rp 600.000.000 (75%). Menunggu pembayaran tahap 2.',
        },
        legal: {
            title: 'Legal & Dokumentasi',
            percentage: 50,
            description: 'Proses legal dan penyelesaian dokumen kepemilikan.',
            checklist: [
                { id: 'legal-1', label: 'Perjanjian Kepemilikan Bersama ditandatangani', completed: false },
                { id: 'legal-2', label: 'Sertifikat Hak Milik diverifikasi', completed: true, completedBy: 'user-002', completedAt: '2024-03-18T09:00:00Z' },
                { id: 'legal-3', label: 'Akta Jual Beli disiapkan', completed: true, completedBy: 'user-002', completedAt: '2024-03-20T14:00:00Z' },
                { id: 'legal-4', label: 'Pembagian unit ditetapkan secara legal', completed: false },
            ],
            completedMembers: ['user-002'],
            milestones: [
                { label: 'Verifikasi Sertifikat', date: '2024-03-18T09:00:00Z', status: 'completed' },
                { label: 'Penandatanganan Perjanjian', date: '2024-03-25T14:00:00Z', status: 'pending' },
                { label: 'Akta Jual Beli Selesai', date: '2024-04-05T17:00:00Z', status: 'upcoming' },
            ],
            notes: 'Sertifikat sudah diverifikasi dan akta jual beli sedang disiapkan. Menunggu semua anggota menandatangani perjanjian.',
        },
        closing: {
            title: 'Penutupan',
            percentage: 0,
            description: 'Proses akhir penutupan transaksi dan serah terima properti.',
            checklist: [
                { id: 'close-1', label: 'Semua pembayaran lunas', completed: false },
                { id: 'close-2', label: 'Dokumen legal lengkap', completed: false },
                { id: 'close-3', label: 'Sertifikat dibagi sesuai unit', completed: false },
                { id: 'close-4', label: 'Serah terima properti', completed: false },
            ],
            completedMembers: [],
            milestones: [
                { label: 'Pembayaran Lunas', date: '2024-04-10T23:59:59Z', status: 'upcoming' },
                { label: 'Penutupan Transaksi', date: '2024-04-15T14:00:00Z', status: 'upcoming' },
                { label: 'Serah Terima', date: '2024-04-20T10:00:00Z', status: 'upcoming' },
            ],
            notes: 'Proses penutupan akan dimulai setelah semua tahap sebelumnya selesai.',
        },
    },
    documents: [
        {
            id: 'doc-04',
            name: 'Perjanjian Kepemilikan Bersama',
            status: 'Menunggu',
            description: 'Dokumen perjanjian yang mengatur hak dan kewajiban semua anggota dalam kepemilikan bersama properti ini.',
            uploadDate: '2024-03-22T10:00:00Z',
            size: 245760,
            uploadedBy: 'user-002',
            signedBy: [],
        },
        {
            id: 'doc-05',
            name: 'Sertifikat Hak Milik Properti',
            status: 'Terverifikasi',
            description: 'Sertifikat SHM asli dari properti yang akan dibeli. Sudah diverifikasi oleh tim legal.',
            uploadDate: '2024-03-15T09:00:00Z',
            size: 512000,
            uploadedBy: 'user-002',
            verifiedAt: '2024-03-18T09:00:00Z',
        },
        {
            id: 'doc-06',
            name: 'Formulir KYC (Semua anggota)',
            status: 'Terverifikasi',
            description: 'Formulir Know Your Customer yang harus diisi oleh semua anggota grup.',
            uploadDate: '2024-03-10T08:00:00Z',
            size: 153600,
            uploadedBy: 'user-002',
            signedBy: ['user-002', 'user-005', 'user-006'],
            verifiedAt: '2024-03-12T14:00:00Z',
        },
    ],
    messages: [
        { userId: 'user-005', message: 'Proyek ini menarik sekali!', timestamp: '14:20' },
        { userId: 'user-002', message: 'Setuju, lokasinya strategis.', timestamp: '14:25' },
    ],
    status: 'active',
    // Tidak ada installmentPlans karena belum closing
};

// proj-003: Active baru mulai
const jakartaProject = mockProperties[2];
const jakartaMembers = [mockUsers[0], mockUsers[3], mockUsers[4]];

const proj003: Project = {
    id: 'proj-003',
    propertyId: jakartaProject.id!,
    propertyName: jakartaProject.name,
    propertyImageUrl: jakartaProject.images[0].url,
    propertyImageHint: jakartaProject.images[0].hint,
    members: jakartaMembers,
    unitAssignments: [
        { userId: 'user-001', unitId: 1, price: 400000000 },
        { userId: 'user-004', unitId: 2, price: 400000000 },
    ],
    progress: {
        kyc: 25,
        funding: 0,
        legal: 0,
        closing: 0,
    },
    progressDetails: {
        kyc: {
            title: 'Verifikasi KYC',
            percentage: 25,
            description: 'Proses verifikasi identitas dan dokumen KYC untuk semua anggota grup.',
            checklist: [
                { id: 'kyc-1', label: 'Formulir KYC diisi oleh semua anggota', completed: true, completedBy: 'user-001', completedAt: '2024-04-01T10:00:00Z' },
                { id: 'kyc-2', label: 'Upload KTP/SIM semua anggota', completed: false },
                { id: 'kyc-3', label: 'Upload NPWP semua anggota', completed: false },
                { id: 'kyc-4', label: 'Verifikasi dokumen oleh tim legal', completed: false },
            ],
            completedMembers: ['user-001'],
            milestones: [
                { label: 'Mulai Verifikasi', date: '2024-04-01T08:00:00Z', status: 'completed' },
                { label: 'Dokumen Lengkap', date: '2024-04-05T12:00:00Z', status: 'pending' },
                { label: 'Verifikasi Selesai', date: '2024-04-10T17:00:00Z', status: 'upcoming' },
            ],
            notes: 'Formulir KYC sudah diisi oleh user-001. Menunggu anggota lain mengisi dan upload dokumen.',
        },
        funding: {
            title: 'Pendanaan Grup',
            percentage: 0,
            description: 'Pengumpulan dana dari semua anggota untuk pembelian properti.',
            checklist: [
                { id: 'fund-1', label: 'Pembayaran DP dari user-001', completed: false },
                { id: 'fund-2', label: 'Pembayaran DP dari user-004', completed: false },
            ],
            completedMembers: [],
            milestones: [
                { label: 'Target DP 30%', date: '2024-04-15T23:59:59Z', status: 'upcoming' },
                { label: 'Target DP 60%', date: '2024-04-25T23:59:59Z', status: 'upcoming' },
                { label: 'Pembayaran Lunas', date: '2024-05-10T23:59:59Z', status: 'upcoming' },
            ],
            notes: 'Pendanaan akan dimulai setelah verifikasi KYC selesai.',
        },
        legal: {
            title: 'Legal & Dokumentasi',
            percentage: 0,
            description: 'Proses legal dan penyelesaian dokumen kepemilikan.',
            checklist: [
                { id: 'legal-1', label: 'Perjanjian Kepemilikan Bersama ditandatangani', completed: false },
                { id: 'legal-2', label: 'Sertifikat Hak Milik diverifikasi', completed: false },
                { id: 'legal-3', label: 'Akta Jual Beli disiapkan', completed: false },
                { id: 'legal-4', label: 'Pembagian unit ditetapkan secara legal', completed: false },
            ],
            completedMembers: [],
            milestones: [
                { label: 'Verifikasi Sertifikat', date: '2024-04-20T09:00:00Z', status: 'upcoming' },
                { label: 'Penandatanganan Perjanjian', date: '2024-04-25T14:00:00Z', status: 'upcoming' },
                { label: 'Akta Jual Beli Selesai', date: '2024-05-05T17:00:00Z', status: 'upcoming' },
            ],
            notes: 'Proses legal akan dimulai setelah pendanaan mencapai target minimum.',
        },
        closing: {
            title: 'Penutupan',
            percentage: 0,
            description: 'Proses akhir penutupan transaksi dan serah terima properti.',
            checklist: [
                { id: 'close-1', label: 'Semua pembayaran lunas', completed: false },
                { id: 'close-2', label: 'Dokumen legal lengkap', completed: false },
                { id: 'close-3', label: 'Sertifikat dibagi sesuai unit', completed: false },
                { id: 'close-4', label: 'Serah terima properti', completed: false },
            ],
            completedMembers: [],
            milestones: [
                { label: 'Pembayaran Lunas', date: '2024-05-10T23:59:59Z', status: 'upcoming' },
                { label: 'Penutupan Transaksi', date: '2024-05-15T14:00:00Z', status: 'upcoming' },
                { label: 'Serah Terima', date: '2024-05-20T10:00:00Z', status: 'upcoming' },
            ],
            notes: 'Proses penutupan akan dimulai setelah semua tahap sebelumnya selesai.',
        },
    },
    documents: [
        {
            id: 'doc-07',
            name: 'Formulir KYC (Semua anggota)',
            status: 'Menunggu',
            description: 'Formulir Know Your Customer yang harus diisi oleh semua anggota grup.',
            uploadDate: '2024-04-01T08:00:00Z',
            size: 153600,
            uploadedBy: 'user-001',
            signedBy: ['user-001'],
        },
    ],
    messages: [
        { userId: 'user-001', message: 'Selamat datang di proyek baru!', timestamp: '09:00' },
        { userId: 'user-004', message: 'Terima kasih! Mari kita mulai.', timestamp: '09:15' },
    ],
    status: 'active',
    // Tidak ada installmentPlans karena belum closing
};

// proj-004: Completed - benar-benar selesai (semua cicilan sudah lunas)
const tangerangProject = mockProperties[3];
const tangerangMembers = [mockUsers[1], mockUsers[2], mockUsers[3]];

const proj004: Project = {
    id: 'proj-004',
    propertyId: tangerangProject.id!,
    propertyName: tangerangProject.name,
    propertyImageUrl: tangerangProject.images[0].url,
    propertyImageHint: tangerangProject.images[0].hint,
    members: tangerangMembers,
    unitAssignments: [
        { userId: 'user-002', unitId: 1, price: 700000000, size: 350 },
        { userId: 'user-003', unitId: 2, price: 650000000, size: 325 },
        { userId: 'user-004', unitId: 3, price: 650000000, size: 325 },
    ],
    progress: {
        kyc: 100,
        funding: 100,
        legal: 100,
        closing: 100,
    },
    progressDetails: {
        kyc: {
            title: 'Verifikasi KYC',
            percentage: 100,
            description: 'Proses verifikasi identitas dan dokumen KYC untuk semua anggota grup.',
            checklist: [
                { id: 'kyc-1', label: 'Formulir KYC diisi oleh semua anggota', completed: true, completedBy: 'user-002', completedAt: '2023-06-15T10:00:00Z' },
                { id: 'kyc-2', label: 'Upload KTP/SIM semua anggota', completed: true, completedBy: 'user-003', completedAt: '2023-06-15T11:30:00Z' },
                { id: 'kyc-3', label: 'Upload NPWP semua anggota', completed: true, completedBy: 'user-004', completedAt: '2023-06-16T09:15:00Z' },
                { id: 'kyc-4', label: 'Verifikasi dokumen oleh tim legal', completed: true, completedBy: 'user-002', completedAt: '2023-06-20T17:00:00Z' },
            ],
            completedMembers: ['user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Mulai Verifikasi', date: '2023-06-15T08:00:00Z', status: 'completed' },
                { label: 'Dokumen Lengkap', date: '2023-06-16T12:00:00Z', status: 'completed' },
                { label: 'Verifikasi Selesai', date: '2023-06-20T17:00:00Z', status: 'completed' },
            ],
            notes: 'Semua dokumen KYC telah diverifikasi dan disetujui.',
        },
        funding: {
            title: 'Pendanaan Grup',
            percentage: 100,
            description: 'Pengumpulan dana dari semua anggota untuk pembelian properti.',
            checklist: [
                { id: 'fund-1', label: 'Pembayaran DP dari user-002 (Rp 210.000.000)', completed: true, completedBy: 'user-002', completedAt: '2023-06-18T14:00:00Z' },
                { id: 'fund-2', label: 'Pembayaran DP dari user-003 (Rp 195.000.000)', completed: true, completedBy: 'user-003', completedAt: '2023-06-18T15:30:00Z' },
                { id: 'fund-3', label: 'Pembayaran DP dari user-004 (Rp 195.000.000)', completed: true, completedBy: 'user-004', completedAt: '2023-06-20T10:00:00Z' },
                { id: 'fund-4', label: 'Pembayaran pelunasan dari semua anggota', completed: true, completedBy: 'user-002', completedAt: '2023-07-05T16:00:00Z' },
            ],
            completedMembers: ['user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Target DP 30%', date: '2023-06-20T23:59:59Z', status: 'completed' },
                { label: 'Target DP 60%', date: '2023-06-25T23:59:59Z', status: 'completed' },
                { label: 'Pembayaran Lunas', date: '2023-07-05T23:59:59Z', status: 'completed' },
            ],
            notes: 'Semua pembayaran telah lunas tepat waktu.',
        },
        legal: {
            title: 'Legal & Dokumentasi',
            percentage: 100,
            description: 'Proses legal dan penyelesaian dokumen kepemilikan.',
            checklist: [
                { id: 'legal-1', label: 'Perjanjian Kepemilikan Bersama ditandatangani', completed: true, completedBy: 'user-002', completedAt: '2023-07-10T10:00:00Z' },
                { id: 'legal-2', label: 'Sertifikat Hak Milik diverifikasi', completed: true, completedBy: 'user-003', completedAt: '2023-07-10T11:00:00Z' },
                { id: 'legal-3', label: 'Akta Jual Beli disiapkan', completed: true, completedBy: 'user-004', completedAt: '2023-07-12T14:00:00Z' },
                { id: 'legal-4', label: 'Pembagian unit ditetapkan secara legal', completed: true, completedBy: 'user-002', completedAt: '2023-07-15T17:00:00Z' },
            ],
            completedMembers: ['user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Verifikasi Sertifikat', date: '2023-07-10T09:00:00Z', status: 'completed' },
                { label: 'Penandatanganan Perjanjian', date: '2023-07-10T14:00:00Z', status: 'completed' },
                { label: 'Akta Jual Beli Selesai', date: '2023-07-15T17:00:00Z', status: 'completed' },
            ],
            notes: 'Semua dokumen legal telah selesai dan terverifikasi.',
        },
        closing: {
            title: 'Penutupan',
            percentage: 100,
            description: 'Proses akhir penutupan transaksi dan serah terima properti.',
            checklist: [
                { id: 'close-1', label: 'Semua pembayaran lunas', completed: true, completedBy: 'user-002', completedAt: '2023-07-05T16:00:00Z' },
                { id: 'close-2', label: 'Dokumen legal lengkap', completed: true, completedBy: 'user-003', completedAt: '2023-07-15T17:00:00Z' },
                { id: 'close-3', label: 'Sertifikat dibagi sesuai unit', completed: true, completedBy: 'user-004', completedAt: '2023-07-20T10:00:00Z' },
                { id: 'close-4', label: 'Serah terima properti', completed: true, completedBy: 'user-002', completedAt: '2023-07-25T14:00:00Z' },
            ],
            completedMembers: ['user-002', 'user-003', 'user-004'],
            milestones: [
                { label: 'Pembayaran Lunas', date: '2023-07-05T23:59:59Z', status: 'completed' },
                { label: 'Penutupan Transaksi', date: '2023-07-20T14:00:00Z', status: 'completed' },
                { label: 'Serah Terima', date: '2023-07-25T10:00:00Z', status: 'completed' },
            ],
            notes: 'Proyek telah selesai sepenuhnya. Semua unit telah diserahterimakan.',
        },
    },
    documents: [
        {
            id: 'doc-08',
            name: 'Perjanjian Kepemilikan Bersama',
            status: 'Terverifikasi',
            description: 'Perjanjian kepemilikan bersama untuk proyek tanah kavling di Tangerang.',
            uploadDate: '2023-07-10T10:00:00Z',
            size: 245760,
            uploadedBy: 'user-002',
            signedBy: ['user-002', 'user-003', 'user-004'],
            verifiedAt: '2023-07-12T10:00:00Z',
        },
        {
            id: 'doc-09',
            name: 'Sertifikat Hak Milik Properti',
            status: 'Terverifikasi',
            description: 'Sertifikat hak milik properti yang telah dibagi sesuai unit.',
            uploadDate: '2023-07-20T10:00:00Z',
            size: 512000,
            uploadedBy: 'user-003',
            signedBy: ['user-002', 'user-003', 'user-004'],
            verifiedAt: '2023-07-22T14:00:00Z',
        },
        {
            id: 'doc-10',
            name: 'Akta Jual Beli',
            status: 'Terverifikasi',
            description: 'Akta jual beli yang telah ditandatangani oleh semua pihak.',
            uploadDate: '2023-07-15T14:00:00Z',
            size: 307200,
            uploadedBy: 'user-004',
            signedBy: ['user-002', 'user-003', 'user-004'],
            verifiedAt: '2023-07-16T09:00:00Z',
        },
    ],
    messages: [
        { userId: 'user-002', message: 'Proyek sudah selesai! Terima kasih semua.', timestamp: '14:00' },
        { userId: 'user-003', message: 'Sangat senang bisa menyelesaikan proyek ini bersama.', timestamp: '14:15' },
        { userId: 'user-004', message: 'Semua berjalan lancar. Terima kasih!', timestamp: '14:30' },
    ],
    status: 'completed',
    // InstallmentPlans dengan status completed (semua pembayaran sudah lunas)
    installmentPlans: [
        {
            id: 'install-004',
            projectId: 'proj-004',
            userId: 'user-002',
            unitId: 1,
            totalAmount: 700000000,
            downPayment: 210000000, // 30% DP
            installmentAmount: 7000000, // 7 juta per bulan
            totalInstallments: 70, // 70 bulan
            startDate: '2023-08-01T00:00:00Z',
            endDate: '2029-05-01T00:00:00Z',
            status: 'completed', // Semua sudah lunas
            payments: [
                // Generate all 70 payments as paid
                ...Array.from({ length: 70 }, (_, i) => {
                    const paymentDate = new Date('2023-08-01T00:00:00Z');
                    paymentDate.setMonth(paymentDate.getMonth() + i);
                    const dueDate = new Date(paymentDate);
                    const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                    return {
                        id: `pay-004-${i + 1}`,
                        projectId: 'proj-004',
                        userId: 'user-002',
                        unitId: 1,
                        amount: 7000000,
                        paymentDate: paymentDate.toISOString(),
                        dueDate: dueDate.toISOString(),
                        period,
                        status: 'paid' as const,
                        paymentMethod: 'transfer',
                        receiptUrl: `/receipts/pay-004-${i + 1}.pdf`,
                        verifiedAt: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                        createdAt: paymentDate.toISOString(),
                    };
                }),
            ],
        },
        {
            id: 'install-005',
            projectId: 'proj-004',
            userId: 'user-003',
            unitId: 2,
            totalAmount: 650000000,
            downPayment: 195000000, // 30% DP
            installmentAmount: 6500000, // 6.5 juta per bulan
            totalInstallments: 70, // 70 bulan
            startDate: '2023-08-01T00:00:00Z',
            endDate: '2029-05-01T00:00:00Z',
            status: 'completed', // Semua sudah lunas
            payments: [
                ...Array.from({ length: 70 }, (_, i) => {
                    const paymentDate = new Date('2023-08-01T00:00:00Z');
                    paymentDate.setMonth(paymentDate.getMonth() + i);
                    const dueDate = new Date(paymentDate);
                    const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                    return {
                        id: `pay-005-${i + 1}`,
                        projectId: 'proj-004',
                        userId: 'user-003',
                        unitId: 2,
                        amount: 6500000,
                        paymentDate: paymentDate.toISOString(),
                        dueDate: dueDate.toISOString(),
                        period,
                        status: 'paid' as const,
                        paymentMethod: 'transfer',
                        receiptUrl: `/receipts/pay-005-${i + 1}.pdf`,
                        verifiedAt: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                        createdAt: paymentDate.toISOString(),
                    };
                }),
            ],
        },
        {
            id: 'install-006',
            projectId: 'proj-004',
            userId: 'user-004',
            unitId: 3,
            totalAmount: 650000000,
            downPayment: 195000000, // 30% DP
            installmentAmount: 6500000, // 6.5 juta per bulan
            totalInstallments: 70, // 70 bulan
            startDate: '2023-08-01T00:00:00Z',
            endDate: '2029-05-01T00:00:00Z',
            status: 'completed', // Semua sudah lunas
            payments: [
                ...Array.from({ length: 70 }, (_, i) => {
                    const paymentDate = new Date('2023-08-01T00:00:00Z');
                    paymentDate.setMonth(paymentDate.getMonth() + i);
                    const dueDate = new Date(paymentDate);
                    const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                    return {
                        id: `pay-006-${i + 1}`,
                        projectId: 'proj-004',
                        userId: 'user-004',
                        unitId: 3,
                        amount: 6500000,
                        paymentDate: paymentDate.toISOString(),
                        dueDate: dueDate.toISOString(),
                        period,
                        status: 'paid' as const,
                        paymentMethod: 'transfer',
                        receiptUrl: `/receipts/pay-006-${i + 1}.pdf`,
                        verifiedAt: new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                        createdAt: paymentDate.toISOString(),
                    };
                }),
            ],
        },
    ],
};

// Export array of projects
export const mockProjects: Project[] = [
    mockProject, // proj-001 (closed - proses pembayaran)
    proj002,     // proj-002 (active progress)
    proj003,     // proj-003 (active baru mulai)
    proj004,     // proj-004 (completed - benar-benar selesai)
];

    