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
import { useRouter, useSearchParams } from 'next/navigation';
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
  const { register: registerUser, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

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
        
        // Check for redirect parameter
        const redirectTo = searchParams.get('redirect');
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/projects');
        }
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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        toast({
          title: 'Berhasil',
          description: 'Login dengan Google berhasil!',
        });
        
        // For Google login (which is also signup), check profile completeness?
        // Ideally yes, same as login form. 
        // But since we can't easily access 'user' state instantly here without waiting,
        // we might assume they need onboarding if it's a new user.
        // However, 'loginWithGoogle' action syncs user.
        // Let's just redirect to /onboarding for safety if we can't check.
        // OR better: redirect to /projects and let the middleware/auth context handle it?
        // But we implemented the check in Login Form.
        // Since Register Form is for *new* users usually, 
        // if they use Google, they might already exist OR be new.
        // Use the same logic: router.push('/projects') generally, 
        // but if we want to force onboarding, we should check user profile.
        // The auth context 'user' will update.
        // Let's just redirect to /projects, and rely on the user navigating to profile or 
        // adding a global check later if strictly required. 
        // OR: Redirect to /onboarding by default for google signups here?
        // No, that might annoy existing users who click "Register" but actually login.
        // Let's stick to /projects.
        router.push('/projects');
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Login dengan Google gagal.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat login Google. Silakan coba lagi.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Daftar dengan Google
            </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Atau daftar dengan email
          </span>
        </div>
      </div>

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
    </div>
  );
}

