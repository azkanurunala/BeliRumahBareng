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
import { Loader2 } from 'lucide-react';

const sellPropertySchema = z.object({
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  name: z.string().min(3, 'Nama properti minimal 3 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  totalArea: z.number().optional(),
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
  // For co-owning, either totalUnits or totalArea is required
  if (data.type === 'co-owning') {
    return !!data.totalUnits || !!data.totalArea;
  }
  return true;
}, {
  message: 'Total unit atau total area wajib diisi untuk tipe co-owning',
  path: ['totalUnits'],
});

type SellPropertyFormValues = z.infer<typeof sellPropertySchema>;

export function SellPropertyForm() {
  const { user } = useAuth();
  const { createPropertySubmission } = useAdminData();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<SellPropertyFormValues>({
    resolver: zodResolver(sellPropertySchema),
    defaultValues: {
      type: undefined,
      name: '',
      description: '',
      location: '',
      totalArea: undefined,
      totalUnits: undefined,
      unitSize: undefined,
      unitMeasure: 'm²',
      askingPrice: 0,
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  const propertyType = form.watch('type');
  const isCoBuilding = propertyType === 'co-building';

  const handleSubmit = async (data: SellPropertyFormValues) => {
    setIsLoading(true);
    try {
      const submission = {
        id: `submission-${Date.now()}`,
        submittedBy: user?.id || `guest-${Date.now()}`, // Use user ID if logged in, otherwise use guest ID
        type: data.type,
        name: data.name,
        description: data.description,
        location: data.location,
        totalArea: data.totalArea,
        totalUnits: data.totalUnits,
        unitSize: data.unitSize,
        unitMeasure: data.unitMeasure || 'm²',
        askingPrice: data.askingPrice,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        images: [],
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      createPropertySubmission(submission);
      
      toast({
        title: 'Berhasil',
        description: 'Form jual properti telah dikirim. Tim kami akan menghubungi Anda untuk proses selanjutnya.',
      });
      
      form.reset();
      // Redirect to home instead of dashboard if not logged in
      router.push(user ? '/dashboard' : '/');
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
                <Input {...field} placeholder="Contoh: Sidoarjo, Surabaya" />
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
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                name="totalUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Kavling (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        placeholder="Contoh: 9"
                      />
                    </FormControl>
                    <FormDescription>
                      Kosongkan jika properti fleksibel
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Luas (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        placeholder="Contoh: 1000"
                      />
                    </FormControl>
                    <FormDescription>
                      Untuk properti fleksibel
                    </FormDescription>
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
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 1800000000"
                />
              </FormControl>
              <FormDescription>
                Masukkan harga dalam Rupiah (tanpa titik atau koma)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Form Jual Properti'
          )}
        </Button>
      </form>
    </Form>
  );
}

