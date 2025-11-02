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
    name: 'Cluster House in Sidoarjo',
    description: 'A beautiful cluster house perfect for young families, located in a developing area of Sidoarjo.',
    price: 500000000,
    location: 'Sidoarjo, Surabaya',
    imageUrl: getImage('property-4').url,
    imageHint: getImage('property-4').hint,
  },
  {
    id: 'prop-002',
    name: 'Land in Bekasi',
    description: 'Spacious land plot with clear certification, suitable for residential development on the outskirts of the city.',
    price: 1500000000,
    location: 'Bekasi, Jawa Barat',
    imageUrl: getImage('property-3').url,
    imageHint: getImage('property-3').hint,
  },
  {
    id: 'prop-003',
    name: 'Modern Apartment in Central Jakarta',
    description: 'A sleek and modern apartment in a high-rise building, offering stunning city views and full amenities.',
    price: 2000000000,
    location: 'Central Jakarta, DKI Jakarta',
    imageUrl: getImage('property-2').url,
    imageHint: getImage('property-2').hint,
  },
  {
    id: 'prop-004',
    name: 'Suburban House in Tangerang',
    description: 'Comfortable family home with a spacious garden, located in a quiet and friendly suburban neighborhood.',
    price: 1200000000,
    location: 'Tangerang, Banten',
    imageUrl: getImage('property-1').url,
    imageHint: getImage('property-1').hint,
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
      priceRange: '300-600 million IDR',
      investmentGoals: 'First home ownership',
      financialCapacity: '500 million IDR',
      timeHorizon: 'Long-term (10+ years)',
    },
  },
  {
    id: 'user-002',
    name: 'Budi',
    avatarUrl: getImage('user-2').url,
    avatarHint: getImage('user-2').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '250-400 million IDR',
      investmentGoals: 'Rental income',
      financialCapacity: '300 million IDR',
      timeHorizon: 'Medium-term (5-10 years)',
    },
  },
  {
    id: 'user-003',
    name: 'Citra',
    avatarUrl: getImage('user-3').url,
    avatarHint: getImage('user-3').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '250-450 million IDR',
      investmentGoals: 'Capital appreciation',
      financialCapacity: '350 million IDR',
      timeHorizon: 'Medium-term (5-10 years)',
    },
  },
  {
    id: 'user-004',
    name: 'Dewi',
    avatarUrl: getImage('user-4').url,
    avatarHint: getImage('user-4').hint,
    profile: {
      locationPreference: 'Yogyakarta',
      priceRange: '400-800 million IDR',
      investmentGoals: 'Business use (shophouse)',
      financialCapacity: '700 million IDR',
      timeHorizon: 'Long-term (10+ years)',
    },
  },
  {
    id: 'user-005',
    name: 'Eka',
    avatarUrl: getImage('user-5').url,
    avatarHint: getImage('user-5').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '200-400 million IDR',
      investmentGoals: 'Long-term investment',
      financialCapacity: '300 million IDR',
      timeHorizon: 'Long-term (10+ years)',
    },
  },
  {
    id: 'user-006',
    name: 'Fajar',
    avatarUrl: getImage('user-6').url,
    avatarHint: getImage('user-6').hint,
    profile: {
      locationPreference: 'Bandung',
      priceRange: '300-500 million IDR',
      investmentGoals: 'Future personal use',
      financialCapacity: '400 million IDR',
      timeHorizon: 'Medium-term (5-10 years)',
    },
  },
];

export const mockProject: Project = {
    id: 'proj-001',
    propertyName: 'Cluster House Co-Buy in Sidoarjo',
    propertyImageUrl: getImage('property-4').url,
    propertyImageHint: getImage('property-4').hint,
    members: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    progress: {
        kyc: 75,
        funding: 50,
        legal: 25,
        closing: 0,
    },
    documents: [
        { id: 'doc-01', name: 'Co-Ownership Agreement', status: 'Pending' },
        { id: 'doc-02', name: 'Property Title (Sertifikat Hak Milik)', status: 'Verified' },
        { id: 'doc-03', name: 'KYC Forms (All members)', status: 'Pending' },
    ],
    messages: [
        { userId: 'user-002', message: 'Hi everyone! Glad to be part of this project.', timestamp: '10:30 AM' },
        { userId: 'user-001', message: 'Me too! The location looks great.', timestamp: '10:31 AM' },
        { userId: 'user-003', message: 'I have reviewed the agreement. Looks good to me.', timestamp: '11:15 AM' },
    ]
};
