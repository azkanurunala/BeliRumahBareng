'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
    url: z.string().min(1, 'URL gambar wajib diisi'),
    hint: z.string().optional(),
  })).min(1, 'Minimal 1 gambar diperlukan'),
  planningInfo: z.object({
    sitePlanUrl: z.string().optional(),
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
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; hint: string }>>(
    property?.images || []
  );
  const [uploadedSitePlan, setUploadedSitePlan] = useState<{ url: string; hint: string } | null>(
    property?.planningInfo?.sitePlanUrl ? {
      url: property.planningInfo.sitePlanUrl,
      hint: property.planningInfo.sitePlanHint || '',
    } : null
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingSitePlan, setIsUploadingSitePlan] = useState(false);
  const imagesFileInputRef = useRef<HTMLInputElement>(null);
  const sitePlanFileInputRef = useRef<HTMLInputElement>(null);

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
          images: [],
        },
  });

  const watchType = form.watch('type');
  const watchTotalArea = form.watch('totalArea');
  const isFlexible = watchType === 'co-owning' && watchTotalArea;

  // Update form when uploadedImages change
  useEffect(() => {
    if (uploadedImages.length > 0) {
      form.setValue('images', uploadedImages);
    }
  }, [uploadedImages, form]);

  // Update form when uploadedSitePlan change
  useEffect(() => {
    if (uploadedSitePlan) {
      form.setValue('planningInfo.sitePlanUrl', uploadedSitePlan.url);
      form.setValue('planningInfo.sitePlanHint', uploadedSitePlan.hint);
    }
  }, [uploadedSitePlan, form]);

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedImages((prev) => [...prev, ...result.data]);
        form.setValue('images', [...uploadedImages, ...result.data]);
        toast({
          title: 'Berhasil',
          description: `${result.data.length} gambar berhasil diupload`,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload gambar',
      });
    } finally {
      setIsUploadingImages(false);
      if (imagesFileInputRef.current) {
        imagesFileInputRef.current.value = '';
      }
    }
  };

  const handleSitePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSitePlan(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedSitePlan(result.data);
        form.setValue('planningInfo.sitePlanUrl', result.data.url);
        form.setValue('planningInfo.sitePlanHint', result.data.hint);
        toast({
          title: 'Berhasil',
          description: 'Denah lokasi berhasil diupload',
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading site plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload denah',
      });
    } finally {
      setIsUploadingSitePlan(false);
      if (sitePlanFileInputRef.current) {
        sitePlanFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  const handleRemoveSitePlan = () => {
    setUploadedSitePlan(null);
    form.setValue('planningInfo.sitePlanUrl', '');
    form.setValue('planningInfo.sitePlanHint', '');
  };

  const handleSubmit = (data: PropertyFormValues) => {
    // Validate images
    if (uploadedImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Minimal 1 gambar diperlukan',
      });
      return;
    }

    // Use uploaded images
    data.images = uploadedImages;

    // Use uploaded site plan if available
    if (uploadedSitePlan) {
      if (!data.planningInfo) {
        data.planningInfo = {
          sitePlanUrl: '',
          sitePlanHint: '',
          developmentPlan: '',
          environmentalAnalysis: '',
        };
      }
      data.planningInfo.sitePlanUrl = uploadedSitePlan.url;
      data.planningInfo.sitePlanHint = uploadedSitePlan.hint;
    }

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
          <div className="space-y-4">
            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={image.url}
                        alt={image.hint || `Gambar ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {image.hint && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{image.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div>
              <input
                ref={imagesFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImagesUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imagesFileInputRef.current?.click()}
                disabled={isUploadingImages}
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Gambar
                  </>
                )}
              </Button>
              <FormDescription className="mt-2">
                Upload gambar properti (JPEG, PNG, WebP). Maksimal 5MB per gambar.
              </FormDescription>
            </div>
          </div>
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Informasi Perencanaan (Opsional)</FormLabel>
          
          {/* Site Plan Upload */}
          <div className="space-y-2">
            <FormLabel>Denah Lokasi</FormLabel>
            {uploadedSitePlan ? (
              <div className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={uploadedSitePlan.url}
                    alt={uploadedSitePlan.hint || 'Denah lokasi'}
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveSitePlan}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadedSitePlan.hint && (
                  <p className="text-xs text-muted-foreground mt-1">{uploadedSitePlan.hint}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={sitePlanFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleSitePlanUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => sitePlanFileInputRef.current?.click()}
                  disabled={isUploadingSitePlan}
                >
                  {isUploadingSitePlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload Denah Lokasi
                    </>
                  )}
                </Button>
                <FormDescription className="mt-2">
                  Upload denah lokasi (JPEG, PNG, WebP). Maksimal 5MB.
                </FormDescription>
              </div>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="planningInfo.sitePlanHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hint Denah (Opsional)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Deskripsi singkat denah"
                    onChange={(e) => {
                      field.onChange(e);
                      if (uploadedSitePlan) {
                        setUploadedSitePlan({ ...uploadedSitePlan, hint: e.target.value });
                      }
                    }}
                  />
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

