'use client';

import React from 'react';
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
import type { InstallmentPlan, User, UnitAssignment } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';

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
  return data.downPayment <= data.totalAmount;
}, {
  message: 'Down payment tidak boleh lebih dari Total Amount',
  path: ['downPayment'],
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
  unitAssignments: UnitAssignment[];
  projectId: string;
  onSubmit: (data: InstallmentPlanFormValues) => void;
  onCancel?: () => void;
}

export function InstallmentPlanForm({ installmentPlan, projectMembers, unitAssignments, projectId, onSubmit, onCancel }: InstallmentPlanFormProps) {
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
          startDate: '', // Will be auto-filled by useEffect
          endDate: '', // Will be auto-filled by useEffect
          status: 'active',
          payments: [],
        },
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: 'payments',
  });

  const watchUserId = form.watch('userId');
  const watchUnitId = form.watch('unitId');
  const watchTotalAmount = form.watch('totalAmount');
  const watchDownPayment = form.watch('downPayment');
  const watchInstallmentAmount = form.watch('installmentAmount');
  const watchTotalInstallments = form.watch('totalInstallments');
  const watchStartDate = form.watch('startDate');
  const watchEndDate = form.watch('endDate');

  // Helper function to get first day of next month
  const getStartDate = (): string => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // Always use next month's 1st
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    // Format as YYYY-MM-DD to avoid timezone issues
    const year = nextMonth.getFullYear();
    const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const day = String(nextMonth.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to calculate End Date based on Start Date and Total Installments
  const getEndDate = (startDateStr: string, totalInstallments: number): string => {
    if (!startDateStr || totalInstallments <= 0) return '';
    
    const startDate = new Date(startDateStr + 'T00:00:00'); // Add time to avoid timezone issues
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + totalInstallments);
    
    // Ensure it's the 1st of the month
    endDate.setDate(1);
    
    // Format as YYYY-MM-DD to avoid timezone issues
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter unit assignments for selected user
  const availableUnits = unitAssignments.filter(ua => ua.userId === watchUserId);

  // Calculate expected total
  const calculatedTotal = watchDownPayment + (watchInstallmentAmount * watchTotalInstallments);

  // DP Percentage state (local, not saved to DB)
  const [dpPercentage, setDpPercentage] = React.useState<number>(20); // Default 20%
  
  // Track previous values to detect changes and prevent infinite loops
  const prevUnitIdRef = React.useRef<number | undefined>(undefined);
  const prevTotalAmountRef = React.useRef<number>(0);
  const prevDownPaymentRef = React.useRef<number>(0);
  const prevInstallmentAmountRef = React.useRef<number>(0);
  const prevTotalInstallmentsRef = React.useRef<number>(0);
  const isCalculatingRef = React.useRef<boolean>(false);

  // Auto-fill totalAmount when unit is selected (only in create mode)
  React.useEffect(() => {
    if (watchUnitId && watchUserId && !installmentPlan) {
      const selectedUnit = unitAssignments.find(
        ua => ua.unitId === watchUnitId && ua.userId === watchUserId
      );
      // Only auto-fill if unit changed and we have a unit assignment
      if (selectedUnit && prevUnitIdRef.current !== watchUnitId) {
        form.setValue('totalAmount', selectedUnit.price);
        prevUnitIdRef.current = watchUnitId;
      }
    }
  }, [watchUnitId, watchUserId, unitAssignments, form, installmentPlan]);

  // Initialize DP percentage from existing values
  React.useEffect(() => {
    if (watchTotalAmount > 0 && watchDownPayment > 0) {
      const calculatedPercentage = (watchDownPayment / watchTotalAmount) * 100;
      setDpPercentage(calculatedPercentage);
    } else if (watchTotalAmount > 0 && watchDownPayment === 0 && !installmentPlan) {
      setDpPercentage(20); // Default 20%
    }
  }, []); // Only run once on mount

  // Auto-calculate DP when totalAmount is first set (only in create mode, initial calculation)
  React.useEffect(() => {
    if (watchTotalAmount > 0 && !installmentPlan && prevTotalAmountRef.current === 0 && watchDownPayment === 0 && !isCalculatingRef.current) {
      // Initial calculation: set DP based on percentage, then calculate Installment Amount and Total Installments
      isCalculatingRef.current = true;
      const initialDP = Math.round(watchTotalAmount * (dpPercentage / 100));
      const remaining = watchTotalAmount - initialDP;
      const defaultTotalInstallments = 25;
      const initialInstallmentAmount = Math.round(remaining / defaultTotalInstallments);
      
      form.setValue('downPayment', initialDP, { shouldValidate: false });
      form.setValue('installmentAmount', initialInstallmentAmount, { shouldValidate: false });
      form.setValue('totalInstallments', defaultTotalInstallments, { shouldValidate: false });
      
      prevDownPaymentRef.current = initialDP;
      prevInstallmentAmountRef.current = initialInstallmentAmount;
      prevTotalInstallmentsRef.current = defaultTotalInstallments;
      prevTotalAmountRef.current = watchTotalAmount;
      isCalculatingRef.current = false;
    }
  }, [watchTotalAmount, form, installmentPlan, dpPercentage, watchDownPayment]);

  // When Total Amount changes: DP tetap, recalculate Installment Amount & Total Installments
  React.useEffect(() => {
    if (watchTotalAmount > 0 && !installmentPlan && prevTotalAmountRef.current !== watchTotalAmount && prevTotalAmountRef.current > 0 && !isCalculatingRef.current) {
      isCalculatingRef.current = true;
      const currentDP = watchDownPayment; // Keep DP unchanged
      const remaining = watchTotalAmount - currentDP;
      
      if (watchTotalInstallments > 0) {
        // If Total Installments already set, recalculate Installment Amount
        const newInstallmentAmount = Math.round(remaining / watchTotalInstallments);
        form.setValue('installmentAmount', newInstallmentAmount, { shouldValidate: false });
        prevInstallmentAmountRef.current = newInstallmentAmount;
      } else if (watchInstallmentAmount > 0) {
        // If Installment Amount already set, recalculate Total Installments
        const newTotalInstallments = Math.ceil(remaining / watchInstallmentAmount);
        form.setValue('totalInstallments', newTotalInstallments, { shouldValidate: false });
        prevTotalInstallmentsRef.current = newTotalInstallments;
      } else {
        // If neither set, use default 25 months
        const defaultTotalInstallments = 25;
        const newInstallmentAmount = Math.round(remaining / defaultTotalInstallments);
        form.setValue('installmentAmount', newInstallmentAmount, { shouldValidate: false });
        form.setValue('totalInstallments', defaultTotalInstallments, { shouldValidate: false });
        prevInstallmentAmountRef.current = newInstallmentAmount;
        prevTotalInstallmentsRef.current = defaultTotalInstallments;
      }
      
      prevTotalAmountRef.current = watchTotalAmount;
      isCalculatingRef.current = false;
    }
  }, [watchTotalAmount, form, installmentPlan, watchDownPayment, watchTotalInstallments, watchInstallmentAmount]);

  // When DP changes: Update DP percentage and recalculate Installment Amount (Total Installments tetap)
  React.useEffect(() => {
    if (watchTotalAmount > 0 && watchDownPayment > 0 && prevDownPaymentRef.current !== watchDownPayment && !isCalculatingRef.current) {
      isCalculatingRef.current = true;
      isDpChangingRef.current = true; // Flag to prevent Total Installments from changing
      
      // Update DP percentage
      const newPercentage = (watchDownPayment / watchTotalAmount) * 100;
      setDpPercentage(newPercentage);
      
      // Recalculate Installment Amount (Total Installments tetap)
      const remaining = watchTotalAmount - watchDownPayment;
      if (watchTotalInstallments > 0 && remaining > 0) {
        const newInstallmentAmount = Math.round(remaining / watchTotalInstallments);
        form.setValue('installmentAmount', newInstallmentAmount, { shouldValidate: false });
        prevInstallmentAmountRef.current = newInstallmentAmount;
        isInstallmentAmountUserChange.current = false; // Mark as not user change
      }
      
      prevDownPaymentRef.current = watchDownPayment;
      isCalculatingRef.current = false;
      // Reset flag after a short delay to allow Installment Amount effect to complete
      setTimeout(() => {
        isDpChangingRef.current = false;
      }, 100);
    }
  }, [watchDownPayment, watchTotalAmount, form, watchTotalInstallments]);

  // Track if Installment Amount change is from user input (not from DP change)
  const isInstallmentAmountUserChange = React.useRef<boolean>(false);
  const isDpChangingRef = React.useRef<boolean>(false);

  // When Installment Amount changes: Recalculate Total Installments (only if user manually changed it, not from DP calculation)
  React.useEffect(() => {
    if (watchTotalAmount > 0 && watchDownPayment > 0 && watchInstallmentAmount > 0 && 
        prevInstallmentAmountRef.current !== watchInstallmentAmount && !isCalculatingRef.current && !isDpChangingRef.current) {
      // Only recalculate if this is a user-initiated change, not from DP calculation
      if (isInstallmentAmountUserChange.current) {
        isCalculatingRef.current = true;
        const remaining = watchTotalAmount - watchDownPayment;
        if (remaining > 0 && watchInstallmentAmount > 0) {
          const newTotalInstallments = Math.ceil(remaining / watchInstallmentAmount);
          form.setValue('totalInstallments', newTotalInstallments, { shouldValidate: false });
          prevTotalInstallmentsRef.current = newTotalInstallments;
        }
        isCalculatingRef.current = false;
      }
      prevInstallmentAmountRef.current = watchInstallmentAmount;
      isInstallmentAmountUserChange.current = false;
    }
  }, [watchInstallmentAmount, watchTotalAmount, watchDownPayment, form]);

  // When Total Installments changes: Recalculate Installment Amount and update End Date
  React.useEffect(() => {
    if (watchTotalAmount > 0 && watchDownPayment > 0 && watchTotalInstallments > 0 && 
        prevTotalInstallmentsRef.current !== watchTotalInstallments && !isCalculatingRef.current) {
      isCalculatingRef.current = true;
      const remaining = watchTotalAmount - watchDownPayment;
      if (remaining > 0 && watchTotalInstallments > 0) {
        const newInstallmentAmount = Math.round(remaining / watchTotalInstallments);
        form.setValue('installmentAmount', newInstallmentAmount, { shouldValidate: false });
        prevInstallmentAmountRef.current = newInstallmentAmount;
      }
      
      // Auto-update End Date based on Start Date and Total Installments
      const currentStartDate = watchStartDate || getStartDate();
      if (currentStartDate) {
        const newEndDate = getEndDate(currentStartDate, watchTotalInstallments);
        if (newEndDate) {
          form.setValue('endDate', newEndDate, { shouldValidate: false });
        }
      }
      
      prevTotalInstallmentsRef.current = watchTotalInstallments;
      isCalculatingRef.current = false;
    }
  }, [watchTotalInstallments, watchTotalAmount, watchDownPayment, watchStartDate, form]);

  // Auto-calculate Start Date on initial load (only for create mode)
  React.useEffect(() => {
    if (!installmentPlan && (!watchStartDate || watchStartDate === '')) {
      // Auto-set Start Date to first day of next month
      const autoStartDate = getStartDate();
      form.setValue('startDate', autoStartDate, { shouldValidate: false });
    }
  }, [installmentPlan, watchStartDate, form]);

  // Auto-calculate End Date when Total Installments is set (only for create mode)
  React.useEffect(() => {
    if (watchTotalInstallments > 0 && !installmentPlan) {
      const currentStartDate = watchStartDate || getStartDate();
      if (currentStartDate) {
        const autoEndDate = getEndDate(currentStartDate, watchTotalInstallments);
        if (autoEndDate && (!watchEndDate || watchEndDate === '')) {
          form.setValue('endDate', autoEndDate, { shouldValidate: false });
        }
      }
    }
  }, [watchTotalInstallments, installmentPlan, watchStartDate, watchEndDate, form]);

  // Update End Date when Start Date changes
  React.useEffect(() => {
    if (watchStartDate && watchTotalInstallments > 0) {
      const newEndDate = getEndDate(watchStartDate, watchTotalInstallments);
      if (newEndDate) {
        form.setValue('endDate', newEndDate, { shouldValidate: false });
      }
    }
  }, [watchStartDate, watchTotalInstallments, form]);

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
                <FormLabel>Unit</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                  }} 
                  value={field.value ? String(field.value) : ''}
                  disabled={!watchUserId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={watchUserId ? "Pilih unit" : "Pilih user terlebih dahulu"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableUnits.length > 0 ? (
                      availableUnits.map((unit) => (
                        <SelectItem key={unit.unitId} value={String(unit.unitId)}>
                          Unit {unit.unitId} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(unit.price)}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {watchUserId ? 'Tidak ada unit untuk user ini' : 'Pilih user terlebih dahulu'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {watchUserId ? 'Pilih unit yang sudah di-assign ke user' : 'Pilih user terlebih dahulu untuk melihat unit yang tersedia'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-5 gap-4">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Total Amount (IDR)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      type="text"
                      className="pl-10"
                      value={field.value ? formatCurrencyInput(field.value) : ''}
                      onChange={(e) => {
                        const parsed = parseCurrencyInput(e.target.value);
                        field.onChange(parsed);
                      }}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Harus sama dengan: DP + (Cicilan × Total Cicilan)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem className="col-span-1">
            <FormLabel>DP Percentage (%)</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={dpPercentage}
                  onChange={(e) => {
                    const newPercentage = parseFloat(e.target.value) || 0;
                    if (newPercentage >= 0 && newPercentage <= 100) {
                      setDpPercentage(newPercentage);
                      if (watchTotalAmount > 0 && !isCalculatingRef.current) {
                        isCalculatingRef.current = true;
                        const newDP = Math.round(watchTotalAmount * (newPercentage / 100));
                        form.setValue('downPayment', newDP, { shouldValidate: false });
                        isCalculatingRef.current = false;
                      }
                    }
                  }}
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              % dari Total
            </FormDescription>
          </FormItem>

          <FormField
            control={form.control}
            name="downPayment"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Down Payment (IDR)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      type="text"
                      className="pl-10"
                      value={field.value ? formatCurrencyInput(field.value) : ''}
                      onChange={(e) => {
                        const parsed = parseCurrencyInput(e.target.value);
                        // Validate: DP tidak boleh lebih dari Total Amount
                        if (watchTotalAmount > 0 && parsed > watchTotalAmount) {
                          form.setError('downPayment', {
                            type: 'manual',
                            message: 'Down payment tidak boleh lebih dari Total Amount',
                          });
                        } else {
                          form.clearErrors('downPayment');
                        }
                        field.onChange(parsed);
                      }}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Maksimal: {watchTotalAmount > 0 ? formatCurrencyInput(watchTotalAmount) : '0'}
                </FormDescription>
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
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      type="text"
                      className="pl-10"
                      value={field.value ? formatCurrencyInput(field.value) : ''}
                      onChange={(e) => {
                        const parsed = parseCurrencyInput(e.target.value);
                        field.onChange(parsed);
                      }}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  </div>
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
                  <Input 
                    type="date" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      // Auto-update End Date when Start Date changes
                      if (e.target.value && watchTotalInstallments > 0) {
                        const newEndDate = getEndDate(e.target.value, watchTotalInstallments);
                        if (newEndDate) {
                          form.setValue('endDate', newEndDate, { shouldValidate: false });
                        }
                      }
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Otomatis: Tanggal 1 bulan depan
                </FormDescription>
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
                  <Input 
                    type="date" 
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Otomatis: Tanggal 1 bulan ke-{watchTotalInstallments || 0} dari Start Date
                </FormDescription>
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













