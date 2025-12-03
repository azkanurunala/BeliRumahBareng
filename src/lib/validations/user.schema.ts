import { z } from 'zod';

// User Profile Schema
export const userProfileSchema = z.object({
  locationPreference: z.string().min(1, 'Lokasi preferensi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan investasi wajib diisi'),
  financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
  timeHorizon: z.string().min(1, 'Time horizon wajib diisi'),
});

// User Create Schema
export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255, 'Nama terlalu panjang'),
  email: z.string().email('Email tidak valid'),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 karakter').max(20, 'Nomor telepon terlalu panjang'),
  avatarUrl: z.string().url('URL avatar tidak valid').or(z.literal('')),
  avatarHint: z.string().min(1, 'Avatar hint wajib diisi'),
  role: z.number().int().min(1).max(2).default(1), // 1 = user biasa, 2 = admin
  locationPreference: z.string().min(1, 'Lokasi preferensi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan investasi wajib diisi'),
  financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
  timeHorizon: z.string().min(1, 'Time horizon wajib diisi'),
  passwordHash: z.string().optional(),
  oauthProvider: z.enum(['google', 'facebook']).nullable().optional(),
  oauthId: z.string().optional(),
});

// User Update Schema
export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid('ID tidak valid'),
});

// User Login Schema
export const loginUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// User OAuth Schema
export const oauthUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi'),
  oauthProvider: z.enum(['google', 'facebook']),
  oauthId: z.string().min(1, 'OAuth ID wajib diisi'),
  avatarUrl: z.string().url('URL avatar tidak valid').optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type OAuthUserInput = z.infer<typeof oauthUserSchema>;

