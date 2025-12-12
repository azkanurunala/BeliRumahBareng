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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email atau nomor telepon wajib diisi'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: '',
    },
  });

  const handleSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, send reset link to email or SMS to phone
      setIsSubmitted(true);
      toast({
        title: 'Email Terkirim',
        description: 'Link reset password telah dikirim ke email/nomor telepon Anda.',
      });
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

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Cek Email/WhatsApp Anda</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Link reset password telah dikirim ke <strong>{form.getValues('emailOrPhone')}</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Silakan cek inbox email atau pesan WhatsApp Anda untuk melanjutkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="emailOrPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email atau Nomor Telepon</FormLabel>
              <FormControl>
                <Input {...field} placeholder="email@example.com atau 081234567890" />
              </FormControl>
              <FormDescription>
                Kami akan mengirimkan link reset password ke email atau WhatsApp Anda
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Link Reset Password'
          )}
        </Button>
      </form>
    </Form>
  );
}











