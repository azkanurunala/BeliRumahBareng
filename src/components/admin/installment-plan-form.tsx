'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import type { InstallmentPlan, User } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const paymentSchema = z.object({
  id: z.string(),
  amount: z.number().min(1),
  paymentDate: z.string().optional(),
  dueDate: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  status: z.enum(['paid', 'pending', 'overdue', 'partial']),
  paymentMethod: z.enum(['transfer', 'cash', 'other']).optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  createdAt: z.string(),
});

const installmentPlanSchema = z.object({
  userId: z.string().min(1, 'User wajib dipilih'),
  unitId: z.number().min(1, 'Unit ID harus lebih dari 0'),
  totalAmount: z.number().min(1, 'Total amount harus lebih dari 0'),
  downPayment: z.number().min(0, 'Down payment tidak boleh negatif'),
  installmentAmount: z.number().min(1, 'Installment amount harus lebih dari 0'),
  totalInstallments: z.number().min(1, 'Total installments harus lebih dari 0'),
  startDate: z.string().min(1, 'Start date wajib diisi'),
  endDate: z.string().min(1, 'End date wajib diisi'),
  status: z.enum(['active', 'completed', 'cancelled']),
  payments: z.array(paymentSchema).optional(),
}).refine((data) => {
  const calculatedTotal = data.downPayment + (data.installmentAmount * data.totalInstallments);
  return Math.abs(calculatedTotal - data.totalAmount) < 1000; // Allow small rounding differences
}, {
  message: 'Total amount harus sama dengan downPayment + (installmentAmount * totalInstallments)',
  path: ['totalAmount'],
});

type InstallmentPlanFormValues = z.infer<typeof installmentPlanSchema>;

interface InstallmentPlanFormProps {
  installmentPlan?: InstallmentPlan;
  projectMembers: User[];
  onSubmit: (data: InstallmentPlanFormValues) => void;
  onCancel?: () => void;
}

export function InstallmentPlanForm({ installmentPlan, projectMembers, onSubmit, onCancel }: InstallmentPlanFormProps) {
  const form = useForm<InstallmentPlanFormValues>({
    resolver: zodResolver(installmentPlanSchema),
    defaultValues: installmentPlan
      ? {
          userId: installmentPlan.userId,
          unitId: installmentPlan.unitId,
          totalAmount: installmentPlan.totalAmount,
          downPayment: installmentPlan.downPayment,
          installmentAmount: installmentPlan.installmentAmount,
          totalInstallments: installmentPlan.totalInstallments,
          startDate: installmentPlan.startDate ? new Date(installmentPlan.startDate).toISOString().split('T')[0] : '',
          endDate: installmentPlan.endDate ? new Date(installmentPlan.endDate).toISOString().split('T')[0] : '',
          status: installmentPlan.status,
          payments: installmentPlan.payments || [],
        }
      : {
          userId: '',
          unitId: 1,
          totalAmount: 0,
          downPayment: 0,
          installmentAmount: 0,
          totalInstallments: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          status: 'active',
          payments: [],
        },
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: 'payments',
  });

  const watchTotalAmount = form.watch('totalAmount');
  const watchDownPayment = form.watch('downPayment');
  const watchInstallmentAmount = form.watch('installmentAmount');
  const watchTotalInstallments = form.watch('totalInstallments');

  // Calculate expected total
  const calculatedTotal = watchDownPayment + (watchInstallmentAmount * watchTotalInstallments);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih user" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="unitId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit ID</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Harus sama dengan: DP + (Cicilan × Total Cicilan)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="downPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Down Payment (IDR)</FormLabel>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="installmentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Installment Amount per Bulan (IDR)</FormLabel>
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
            name="totalInstallments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Installments (Bulan)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {calculatedTotal > 0 && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Validasi Perhitungan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Down Payment:</span>
                  <span>{watchDownPayment.toLocaleString('id-ID')} IDR</span>
                </div>
                <div className="flex justify-between">
                  <span>Cicilan per Bulan:</span>
                  <span>{watchInstallmentAmount.toLocaleString('id-ID')} IDR</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cicilan:</span>
                  <span>{watchTotalInstallments} bulan</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Dihitung:</span>
                  <span>{calculatedTotal.toLocaleString('id-ID')} IDR</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className={Math.abs(calculatedTotal - watchTotalAmount) < 1000 ? 'text-green-600' : 'text-red-600'}>
                    {watchTotalAmount.toLocaleString('id-ID')} IDR
                  </span>
                </div>
                {Math.abs(calculatedTotal - watchTotalAmount) >= 1000 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Total amount tidak sesuai dengan perhitungan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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











