'use client';

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
import type { User } from '@/lib/types';

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  avatarUrl: z.string().url('URL avatar tidak valid'),
  avatarHint: z.string().optional(),
  profile: z.object({
    locationPreference: z.string().min(1, 'Preferensi lokasi wajib diisi'),
    priceRange: z.string().min(1, 'Rentang harga wajib diisi'),
    investmentGoals: z.string().min(1, 'Tujuan investasi wajib diisi'),
    financialCapacity: z.string().min(1, 'Kapasitas finansial wajib diisi'),
    timeHorizon: z.string().min(1, 'Horison waktu wajib diisi'),
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormValues) => void;
  onCancel?: () => void;
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          name: user.name,
          avatarUrl: user.avatarUrl,
          avatarHint: user.avatarHint,
          profile: user.profile,
        }
      : {
          name: '',
          avatarUrl: '',
          avatarHint: '',
          profile: {
            locationPreference: '',
            priceRange: '',
            investmentGoals: '',
            financialCapacity: '',
            timeHorizon: '',
          },
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Avatar</FormLabel>
              <FormControl>
                <Input {...field} type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Hint (Opsional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormDescription>
                Deskripsi singkat untuk aksesibilitas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Profil Preferensi</h3>
          
          <FormField
            control={form.control}
            name="profile.locationPreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferensi Lokasi</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profile.priceRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rentang Harga</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 300-600 juta IDR" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profile.investmentGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tujuan Kepemilikan</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Kepemilikan rumah pertama" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profile.financialCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kapasitas Finansial</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 500 juta IDR" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profile.timeHorizon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horison Waktu</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Jangka panjang (10+ tahun)" />
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

