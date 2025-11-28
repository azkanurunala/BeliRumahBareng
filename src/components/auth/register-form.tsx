'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit').regex(/^[0-9+\-\s()]+$/, 'Format nomor telepon tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
  locationPreference: z.string().min(1, 'Preferensi lokasi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan investasi wajib diisi'),
  financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
  timeHorizon: z.string().min(1, 'Horison waktu wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      locationPreference: '',
      priceRange: '',
      investmentGoals: '',
      financialCapacity: '',
      timeHorizon: '',
    },
  });

  const handleSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const success = await registerUser({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        profile: {
          locationPreference: data.locationPreference,
          priceRange: data.priceRange,
          investmentGoals: data.investmentGoals,
          financialCapacity: data.financialCapacity,
          timeHorizon: data.timeHorizon,
        },
      });

      if (success) {
        toast({
          title: 'Berhasil',
          description: 'Akun berhasil dibuat. Selamat datang!',
        });
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Gagal membuat akun. Silakan coba lagi.',
        });
      }
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nama Anda" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
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

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input {...field} placeholder="081234567890" />
              </FormControl>
              <FormDescription>
                Format: 081234567890 atau +6281234567890
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Minimal 8 karakter" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Ulangi password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 space-y-4">
          <h3 className="font-semibold text-sm">Preferensi Properti</h3>
          
          <FormField
            control={form.control}
            name="locationPreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasi Pilihan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih lokasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Jakarta">Jakarta</SelectItem>
                    <SelectItem value="Bandung">Bandung</SelectItem>
                    <SelectItem value="Surabaya">Surabaya</SelectItem>
                    <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                    <SelectItem value="Bekasi">Bekasi</SelectItem>
                    <SelectItem value="Tangerang">Tangerang</SelectItem>
                    <SelectItem value="Sidoarjo">Sidoarjo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rentang Harga</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rentang harga" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="200-400 juta IDR">200-400 juta IDR</SelectItem>
                    <SelectItem value="250-400 juta IDR">250-400 juta IDR</SelectItem>
                    <SelectItem value="250-450 juta IDR">250-450 juta IDR</SelectItem>
                    <SelectItem value="300-500 juta IDR">300-500 juta IDR</SelectItem>
                    <SelectItem value="300-600 juta IDR">300-600 juta IDR</SelectItem>
                    <SelectItem value="400-800 juta IDR">400-800 juta IDR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="investmentGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tujuan Kepemilikan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tujuan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Kepemilikan rumah pertama">Kepemilikan rumah pertama</SelectItem>
                    <SelectItem value="Pendapatan sewa">Pendapatan sewa</SelectItem>
                    <SelectItem value="Apresiasi modal">Apresiasi modal</SelectItem>
                    <SelectItem value="Penggunaan bisnis (ruko)">Penggunaan bisnis (ruko)</SelectItem>
                    <SelectItem value="Investasi jangka panjang">Investasi jangka panjang</SelectItem>
                    <SelectItem value="Penggunaan pribadi di masa depan">Penggunaan pribadi di masa depan</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="financialCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kapasitas Finansial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kapasitas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="300 juta IDR">300 juta IDR</SelectItem>
                    <SelectItem value="350 juta IDR">350 juta IDR</SelectItem>
                    <SelectItem value="400 juta IDR">400 juta IDR</SelectItem>
                    <SelectItem value="500 juta IDR">500 juta IDR</SelectItem>
                    <SelectItem value="700 juta IDR">700 juta IDR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeHorizon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horison Waktu</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih horison waktu" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Jangka menengah (5-10 tahun)">Jangka menengah (5-10 tahun)</SelectItem>
                    <SelectItem value="Jangka panjang (10+ tahun)">Jangka panjang (10+ tahun)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mendaftar...
            </>
          ) : (
            'Daftar'
          )}
        </Button>
      </form>
    </Form>
  );
}

