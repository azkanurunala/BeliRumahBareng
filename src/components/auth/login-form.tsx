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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email atau nomor telepon wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  hideOAuth?: boolean;
  hideRegister?: boolean;
  redirectPath?: string | null; // null = auto-detect based on isAdmin
  requiredRole?: 1 | 2; // 1 = user biasa, 2 = admin
}

export function LoginForm({ hideOAuth = false, hideRegister = false, redirectPath = null, requiredRole }: LoginFormProps = {}) {
  const { login, loginWithOAuth, isAdmin, user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = React.useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = React.useState(false);

  // Watch user changes after login to validate role
  React.useEffect(() => {
    if (loginSuccess && user) {
      setIsLoading(false);
      
      // Check role validation if requiredRole is specified
      if (requiredRole !== undefined && user.role !== requiredRole) {
        // Role tidak sesuai, logout dan tampilkan error yang generic
        logout();
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Email/nomor telepon atau password salah.',
        });
        setLoginSuccess(false);
        return;
      }

      // Role sesuai atau tidak ada requiredRole, redirect
      toast({
        title: 'Berhasil',
        description: 'Selamat datang kembali!',
      });

      if (redirectPath !== null) {
        router.push(redirectPath);
      } else {
        const isAdminUser = isAdmin;
        router.push(isAdminUser ? '/admin/dashboard' : '/');
      }
      setLoginSuccess(false);
    }
  }, [user, loginSuccess, requiredRole, isAdmin, redirectPath, router, logout, toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
    },
  });

  const handleSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const success = await login(data.emailOrPhone, data.password);

      if (success) {
        // Set flag untuk trigger useEffect yang akan validate role
        setLoginSuccess(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Email/nomor telepon atau password salah.',
        });
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
      });
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsOAuthLoading(provider);
    try {
      const success = await loginWithOAuth(provider);
      if (success) {
        toast({
          title: 'Berhasil',
          description: 'Login berhasil!',
        });
        // OAuth login typically doesn't result in admin user, redirect to home
        router.push('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: 'Login dengan OAuth gagal.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setIsOAuthLoading(null);
    }
  };

  return (
    <div className="space-y-6">
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Masukkan password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Lupa password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Masuk...
              </>
            ) : (
              'Masuk'
            )}
          </Button>
        </form>
      </Form>

      {!hideOAuth && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Atau masuk dengan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthLoading !== null}
            >
              {isOAuthLoading === 'google' ? (
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
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={isOAuthLoading !== null}
            >
              {isOAuthLoading === 'facebook' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              Facebook
            </Button>
          </div>
        </>
      )}
    </div>
  );
}


