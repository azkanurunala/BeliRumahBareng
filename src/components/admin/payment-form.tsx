'use client';

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
import type { MonthlyPayment, User } from '@/lib/types';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  paymentDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  dueDate: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
  status: z.enum(['paid', 'pending', 'overdue', 'partial'], {
    required_error: 'Status wajib dipilih',
  }),
  paymentMethod: z.enum(['transfer', 'cash', 'other']).optional(),
  receiptUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  payment?: MonthlyPayment;
  projectMembers: User[];
  onSubmit: (data: PaymentFormValues) => void;
  onCancel?: () => void;
}

export function PaymentForm({ payment, projectMembers, onSubmit, onCancel }: PaymentFormProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment
      ? {
          amount: payment.amount,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
          dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
          period: payment.period,
          status: payment.status,
          paymentMethod: payment.paymentMethod as 'transfer' | 'cash' | 'other' | undefined,
          receiptUrl: payment.receiptUrl || '',
          notes: payment.notes || '',
          verifiedBy: payment.verifiedBy || '',
          verifiedAt: payment.verifiedAt ? new Date(payment.verifiedAt).toISOString().split('T')[0] : '',
        }
      : {
          amount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          period: new Date().toISOString().slice(0, 7),
          status: 'pending',
          paymentMethod: 'transfer',
          receiptUrl: '',
          notes: '',
          verifiedBy: '',
          verifiedAt: '',
        },
  });

  const watchStatus = form.watch('status');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Pembayaran (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periode (YYYY-MM)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="2025-03" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Jatuh Tempo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Pembayaran</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metode Pembayaran</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Bukti Pembayaran (Opsional)</FormLabel>
              <FormControl>
                <Input {...field} type="url" value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchStatus === 'paid' && (
          <>
            <FormField
              control={form.control}
              name="verifiedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diverifikasi Oleh</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih admin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Tidak ada</SelectItem>
                      {projectMembers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verifiedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Verifikasi</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Wajib diisi jika status adalah Paid
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

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

