'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
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
import { useToast } from '@/hooks/use-toast';
import { addUnitAssignment, removeUnitAssignment } from '@/lib/actions/project.actions';
import { unitAssignmentSchema } from '@/lib/validations/project.schema';
import type { User, UnitAssignment, Property } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface UnitAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: User[];
  assignment?: UnitAssignment & { unitId: number }; // Optional untuk edit mode
  property?: Property; // Property info untuk mendapatkan totalUnits dan unitName
  assignedUnitIds?: number[]; // Unit IDs yang sudah di-assign
  onSuccess: () => void | Promise<void>;
}

const formSchema = unitAssignmentSchema;

type FormValues = z.infer<typeof formSchema>;

export function UnitAssignmentDialog({
  open,
  onOpenChange,
  projectId,
  members,
  assignment,
  property,
  assignedUnitIds = [],
  onSuccess,
}: UnitAssignmentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!assignment;

  // Calculate available units
  const getAvailableUnits = (): number[] => {
    if (!property?.totalUnits) {
      return [];
    }

    // Exclude assigned units, but include current unit if editing
    const excludedUnitIds = isEditing && assignment
      ? assignedUnitIds.filter(id => id !== assignment.unitId)
      : assignedUnitIds;

    const available: number[] = [];
    for (let i = 1; i <= property.totalUnits; i++) {
      if (!excludedUnitIds.includes(i)) {
        available.push(i);
      }
    }
    return available;
  };

  const availableUnits = getAvailableUnits();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      userId: '',
      unitId: 1,
      price: 0,
      size: undefined,
    },
  });

  // Update form when assignment changes (for edit mode)
  useEffect(() => {
    if (assignment) {
      form.reset({
        projectId,
        userId: assignment.userId,
        unitId: assignment.unitId,
        price: assignment.price,
        size: assignment.size,
      });
    } else {
      form.reset({
        projectId,
        userId: '',
        unitId: 1,
        price: 0,
        size: undefined,
      });
    }
  }, [assignment, projectId, form]);

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // For edit mode, we need to remove old assignment first, then add new one
      if (isEditing && assignment) {
        const oldUnitId = assignment.unitId;
        const removeResult = await removeUnitAssignment(projectId, oldUnitId);
        if (!removeResult.success) {
          toast({
            title: 'Gagal',
            description: 'Gagal menghapus unit assignment lama',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const result = await addUnitAssignment(data);

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: isEditing
            ? 'Unit assignment berhasil diupdate'
            : 'Unit assignment berhasil ditambahkan',
        });
        await onSuccess();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: result.error?.message || 'Gagal menyimpan unit assignment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving unit assignment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Unit Assignment' : 'Tambah Unit Assignment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update informasi unit assignment'
              : 'Tambahkan unit assignment baru ke project'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Anggota <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih anggota" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
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
                  <FormLabel>
                    Unit <span className="text-destructive">*</span>
                  </FormLabel>
                  {property?.totalUnits && availableUnits.length > 0 ? (
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((unitId) => (
                          <SelectItem key={unitId} value={unitId.toString()}>
                            {property.unitName} {unitId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : property?.totalUnits && availableUnits.length === 0 ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled
                      />
                      <p className="text-sm text-muted-foreground">
                        Semua unit sudah di-assign. Tidak ada unit tersedia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Property tidak memiliki informasi total units. Silakan input unit ID secara manual.
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Harga <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
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
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ukuran (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

