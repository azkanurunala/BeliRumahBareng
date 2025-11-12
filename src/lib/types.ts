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

export type ProgressChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
  completedBy?: string; // userId
  completedAt?: string; // ISO date string
};

export type ProgressDetail = {
  title: string;
  percentage: number;
  description?: string;
  checklist: ProgressChecklistItem[];
  completedMembers: string[]; // userIds
  milestones?: {
    label: string;
    date?: string; // ISO date string
    status: 'completed' | 'pending' | 'upcoming';
  }[];
  notes?: string;
};

export type ProjectDocument = {
  id: string;
  name: string;
  status: 'Menunggu' | 'Tertanda' | 'Terverifikasi';
  url?: string;
  uploadDate?: string; // ISO date string
  size?: number; // in bytes
  description?: string;
  uploadedBy?: string; // userId
  signedBy?: string[]; // userIds
  verifiedAt?: string; // ISO date string
};

export type MonthlyPayment = {
  id: string;
  projectId: string;
  userId: string; // penghuni yang membayar
  unitId: number; // unit yang dibayar
  amount: number; // jumlah pembayaran
  paymentDate: string; // ISO date string - tanggal pembayaran
  dueDate: string; // ISO date string - tanggal jatuh tempo
  period: string; // format: "YYYY-MM" (e.g., "2024-02")
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: string; // 'transfer', 'cash', 'other'
  receiptUrl?: string; // URL bukti pembayaran
  notes?: string;
  verifiedBy?: string; // userId admin yang verifikasi
  verifiedAt?: string; // ISO date string
  createdAt: string; // ISO date string
};

export type InstallmentPlan = {
  id: string;
  projectId: string;
  userId: string;
  unitId: number;
  totalAmount: number; // total harga unit
  downPayment: number; // DP yang sudah dibayar
  installmentAmount: number; // jumlah cicilan per bulan
  totalInstallments: number; // total bulan cicilan
  startDate: string; // ISO date string - mulai cicilan
  endDate: string; // ISO date string - akhir cicilan
  status: 'active' | 'completed' | 'cancelled';
  payments: MonthlyPayment[]; // history pembayaran
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
  progressDetails: {
    kyc: ProgressDetail;
    funding: ProgressDetail;
    legal: ProgressDetail;
    closing: ProgressDetail;
  };
  documents: ProjectDocument[];
  messages: {
    userId: string;
    message: string;
    timestamp: string;
  }[];
  status?: 'active' | 'closed' | 'completed'; // status project
  installmentPlans?: InstallmentPlan[]; // rencana cicilan per unit
};

    