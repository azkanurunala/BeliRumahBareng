import { z } from 'zod';

// User Profile Schema
export const userProfileSchema = z.object({
  locationPreference: z.string().min(1, 'Lokasi preferensi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan investasi wajib diisi'),
  financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
  timeHorizon: z.string().min(1, 'Time horizon wajib diisi'),
});

// Avatar URL validation: accepts full URL, relative path starting with /, or empty string
const avatarUrlSchema = z.string().refine(
  (val) => {
    // Empty string is valid
    if (val === '') return true;
    // Relative path starting with / is valid
    if (val.startsWith('/')) return true;
    // Full URL (http:// or https://) is valid
    try {
      new URL(val);
      return val.startsWith('http://') || val.startsWith('https://');
    } catch {
      return false;
    }
  },
  {
    message: 'URL avatar tidak valid. Harus berupa URL penuh (http:// atau https://), path relatif (dimulai dengan /), atau string kosong',
  }
);

// User Create Schema
export const createUserSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(255, 'Nama terlalu panjang'),
  email: z.string().email('Email tidak valid'),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 karakter').max(20, 'Nomor telepon terlalu panjang'),
  avatarUrl: avatarUrlSchema,
  avatarHint: z.string().min(1, 'Avatar hint wajib diisi'),
  role: z.number().int().min(1).max(2).default(1), // 1 = user biasa, 2 = admin
  locationPreference: z.string().optional(),
  priceRange: z.string().optional(),
  investmentGoals: z.string().optional(),
  financialCapacity: z.string().optional(),
  timeHorizon: z.string().optional(),
  passwordHash: z.string().optional(),
  oauthProvider: z.enum(['google']).nullable().optional(),
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
  oauthProvider: z.enum(['google']),
  oauthId: z.string().min(1, 'OAuth ID wajib diisi'),
  avatarUrl: avatarUrlSchema.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type OAuthUserInput = z.infer<typeof oauthUserSchema>;

