export type Property = {
  id: string;
  name: string;
  description: string;
  price: number;
  location: string;
  imageUrl: string;
  imageHint: string;
  type: 'co-building' | 'co-owning';
  totalUnits: number;
  unitName: 'Lantai' | 'Kavling';
  unitSize?: number; // e.g. 110
  unitMeasure?: string; // e.g. m²
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

export type Project = {
  id: string;
  propertyName: string;
  propertyImageUrl: string;
  propertyImageHint: string;
  members: User[];
  progress: {
    kyc: number;
    funding: number;
    legal: number;
    closing: number;
  };
  documents: {
    id: string;
    name: string;
    status: 'Pending' | 'Signed' | 'Verified';
  }[];
  messages: {
    userId: string;
    message: string;
    timestamp: string;
  }[];
};
