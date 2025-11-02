'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getRecommendationsAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { PersonalizedPropertyRecommendationsOutput } from '@/ai/flows/personalized-property-recommendations';
import { useToast } from '@/hooks/use-toast';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { mockUsers } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const cities: ComboboxOption[] = [
    { value: "jakarta", label: "Jakarta" },
    { value: "surabaya", label: "Surabaya" },
    { value: "bandung", label: "Bandung" },
    { value: "bekasi", label: "Bekasi" },
    { value: "tangerang", label: "Tangerang" },
    { value: "yogyakarta", label: "Yogyakarta" },
];

const priceRanges: ComboboxOption[] = [
    { value: "200-400", label: "Rp 200jt - 400jt" },
    { value: "400-600", label: "Rp 400jt - 600jt" },
    { value: "600-800", label: "Rp 600jt - 800jt" },
    { value: "800-1M", label: "Rp 800jt - 1M" },
    { value: "1M+", label: "Diatas Rp 1M" },
]

const investmentGoalsOptions: ComboboxOption[] = [
    { value: "first-home", label: "Kepemilikan rumah pertama" },
    { value: "rental-income", label: "Pendapatan sewa" },
    { value: "capital-appreciation", label: "Apresiasi modal" },
    { value: "business-use", label: "Penggunaan bisnis (ruko)" },
    { value: "future-personal-use", label: "Penggunaan pribadi di masa depan" },
]

const FormSchema = z.object({
  location: z.string().min(1, { message: 'Lokasi harus dipilih.' }),
  priceRange: z.string().min(1, { message: 'Rentang harga harus dipilih.' }),
  investmentGoals: z.string().min(1, { message: 'Tujuan investasi harus dipilih.' }),
  financialCapacity: z.coerce.number().min(0, { message: 'Kapasitas finansial harus diisi.' }),
});

const currentUser = mockUsers[0];

export default function Recommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedPropertyRecommendationsOutput['recommendations']>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      location: currentUser.profile.locationPreference.toLowerCase(),
      priceRange: '200-400',
      investmentGoals: "first-home",
      financialCapacity: 500000000,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setRecommendations([]);

    const priceRangeParts = data.priceRange.split('-');
    const minPrice = parseInt(priceRangeParts[0].replace('jt', '000000').replace('M','000000000'), 10);
    const maxPrice = priceRangeParts[1] ? parseInt(priceRangeParts[1].replace('jt', '000000').replace('M','000000000'), 10) : 9999999999;
    
    const investmentGoalLabel = investmentGoalsOptions.find(opt => opt.value === data.investmentGoals)?.label ?? data.investmentGoals;


    const result = await getRecommendationsAction({
        location: data.location,
        priceRange: { min: minPrice, max: maxPrice },
        investmentGoals: investmentGoalLabel,
        financialCapacity: `Rp ${new Intl.NumberFormat('id-ID').format(data.financialCapacity)}`
    });

    if (result.success && result.data) {
        setRecommendations(result.data.recommendations);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Terjadi kesalahan yang tidak diketahui.",
        });
    }
    setIsLoading(false);
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(price);

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <p className="text-muted-foreground">
        Masukkan preferensi Anda di bawah ini dan AI kami akan menemukan properti yang cocok untuk Anda.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Lokasi Pilihan</FormLabel>
                   <Combobox
                        options={cities}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Pilih kota..."
                        emptyText="Kota tidak ditemukan."
                    />
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
                            {priceRanges.map(range => (
                                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
             />
          </div>
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
                control={form.control}
                name="investmentGoals"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tujuan Investasi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tujuan investasi" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {investmentGoalsOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
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
                    <FormLabel>Kapasitas Finansial (IDR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="cth., 500000000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Hasilkan Rekomendasi
          </Button>
        </form>
      </Form>

      {isLoading && (
         <div className="mt-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">AI kami sedang mencari properti sempurna untuk Anda...</p>
         </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Berikut adalah rekomendasi teratas untuk Anda:</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recommendations.map(rec => (
              <Card key={rec.propertyId} className='overflow-hidden'>
                <CardHeader>
                    <CardTitle className="text-base">{rec.propertyName}</CardTitle>
                    <CardDescription className='flex items-center text-xs'>
                        <MapPin className="mr-1 h-3 w-3" /> {rec.location}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{rec.propertyDescription}</p>
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-primary">{formatPrice(rec.propertyPrice)}</p>
                    <div className="text-right">
                        <p className="font-bold text-green-600">{rec.suitabilityScore}/100</p>
                        <p className="text-xs text-muted-foreground">Kecocokan</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}