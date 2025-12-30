import { z } from 'zod';

// Property Image Schema
export const propertyImageSchema = z.object({
  url: z.string().url('URL gambar tidak valid'),
  hint: z.string().min(1, 'Hint gambar wajib diisi'),
  order: z.number().int().min(0).default(0),
});

// Base Property Schema (tanpa refine untuk bisa digunakan dengan .partial())
const basePropertySchema = z.object({
  name: z.string().min(1, 'Nama properti wajib diisi').max(255, 'Nama terlalu panjang'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.number().positive('Harga harus positif'),
  totalArea: z.number().positive('Total area harus positif').optional(),
  buildingArea: z.number().positive('Total luas bangunan harus positif').optional(),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  totalUnits: z.number().int().positive('Total unit harus positif').optional(),
  unitName: z.enum(['Lantai', 'Kavling', 'Kepemilikan'], {
    required_error: 'Nama unit wajib dipilih',
  }),
  unitSize: z.number().positive('Ukuran unit harus positif').optional(),
  unitMeasure: z.string().optional(),
  unitPrices: z.array(z.object({
    size: z.number().min(0, 'Ukuran harus positif'),
    price: z.number().min(0, 'Harga harus positif'),
  })).optional(),
  sitePlanUrl: z.string().url('URL site plan tidak valid').optional().or(z.literal('')),
  sitePlanHint: z.string().optional(),
  developmentPlan: z.string().optional(),
  environmentalAnalysis: z.string().optional(),
  images: z.array(propertyImageSchema).min(1, 'Minimal 1 gambar diperlukan'),
});

// Property Create Schema dengan refine untuk validasi conditional
export const createPropertySchema = basePropertySchema.refine((data) => {
  // Co-Building: wajib totalArea (Luas Lahan), buildingArea (Total Luas Bangunan), dan totalUnits
  if (data.type === 'co-building') {
    return data.totalArea !== undefined && data.totalArea > 0 &&
           data.buildingArea !== undefined && data.buildingArea > 0 &&
           data.totalUnits !== undefined && data.totalUnits > 0;
  }
  return true;
}, {
  message: 'Luas Lahan, Total Luas Bangunan, dan Total Unit wajib diisi untuk tipe co-building',
  path: ['buildingArea'],
});

// Property Update Schema menggunakan base schema (bukan yang sudah di-refine)
export const updatePropertySchema = basePropertySchema.partial().extend({
  id: z.string().cuid('ID tidak valid'),
  images: z.array(propertyImageSchema).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyImageInput = z.infer<typeof propertyImageSchema>;

