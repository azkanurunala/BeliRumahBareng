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
      developmentPlan: "Fase pertama adalah pematangan lahan dan pembuatan jalan utama. Fase kedua adalah pembagian kavling sesuai denah. Pemilik dapat mulai membangun setelah serah terima kavling. Akses jalan dan drainase utama akan disiapkan oleh pengelola proyek.",
      environmentalAnalysis: "Lokasi bebas banjir dengan akses mudah ke jalan tol. Diperkirakan harga tanah akan naik 15% per tahun seiring pengembangan area komersial di dekatnya. Terdapat fasilitas umum seperti sekolah dan rumah sakit dalam radius 3 km.",
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
      developmentPlan: "Konstruksi akan dimulai setelah 70% pendanaan tercapai. Pembangunan diperkirakan memakan waktu 18 bulan. Gedung akan dilengkapi dengan basement parkir, area komersial di lantai dasar, dan 4 lantai hunian. Setiap anggota akan memiliki satu lantai.",
      environmentalAnalysis: "Berada di pusat bisnis Bekasi dengan konektivitas transportasi publik yang baik. Potensi sewa tinggi karena permintaan dari pekerja kantoran di sekitar area tersebut. Fasilitas lengkap di sekitar gedung.",
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
    name: 'Tanah Kavling di Tangerang',
    description: 'Kawasan tanah prospektif di Tangerang untuk dimiliki bersama. Amankan kavling Anda sekarang dan bangun nanti sesuai keinginan.',
    price: 2000000000,
    location: 'Tangerang, Banten',
    images: [
      { url: getImage('property-6').url, hint: getImage('property-6').hint },
      { url: getImage('land-1').url, hint: getImage('land-1').hint },
      { url: getImage('site-plan-2').url, hint: getImage('site-plan-2').hint },
    ],
    type: 'co-owning',
    totalUnits: 10,
    unitName: 'Kavling',
    unitSize: 100,
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
    propertyId: sidoarjoProject.id,
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
