export type Property = {
  id: string;
  name: string;
  description: string;
  price: number;
  totalArea?: number;
  location: string;
  images: { url: string; hint: string }[];
  type: 'co-building' | 'co-owning';
  totalUnits?: number;
  unitName: 'Lantai' | 'Kavling' | 'Kepemilikan';
  unitSize?: number; // e.g. 110
  unitMeasure?: string; // e.g. m²
  planningInfo?: {
    sitePlanUrl: string;
    sitePlanHint: string;
    developmentPlan: string;
    environmentalAnalysis: string;
  };
};

export type UserProfile = {
  locationPreference: string;
  priceRange: string;
  investmentGoals: string;
  financialCapacity: string;
  timeHorizon: string;
};

export type User = {
  id: string;
  name:string;
  avatarUrl: string;
  avatarHint: string;
  profile: UserProfile;
};

export type UnitAssignment = {
  unitId: number;
  userId: string;
  price: number;
  size?: number;
};

export type Project = {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyImageUrl: string;
  propertyImageHint: string;
  members: User[];
  unitAssignments: UnitAssignment[];
  progress: {
    kyc: number;
    funding: number;
    legal: number;
    closing: number;
  };
  documents: {
    id: string;
    name: string;
    status: 'Menunggu' | 'Tertanda' | 'Terverifikasi';
  }[];
  messages: {
    userId: string;
    message: string;
    timestamp: string;
  }[];
};

    