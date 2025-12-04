'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Upload, X, Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  avatarUrl: z.string().min(1, 'Avatar wajib diupload'),
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
  const { toast } = useToast();
  const [uploadedAvatar, setUploadedAvatar] = useState<{ url: string; hint: string } | null>(
    user?.avatarUrl ? {
      url: user.avatarUrl,
      hint: user.avatarHint || '',
    } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

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

  // Update form when uploadedAvatar changes
  useEffect(() => {
    if (uploadedAvatar) {
      form.setValue('avatarUrl', uploadedAvatar.url);
      form.setValue('avatarHint', uploadedAvatar.hint);
    }
  }, [uploadedAvatar, form]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedAvatar(result.data);
        toast({
          title: 'Berhasil',
          description: 'Avatar berhasil diupload',
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload avatar',
      });
    } finally {
      setIsUploading(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setUploadedAvatar(null);
    form.setValue('avatarUrl', '');
    form.setValue('avatarHint', '');
  };

  const handleSubmit = (data: UserFormValues) => {
    // Validate avatar
    if (!uploadedAvatar) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Avatar wajib diupload',
      });
      return;
    }

    // Use uploaded avatar
    data.avatarUrl = uploadedAvatar.url;
    data.avatarHint = uploadedAvatar.hint;

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
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Avatar</FormLabel>
          {uploadedAvatar ? (
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={uploadedAvatar.url} alt={uploadedAvatar.hint || 'Avatar'} />
                  <AvatarFallback>
                    <UserIcon className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="avatarHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar Hint (Opsional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ''}
                          placeholder="Deskripsi singkat untuk aksesibilitas"
                          onChange={(e) => {
                            field.onChange(e);
                            setUploadedAvatar({ ...uploadedAvatar, hint: e.target.value });
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Deskripsi singkat untuk aksesibilitas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => avatarFileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Avatar
                  </>
                )}
              </Button>
              <FormDescription className="mt-2">
                Upload foto profil (JPEG, PNG, WebP). Maksimal 5MB.
              </FormDescription>
            </div>
          )}
          <FormField
            control={form.control}
            name="avatarUrl"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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








