export type Property = {
  id: string;
  name: string;
  description: string;
  price: number;
  totalArea?: number;
  buildingArea?: number;
  location: string;
  images: { url: string; hint: string }[];
  type: 'co-building' | 'co-owning';
  totalUnits?: number;
  unitName: 'Lantai' | 'Kavling' | 'Kepemilikan';
  unitSize?: number; // e.g. 110
  unitMeasure?: string; // e.g. m²
  unitPrices?: Array<{ size: number; price: number }>; // Individual plot/unit prices and sizes
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
  name: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  avatarHint: string;
  profile: UserProfile;
  role: number;
  // Auth fields
  passwordHash?: string; // untuk email/password
  oauthProvider?: 'google' | null; // untuk OAuth
  oauthId?: string; // untuk OAuth
};

export type UnitAssignment = {
  unitId: number;
  userId: string;
  price: number;
  size?: number;
  isLocked?: boolean;
  lockedAt?: string; // ISO date string
  lockedBy?: string; // transaction_id
};

export type ProgressChecklistItem = {
  id: string;
  label: string;
  completedMembers: string[]; // Array of userIds who completed this item
  order?: number;
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
  period: string; // format: "YYYY-MM" (e.g., "2025-02")
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: string; // 'transfer', 'cash', 'other'
  receiptUrl?: string; // URL bukti pembayaran
  paymentReference?: string; // nomor referensi pembayaran (untuk transfer)
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
  paymentType?: 'cash' | 'kpr'; // untuk membedakan flow
  bookingFeePaid?: boolean;
  bookingFeeAmount?: number;
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
  purchaseTransactions?: PurchaseTransaction[]; // purchase state machine transactions
};

// Entity baru untuk pernyataan minat (tahap sebelum jadi member project)
export type PropertyInterest = {
  id: string;
  propertyId: string;
  userId: string;
  unitId?: number; // untuk co-building/co-owning non-flexible
  unitSize?: number; // untuk flexible
  isFirstHome: boolean;
  willOccupy: boolean;
  email?: string; // email peminat (bisa dari user atau input manual)
  phoneNumber?: string; // nomor telepon/WhatsApp peminat (bisa dari user atau input manual)
  createdAt: string; // ISO date string
  status?: 'pending' | 'approved' | 'rejected'; // untuk admin approval
  notes?: string; // admin notes untuk approval/rejection
  reviewedAt?: string; // ISO date string - kapan direview
};

// Entity untuk watchlist (bookmark properti)
export type Watchlist = {
  id: string;
  propertyId: string;
  userId: string;
  createdAt: string; // ISO date string
};

// Entity untuk form jual properti (user submit properti)
export type PropertySubmission = {
  id: string;
  submittedBy: string; // userId
  type: 'co-building' | 'co-owning';
  name: string;
  description: string;
  location: string;
  totalArea?: number;
  totalUnits?: number;
  unitSize?: number;
  unitMeasure?: string;
  askingPrice: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  images?: { url: string; hint: string }[];
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  reviewedBy?: string; // admin userId
  reviewedAt?: string; // ISO date string
  notes?: string; // admin notes
  createdAt: string; // ISO date string
};

// Purchase Transaction State Machine
export type PurchaseTransactionState = 
  | 'DRAFT' 
  | 'BOOKED' 
  | 'INTERVIEWED' 
  | 'CASH_PROCESS' 
  | 'KPR_PROCESS' 
  | 'UNDER_CONSTRUCTION' 
  | 'HANDOVER' 
  | 'COMPLETED';

export type PurchaseTransaction = {
  id: string;
  projectId: string;
  userId: string;
  unitId: number;
  state: PurchaseTransactionState;
  paymentType?: 'cash' | 'kpr';
  bookingFeeAmount?: number;
  bookingDate?: string; // ISO date string
  paymentProofUrl?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  interviewRecord?: InterviewRecord;
  appointments?: Appointment[];
  kprStatus?: KprStatus;
  constructionCheckpoints?: ConstructionCheckpoint[];
  activityLogs?: ActivityLog[];
};

// Interview Record (KYC Result Only - tidak simpan data sensitif)
export type InterviewResult = 'PASSED' | 'FAILED' | 'NEED_FOLLOW_UP';

export type InterviewRecord = {
  id: string;
  transactionId: string;
  interviewDate: string; // ISO date string
  interviewerId: string; // admin user_id
  result: InterviewResult;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// Appointment (Scheduling Tracker)
export type AppointmentType = 'interview' | 'notaris' | 'bank';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type Appointment = {
  id: string;
  transactionId: string;
  type: AppointmentType;
  scheduledDate: string; // ISO date string
  status: AppointmentStatus;
  location?: string;
  notes?: string;
  completedAt?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// KPR Status Tracking
export type KprStatusType = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export type KprStatus = {
  id: string;
  transactionId: string;
  status: KprStatusType;
  bankName?: string;
  submittedDate?: string; // ISO date string
  approvedDate?: string; // ISO date string
  rejectedDate?: string; // ISO date string
  rejectionReason?: string;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// Construction Checkpoint (Progress Tracking - bukan payment trigger)
export type ConstructionCheckpointProgress = 25 | 50 | 75 | 100;
export type ConstructionCheckpointMilestone = 'foundation' | 'structure' | 'roofing' | 'finishing';
export type ConstructionCheckpointStatus = 'pending' | 'in_progress' | 'completed';

export type ConstructionCheckpoint = {
  id: string;
  transactionId: string;
  progress: ConstructionCheckpointProgress;
  milestone: ConstructionCheckpointMilestone;
  status: ConstructionCheckpointStatus;
  startDate?: string; // ISO date string
  completedDate?: string; // ISO date string
  photos?: string[]; // Array of photo URLs
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
};

// Activity Log (Immutable Audit Trail)
export type ActivityLogAction = 
  | 'state_transition' 
  | 'payment' 
  | 'appointment_scheduled' 
  | 'appointment_completed' 
  | 'appointment_cancelled'
  | 'interview_recorded'
  | 'kpr_status_updated'
  | 'construction_checkpoint_updated'
  | 'unit_locked'
  | 'unit_unlocked';

export type ActorRole = 'admin' | 'sales' | 'customer';

export type ActivityLog = {
  id: string;
  transactionId: string;
  action: ActivityLogAction;
  actorId: string; // user_id yang melakukan action
  actorRole: ActorRole;
  fromState?: PurchaseTransactionState;
  toState?: PurchaseTransactionState;
  details?: string; // JSON string untuk additional details
  createdAt: string; // ISO date string
};

    