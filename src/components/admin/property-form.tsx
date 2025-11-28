'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Property } from '@/lib/types';
import { Plus, X } from 'lucide-react';

const propertySchema = z.object({
  name: z.string().min(1, 'Nama properti wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.number().min(1, 'Harga harus lebih dari 0'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  totalUnits: z.number().optional(),
  unitName: z.enum(['Lantai', 'Kavling', 'Kepemilikan']).optional(),
  unitSize: z.number().optional(),
  unitMeasure: z.string().optional(),
  totalArea: z.number().optional(),
  images: z.array(z.object({
    url: z.string().url('URL gambar tidak valid'),
    hint: z.string().optional(),
  })).min(1, 'Minimal 1 gambar diperlukan'),
  planningInfo: z.object({
    sitePlanUrl: z.string().url('URL denah tidak valid'),
    sitePlanHint: z.string().optional(),
    developmentPlan: z.string().optional(),
    environmentalAnalysis: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // Co-Building: wajib totalUnits
  if (data.type === 'co-building') {
    return data.totalUnits !== undefined && data.totalUnits > 0;
  }
  return true;
}, {
  message: 'Total unit wajib diisi untuk tipe co-building',
  path: ['totalUnits'],
}).refine((data) => {
  // Co-Owning Flexible: wajib totalArea dan unitMeasure, TIDAK ada totalUnits
  if (data.type === 'co-owning' && data.totalArea) {
    return data.unitMeasure !== undefined && data.unitMeasure.length > 0;
  }
  return true;
}, {
  message: 'Satuan unit wajib diisi untuk model fleksibel',
  path: ['unitMeasure'],
}).refine((data) => {
  // Co-Owning Non-Flexible: wajib totalUnits, unitSize, unitMeasure
  if (data.type === 'co-owning' && !data.totalArea) {
    return data.totalUnits !== undefined && data.totalUnits > 0 && 
           data.unitSize !== undefined && data.unitSize > 0 && 
           data.unitMeasure !== undefined && data.unitMeasure.length > 0;
  }
  return true;
}, {
  message: 'Total unit, ukuran unit, dan satuan wajib diisi untuk tipe co-owning non-fleksibel',
  path: ['totalUnits'],
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: PropertyFormValues) => void;
  onCancel?: () => void;
}

export function PropertyForm({ property, onSubmit, onCancel }: PropertyFormProps) {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          name: property.name,
          description: property.description,
          price: property.price,
          location: property.location,
          type: property.type,
          totalUnits: property.totalUnits,
          unitName: property.unitName,
          unitSize: property.unitSize,
          unitMeasure: property.unitMeasure,
          totalArea: property.totalArea,
          images: property.images,
          planningInfo: property.planningInfo,
        }
      : {
          name: '',
          description: '',
          price: 0,
          location: '',
          type: 'co-owning',
          images: [{ url: '', hint: '' }],
        },
  });

  const watchType = form.watch('type');
  const watchTotalArea = form.watch('totalArea');
  const isFlexible = watchType === 'co-owning' && watchTotalArea;

  const handleSubmit = (data: PropertyFormValues) => {
    // Auto-set unitName berdasarkan tipe
    if (data.type === 'co-building') {
      data.unitName = 'Lantai';
    } else if (data.type === 'co-owning') {
      if (data.totalArea) {
        // Flexible
        data.unitName = 'Kepemilikan';
        data.totalUnits = undefined; // Pastikan tidak ada totalUnits untuk flexible
        data.unitSize = undefined; // Pastikan tidak ada unitSize untuk flexible
      } else {
        // Non-Flexible
        data.unitName = 'Kavling';
        data.totalArea = undefined; // Pastikan tidak ada totalArea untuk non-flexible
      }
    }
    onSubmit(data);
  };

  const images = form.watch('images');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Properti</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Properti</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe properti" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="co-building">Co-Building</SelectItem>
                  <SelectItem value="co-owning">Co-Owning</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === 'co-building' && (
          <>
            <FormField
              control={form.control}
              name="totalUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Unit (Lantai)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                        form.setValue('unitName', 'Lantai');
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Jumlah lantai yang akan dibangun
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {watchType === 'co-owning' && (
          <>
            <div className="rounded-lg border p-4 bg-muted/50">
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Luas Tanah (untuk model fleksibel)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || undefined;
                          field.onChange(value);
                          if (value) {
                            // Flexible mode
                            form.setValue('unitName', 'Kepemilikan');
                            form.setValue('totalUnits', undefined);
                            form.setValue('unitSize', undefined);
                          } else {
                            // Non-flexible mode - clear flexible fields
                            form.setValue('unitName', 'Kavling');
                          }
                        }}
                        value={field.value || ''}
                        placeholder="Kosongkan untuk model non-fleksibel"
                      />
                    </FormControl>
                    <FormDescription>
                      Isi jika menggunakan model fleksibel (pembagian berdasarkan jumlah investor final). Kosongkan untuk model kavling tetap.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isFlexible ? (
              // Flexible mode: hanya totalArea dan unitMeasure
              <>
                <FormField
                  control={form.control}
                  name="unitMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan Luas</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="m²" />
                      </FormControl>
                      <FormDescription>
                        Satuan untuk total luas tanah (misalnya: m²)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
                  <strong>Model Fleksibel:</strong> Unit name akan otomatis di-set ke "Kepemilikan". Pembagian luas akan ditentukan berdasarkan jumlah investor final.
                </div>
              </>
            ) : (
              // Non-flexible mode: totalUnits, unitSize, unitMeasure
              <>
                <FormField
                  control={form.control}
                  name="totalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Unit (Kavling)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            field.onChange(value);
                            form.setValue('unitName', 'Kavling');
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Jumlah kavling yang akan dibagi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ukuran per Kavling</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Ukuran rata-rata per kavling
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan Unit</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="m²" />
                      </FormControl>
                      <FormDescription>
                        Satuan untuk ukuran kavling (misalnya: m²)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </>
        )}

        <div className="space-y-4">
          <FormLabel>Gambar Properti</FormLabel>
          {images.map((image, index) => (
            <div key={index} className="flex gap-2">
              <FormField
                control={form.control}
                name={`images.${index}.url`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="URL gambar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`images.${index}.hint`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} placeholder="Hint (opsional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {images.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newImages = images.filter((_, i) => i !== index);
                    form.setValue('images', newImages);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.setValue('images', [...images, { url: '', hint: '' }]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Gambar
          </Button>
        </div>

        <div className="space-y-4">
          <FormLabel>Informasi Perencanaan (Opsional)</FormLabel>
          <FormField
            control={form.control}
            name="planningInfo.sitePlanUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Denah Lokasi</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planningInfo.sitePlanHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hint Denah</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planningInfo.developmentPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rencana Pengembangan</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} rows={6} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planningInfo.environmentalAnalysis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Analisis Lingkungan</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} rows={6} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Form>
  );
}

