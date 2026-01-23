'use client';

import type { User } from '@/lib/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, DollarSign, Target, Clock, Home, Pencil, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/lib/actions/user.actions';
import { useAuth } from '@/contexts/auth-context';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Reusing options from recommendations.tsx
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

const timeHorizonOptions: ComboboxOption[] = [
    { value: "short", label: "Jangka pendek (< 5 tahun)" },
    { value: "medium", label: "Jangka menengah (5-10 tahun)" },
    { value: "long", label: "Jangka panjang (10+ tahun)" },
]

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phoneNumber: z.string().min(1, 'Nomor telepon wajib diisi'),
  locationPreference: z.string().min(1, 'Lokasi wajib diisi'),
  priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
  investmentGoals: z.string().min(1, 'Tujuan kepemilikan wajib diisi'),
  financialCapacity: z.coerce.string().min(1, 'Kapasitas finansial wajib diisi'), // Keep as string for now to match current usage or convert if needed
  timeHorizon: z.string().min(1, 'Horison waktu wajib diisi'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileDetailClient({ user: initialUser, isOwnProfile = false }: { user: User, isOwnProfile?: boolean }) {
  const { toast } = useToast();
  
  const [user, setUser] = useState<User>(initialUser);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phoneNumber: user.phoneNumber,
      locationPreference: user.profile.locationPreference || 'jakarta',
      priceRange: user.profile.priceRange || '200-400',
      investmentGoals: user.profile.investmentGoals || 'first-home',
      financialCapacity: user.profile.financialCapacity || '',
      timeHorizon: user.profile.timeHorizon || 'long',
    },
  });

  // Update form when user state changes
  useEffect(() => {
    form.reset({
      name: user.name,
      phoneNumber: user.phoneNumber,
      locationPreference: user.profile.locationPreference || 'jakarta',
      priceRange: user.profile.priceRange || '200-400',
      investmentGoals: user.profile.investmentGoals || 'first-home',
      financialCapacity: user.profile.financialCapacity || '',
      timeHorizon: user.profile.timeHorizon || 'long',
    });
  }, [user, form]);

  if (!user) {
    notFound();
  }

  const joinYear = new Date(user.createdAt).getFullYear();

  const handleSave = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
        const result = await updateUser(user.id, {
            name: data.name,
            phoneNumber: data.phoneNumber,
            locationPreference: data.locationPreference,
            priceRange: data.priceRange,
            investmentGoals: data.investmentGoals,
            financialCapacity: data.financialCapacity,
            timeHorizon: data.timeHorizon,
        });

        if (result.success && result.data) {
            setUser(result.data as User);
            toast({
                title: 'Berhasil',
                description: 'Profil berhasil diperbarui',
            });
            setOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal',
                description: result.error?.message || 'Gagal memperbarui profil',
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Terjadi kesalahan saat menyimpan',
        });
    } finally {
        setIsSaving(false);
    }
  };

  const getLabel = (options: ComboboxOption[], value: string) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <main className="flex-1 bg-muted/20">
      <div className="container mx-auto max-w-3xl py-6 sm:py-10">
        <div className='mb-4'>
            <Link href="/" className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
            <ArrowLeft size={16} />
            Kembali
          </Link>
        </div>
        <Card className="overflow-hidden">
            <CardHeader className="relative flex-col items-center gap-4 border-b bg-background/50 p-6 text-center sm:flex-row sm:text-left">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover" />
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>Anggota BeliRumahBareng sejak {joinYear}</CardDescription>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:items-start items-center">
                    <span>{user.email}</span>
                    <span>{user.phoneNumber}</span>
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="absolute right-6 top-6">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil size={14} />
                                Edit Profil
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle>Edit Profil</DialogTitle>
                                <DialogDescription>
                                    Perbarui informasi pribadi dan preferensi properti Anda.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nama Lengkap</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Nama Lengkap" />
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
                                                        <Input {...field} placeholder="Nomor Telepon" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                     </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="locationPreference"
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value}>
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
                                                    <FormLabel>Tujuan Kepemilikan</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih tujuan kepemilikan" />
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
                                                    <FormLabel>Kapasitas Finansial</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Contoh: Cash Keras / KPR" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="timeHorizon"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Horison Waktu</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value}>
                                                        <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih horison waktu" />
                                                        </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                        {timeHorizonOptions.map(option => (
                                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                        ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Simpan Perubahan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
              )}

          </CardHeader>
          <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Preferensi Properti</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MapPin size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Lokasi Pilihan</p>
                          <p className="font-semibold">{getLabel(cities, user.profile.locationPreference)}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <DollarSign size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Rentang Harga</p>
                          <p className="font-semibold">{getLabel(priceRanges, user.profile.priceRange)}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Target size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Tujuan Kepemilikan</p>
                          <p className="font-semibold">{getLabel(investmentGoalsOptions, user.profile.investmentGoals)}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Home size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Kapasitas Finansial</p>
                          <p className="font-semibold">{user.profile.financialCapacity || '-'}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-4 sm:col-span-2">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Clock size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Horison Waktu</p>
                          <p className="font-semibold">{getLabel(timeHorizonOptions, user.profile.timeHorizon)}</p>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
