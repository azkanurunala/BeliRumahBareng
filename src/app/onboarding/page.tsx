'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { updateUser } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@/lib/types';

const onboardingSchema = z.object({
  locationPreference: z.string().min(1, 'Lokasi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan kepemilikan wajib diisi'),
  financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
  timeHorizon: z.string().min(1, 'Horison waktu wajib diisi'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

function OnboardingContent() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const searchParams = useSearchParams();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/onboarding');
    }
  }, [isLoading, isAuthenticated, router]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      locationPreference: '',
      priceRange: '',
      investmentGoals: '',
      financialCapacity: '',
      timeHorizon: '',
    },
  });

  // Pre-fill form if user data loads late
  useEffect(() => {
    if (user && user.profile) {
       // Only pre-fill if values exist (though for onboarding they likely don't)
       if (user.profile.locationPreference) form.setValue('locationPreference', user.profile.locationPreference);
       if (user.profile.priceRange) form.setValue('priceRange', user.profile.priceRange);
       if (user.profile.investmentGoals) form.setValue('investmentGoals', user.profile.investmentGoals);
       if (user.profile.financialCapacity) form.setValue('financialCapacity', user.profile.financialCapacity);
       if (user.profile.timeHorizon) form.setValue('timeHorizon', user.profile.timeHorizon);
    }
  }, [user, form]);

  const handleSubmit = async (data: OnboardingFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const result = await updateUser(user.id, {
        locationPreference: data.locationPreference,
        priceRange: data.priceRange,
        investmentGoals: data.investmentGoals,
        financialCapacity: data.financialCapacity,
        timeHorizon: data.timeHorizon,
      });

      if (result.success) {
        toast({
          title: 'Profil Lengkap!',
          description: 'Terima kasih telah melengkapi data profil Anda.',
        });
        
        // Redirect to projects or intended destination
        const redirect = searchParams.get('redirect');
        router.push(redirect || '/projects');
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: result.error?.message || 'Gagal menyimpan data.',
        });
      }
    } catch (error) {
       toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Terjadi kesalahan sistem.',
       });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Memuat..." fullScreen={true} />;
  }

  if (!user) return null;

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Lengkapi Profil Anda</CardTitle>
          <CardDescription>
            Bantu kami memberikan rekomendasi properti terbaik dengan melengkapi preferensi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="locationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi Pilihan</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

              <Button type="submit" className="w-full mt-6" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan & Lanjutkan
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Memuat..." fullScreen={true} />}>
      <OnboardingContent />
    </Suspense>
  );
}
