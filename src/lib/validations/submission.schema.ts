import { z } from 'zod';

// Property Submission Image Schema
export const propertySubmissionImageSchema = z.object({
  url: z.string().url('URL gambar tidak valid'),
  hint: z.string().min(1, 'Hint gambar wajib diisi'),
  order: z.number().int().min(0).default(0),
});

// Property Submission Create Schema
export const createPropertySubmissionSchema = z.object({
  submittedBy: z.string().cuid('ID submitter tidak valid'),
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  name: z.string().min(1, 'Nama properti wajib diisi').max(255, 'Nama terlalu panjang'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  totalArea: z.number().positive('Total area harus positif').optional(),
  totalUnits: z.number().int().positive('Total unit harus positif').optional(),
  unitSize: z.number().positive('Ukuran unit harus positif').optional(),
  unitMeasure: z.string().optional(),
  askingPrice: z.number().positive('Harga penawaran harus positif'),
  contactPerson: z.string().min(1, 'Nama kontak wajib diisi'),
  contactPhone: z.string().min(10, 'Nomor telepon minimal 10 karakter'),
  contactEmail: z.string().email('Email kontak tidak valid'),
  images: z.array(propertySubmissionImageSchema).min(1, 'Minimal 1 gambar diperlukan'),
});

// Property Submission Update Schema
export const updatePropertySubmissionSchema = createPropertySubmissionSchema.partial().extend({
  id: z.string().cuid('ID submission tidak valid'),
  images: z.array(propertySubmissionImageSchema).optional(),
});

// Property Submission Review Schema (for admin)
export const reviewPropertySubmissionSchema = z.object({
  id: z.string().cuid('ID submission tidak valid'),
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Status wajib dipilih',
  }),
  notes: z.string().optional(),
  reviewedBy: z.string().cuid('ID reviewer tidak valid'),
});

export type CreatePropertySubmissionInput = z.infer<typeof createPropertySubmissionSchema>;
export type UpdatePropertySubmissionInput = z.infer<typeof updatePropertySubmissionSchema>;
export type ReviewPropertySubmissionInput = z.infer<typeof reviewPropertySubmissionSchema>;
export type PropertySubmissionImageInput = z.infer<typeof propertySubmissionImageSchema>;

