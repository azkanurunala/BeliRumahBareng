'use client';

import React from 'react';
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
import { useAuth } from '@/contexts/auth-context';
import { useAdminData } from '@/contexts/admin-data-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';

const sellPropertySchema = z.object({
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  name: z.string().min(3, 'Nama properti minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  landArea: z.number().optional(),
  buildingArea: z.number().optional(),
  totalUnits: z.number().optional(),
  unitSize: z.number().optional(),
  unitMeasure: z.string().optional(),
  askingPrice: z.number().min(1, 'Harga penawaran harus lebih dari 0'),
  contactPerson: z.string().min(2, 'Nama contact person minimal 2 karakter'),
  contactPhone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  contactEmail: z.string().email('Email tidak valid'),
}).refine((data) => {
  // For co-building, totalUnits is required
  if (data.type === 'co-building') {
    return !!data.totalUnits;
  }
  // For co-owning, at least one area field should be filled
  if (data.type === 'co-owning') {
    return !!(data.landArea || data.buildingArea);
  }
  return true;
}, {
  message: 'Luas Lahan atau Luas Bangunan wajib diisi untuk tipe co-owning',
  path: ['landArea'],
});

type SellPropertyFormValues = z.infer<typeof sellPropertySchema>;

export function SellPropertyForm() {
  const { user } = useAuth();
  const { createPropertySubmission } = useAdminData();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadedImages, setUploadedImages] = React.useState<Array<{ url: string; hint: string }>>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<SellPropertyFormValues>({
    resolver: zodResolver(sellPropertySchema),
    defaultValues: {
      type: undefined,
      name: '',
      description: '',
      location: user?.profile?.locationPreference || '',
      landArea: undefined,
      buildingArea: undefined,
      totalUnits: undefined,
      unitSize: undefined,
      unitMeasure: 'm²',
      askingPrice: 0,
      contactPerson: user?.name || '',
      contactPhone: user?.phoneNumber || '',
      contactEmail: user?.email || '',
    },
  });

  // Update form values when user data is available
  React.useEffect(() => {
    if (user) {
      form.setValue('contactPerson', user.name);
      form.setValue('contactPhone', user.phoneNumber);
      form.setValue('contactEmail', user.email);
      if (user.profile?.locationPreference) {
        form.setValue('location', user.profile.locationPreference);
      }
    }
  }, [user, form]);

  const propertyType = form.watch('type');
  const isCoBuilding = propertyType === 'co-building';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
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
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: SellPropertyFormValues) => {
    // Validate images
    if (uploadedImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Minimal 1 gambar diperlukan',
      });
      return;
    }

    setIsLoading(true);
    try {
      // For co-owning: totalArea should be from landArea (or buildingArea if no landArea)
      // Not adding them together - they are separate fields
      // For co-building: totalArea will be filled by admin when approving
      const totalArea = data.type === 'co-owning' 
        ? (data.landArea || data.buildingArea)
        : undefined;

      const submission = {
        id: `submission-${Date.now()}`,
        submittedBy: user?.id || 'guest', // Use guest if no user
        type: data.type,
        name: data.name,
        description: data.description,
        location: data.location,
        totalArea: totalArea,
        totalUnits: data.totalUnits,
        unitSize: data.unitSize,
        unitMeasure: data.unitMeasure || 'm²',
        askingPrice: data.askingPrice,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        images: uploadedImages,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      await createPropertySubmission(submission);
      
      toast({
        title: 'Berhasil',
        description: 'Form jual properti telah dikirim. Tim kami akan menghubungi Anda untuk proses selanjutnya.',
      });
      
      // Reset form dengan default values dari user
      form.reset({
        type: undefined,
        name: '',
        description: '',
        location: user?.profile?.locationPreference || '',
        landArea: undefined,
        buildingArea: undefined,
        totalUnits: undefined,
        unitSize: undefined,
        unitMeasure: 'm²',
        askingPrice: 0,
        contactPerson: user?.name || '',
        contactPhone: user?.phoneNumber || '',
        contactEmail: user?.email || '',
      });
      setUploadedImages([]);
      router.push('/projects');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  <SelectItem value="co-building">Bangunan</SelectItem>
                  <SelectItem value="co-owning">Lahan Kosong</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih apakah properti yang ingin dijual adalah bangunan atau lahan kosong
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Properti</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Contoh: Kavling Tanah di Sidoarjo" />
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
                <Textarea {...field} placeholder="Jelaskan detail properti yang ingin dijual" rows={5} />
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
                <Input {...field} placeholder="Contoh: Surabaya" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isCoBuilding ? (
            <FormField
              control={form.control}
              name="totalUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Lantai</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : parseInt(value) || undefined);
                      }}
                      onBlur={field.onBlur}
                      placeholder="Contoh: 16"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <>
              <FormField
                control={form.control}
                name="landArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luas Lahan (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value) || undefined);
                        }}
                        onBlur={field.onBlur}
                        placeholder="Contoh: 1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="buildingArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luas Bangunan (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? undefined : parseFloat(value) || undefined);
                        }}
                        onBlur={field.onBlur}
                        placeholder="Contoh: 500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {!isCoBuilding && form.watch('totalUnits') && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unitSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luas per Kavling</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : parseFloat(value) || undefined);
                      }}
                      onBlur={field.onBlur}
                      placeholder="Contoh: 110"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitMeasure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satuan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="m²" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="m²">m²</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="askingPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga Penawaran (IDR)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  value={field.value ? formatCurrencyInput(field.value) : ''}
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    field.onChange(parsed);
                  }}
                  onBlur={field.onBlur}
                  placeholder="Contoh: 1.800.000.000"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Gambar Properti</h3>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="property-images"
                disabled={isUploading || isLoading}
              />
              <label htmlFor="property-images">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isUploading || isLoading}
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Mengupload...' : 'Upload Gambar (Multiple)'}
                  </span>
                </Button>
              </label>
              <FormDescription className="mt-2">
                Upload minimal 1 gambar properti. Format yang didukung: JPEG, PNG, WebP. Maksimal 5MB per gambar.
              </FormDescription>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                      <img
                        src={image.url}
                        alt={image.hint || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{image.hint}</p>
                  </div>
                ))}
              </div>
            )}

            {uploadedImages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg border-muted-foreground/25">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada gambar yang diupload</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Kontak Person</h3>
          
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Contact Person</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nama lengkap" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="081234567890" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="email@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading || isUploading || uploadedImages.length === 0}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : uploadedImages.length === 0 ? (
            'Upload Minimal 1 Gambar Terlebih Dahulu'
          ) : (
            'Kirim Form Jual Properti'
          )}
        </Button>
      </form>
    </Form>
  );
}

