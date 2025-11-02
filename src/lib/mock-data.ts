import type { Property, User, Project } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const img = PlaceHolderImages.find(p => p.id === id);
  return {
    url: img?.imageUrl ?? 'https://picsum.photos/seed/error/200/200',
    hint: img?.imageHint ?? 'image'
  };
};

export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: 'Kavling Tanah di Sidoarjo',
    description: 'Sebidang tanah luas di Sidoarjo, ideal untuk dibagi menjadi beberapa kavling perumahan. Beli tanahnya bersama, bangun rumah impian Anda sendiri.',
    price: 1800000000,
    location: 'Sidoarjo, Surabaya',
    images: [
      { url: getImage('property-3').url, hint: getImage('property-3').hint },
      { url: getImage('land-2').url, hint: getImage('land-2').hint },
      { url: getImage('land-3').url, hint: getImage('land-3').hint },
      { url: getImage('site-plan-1').url, hint: getImage('site-plan-1').hint },
    ],
    type: 'co-owning',
    totalUnits: 9,
    unitName: 'Kavling',
    unitSize: 110,
    unitMeasure: 'm²',
    planningInfo: {
      sitePlanUrl: getImage('site-plan-1').url,
      sitePlanHint: getImage('site-plan-1').hint,
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
      { url: getImage('property-2').url, hint: getImage('property-2').hint },
      { url: getImage('building-concept-1').url, hint: getImage('building-concept-1').hint },
      { url: getImage('floor-plan-1').url, hint: getImage('floor-plan-1').hint },
      { url: getImage('location-map-1').url, hint: getImage('location-map-1').hint },
    ],
    type: 'co-building',
    totalUnits: 5,
    unitName: 'Lantai',
    planningInfo: {
      sitePlanUrl: getImage('floor-plan-1').url,
      sitePlanHint: getImage('floor-plan-1').hint,
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
      { url: getImage('property-5').url, hint: getImage('property-5').hint },
      { url: getImage('building-concept-2').url, hint: getImage('building-concept-2').hint },
      { url: getImage('floor-plan-2').url, hint: getImage('floor-plan-2').hint },
    ],
    type: 'co-building',
    totalUnits: 8,
    unitName: 'Lantai',
  },
  {
    id: 'prop-004',
    name: 'Tanah Kavling Fleksibel di Tangerang',
    description: 'Kawasan tanah prospektif di Tangerang untuk dimiliki bersama. Jumlah dan luas kavling akan ditentukan bersama berdasarkan jumlah investor final.',
    price: 2000000000,
    totalArea: 1000,
    location: 'Tangerang, Banten',
    images: [
      { url: getImage('property-6').url, hint: getImage('property-6').hint },
      { url: getImage('land-1').url, hint: getImage('land-1').hint },
      { url: getImage('site-plan-2').url, hint: getImage('site-plan-2').hint },
    ],
    type: 'co-owning',
    unitName: 'Kepemilikan',
    unitMeasure: 'm²',
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
        kyc: 75,
        funding: 50,
        legal: 25,
        closing: 0,
    },
    documents: [
        { id: 'doc-01', name: 'Perjanjian Kepemilikan Bersama', status: 'Menunggu' },
        { id: 'doc-02', name: 'Sertifikat Hak Milik Properti', status: 'Terverifikasi' },
        { id: 'doc-03', name: 'Formulir KYC (Semua anggota)', status: 'Menunggu' },
    ],
    messages: [
        { userId: 'user-002', message: 'Hai semuanya! Senang menjadi bagian dari proyek ini.', timestamp: '10:30' },
        { userId: 'user-001', message: 'Saya juga! Lokasinya kelihatan bagus.', timestamp: '10:31' },
        { userId: 'user-003', message: 'Saya sudah meninjau perjanjiannya. Terlihat bagus bagi saya.', timestamp: '11:15' },
    ]
};

    