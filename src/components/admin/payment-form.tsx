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
import { useState } from 'react';
import { FileText, X } from 'lucide-react';

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
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
}).refine((data) => {
  // If payment method is transfer, require either receiptUrl or paymentReference
  if (data.paymentMethod === 'transfer') {
    return !!(data.receiptUrl?.trim() || data.paymentReference?.trim());
  }
  return true;
}, {
  message: 'Untuk transfer, wajib upload bukti pembayaran atau isi nomor referensi pembayaran',
  path: ['paymentReference'],
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  payment?: MonthlyPayment;
  projectMembers: User[];
  onSubmit: (data: PaymentFormValues) => void;
  onCancel?: () => void;
}

export function PaymentForm({ payment, projectMembers, onSubmit, onCancel }: PaymentFormProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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
          paymentReference: payment.paymentReference || '',
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
          paymentReference: '',
          notes: '',
          verifiedBy: '',
          verifiedAt: '',
        },
  });

  const watchStatus = form.watch('status');
  const watchPaymentMethod = form.watch('paymentMethod');
  const watchReceiptUrl = form.watch('receiptUrl');
  const watchPaymentReference = form.watch('paymentReference');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
          // Also set the receiptUrl in the form
          form.setValue('receiptUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
        // For PDFs, we'll still set it as data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          form.setValue('receiptUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    form.setValue('receiptUrl', '');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFormSubmit = async (data: PaymentFormValues) => {
    // If there's a new file, convert it to data URL
    if (receiptFile && !data.receiptUrl) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(receiptFile);
        });
        data.receiptUrl = dataUrl;
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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

        {/* Payment Reference - shown when method is transfer */}
        {watchPaymentMethod === 'transfer' && (
          <FormField
            control={form.control}
            name="paymentReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nomor Referensi Pembayaran {!watchReceiptUrl && '(Wajib jika tidak upload bukti)'}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Masukkan nomor referensi transfer (opsional jika sudah upload bukti)"
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Untuk transfer, wajib upload bukti pembayaran atau isi nomor referensi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Receipt Upload or URL */}
        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bukti Pembayaran {watchPaymentMethod === 'transfer' && !watchPaymentReference?.trim() && '(Wajib jika tidak isi referensi)'}
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {!receiptFile && !receiptPreview && (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <div className="text-xs text-muted-foreground">Atau masukkan URL</div>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://example.com/receipt.pdf"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value) {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                          }
                        }}
                      />
                    </div>
                  )}
                  {(receiptFile || receiptPreview) && (
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {receiptFile?.name || 'File terupload'}
                            </p>
                            {receiptFile && (
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(receiptFile.size)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {receiptPreview && (
                        <div className="mt-3 rounded-md overflow-hidden border">
                          <img
                            src={receiptPreview}
                            alt="Preview bukti pembayaran"
                            className="w-full h-auto max-h-48 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Format yang didukung: JPG, PNG, PDF (maks. 5MB) atau URL
              </FormDescription>
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






