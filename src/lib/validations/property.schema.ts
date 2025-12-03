import { z } from 'zod';

// Property Image Schema
export const propertyImageSchema = z.object({
  url: z.string().url('URL gambar tidak valid'),
  hint: z.string().min(1, 'Hint gambar wajib diisi'),
  order: z.number().int().min(0).default(0),
});

// Property Create Schema
export const createPropertySchema = z.object({
  name: z.string().min(1, 'Nama properti wajib diisi').max(255, 'Nama terlalu panjang'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.number().positive('Harga harus positif'),
  totalArea: z.number().positive('Total area harus positif').optional(),
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
  sitePlanUrl: z.string().url('URL site plan tidak valid').optional().or(z.literal('')),
  sitePlanHint: z.string().optional(),
  developmentPlan: z.string().optional(),
  environmentalAnalysis: z.string().optional(),
  images: z.array(propertyImageSchema).min(1, 'Minimal 1 gambar diperlukan'),
});

// Property Update Schema
export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().cuid('ID tidak valid'),
  images: z.array(propertyImageSchema).optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyImageInput = z.infer<typeof propertyImageSchema>;

