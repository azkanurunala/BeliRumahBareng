'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import type { Project, Property, User } from '@/lib/types';
import { useAdminData } from '@/contexts/admin-data-context';
import { Plus, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';

const progressChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label wajib diisi'),
  completedMembers: z.array(z.string()),
  order: z.number().optional(),
});

const milestoneSchema = z.object({
  label: z.string().min(1, 'Label wajib diisi'),
  date: z.string().optional(),
  status: z.enum(['completed', 'pending', 'upcoming']),
});

const progressDetailSchema = z.object({
  title: z.string().min(1, 'Title wajib diisi'),
  percentage: z.number().min(0).max(100),
  description: z.string().optional(),
  checklist: z.array(progressChecklistItemSchema),
  completedMembers: z.array(z.string()),
  milestones: z.array(milestoneSchema).optional(),
  notes: z.string().optional(),
});

const projectSchema = z.object({
  propertyId: z.string().min(1, 'Property wajib dipilih'),
  members: z.array(z.string()).min(1, 'Minimal 1 member diperlukan'),
  unitAssignments: z.array(z.object({
    userId: z.string().min(1, 'User wajib dipilih'),
    unitId: z.number().min(1, 'Unit ID harus lebih dari 0'),
    price: z.number().min(1, 'Harga harus lebih dari 0'),
    size: z.number().optional(),
  })),
  progress: z.object({
    kyc: z.number().min(0).max(100),
    funding: z.number().min(0).max(100),
    legal: z.number().min(0).max(100),
    closing: z.number().min(0).max(100),
  }),
  progressDetails: z.object({
    kyc: progressDetailSchema,
    funding: progressDetailSchema,
    legal: progressDetailSchema,
    closing: progressDetailSchema,
  }),
  status: z.enum(['active', 'closed', 'completed']).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (data: ProjectFormValues) => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, onSubmit, onCancel }: ProjectFormProps) {
  const { properties, users } = useAdminData();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          propertyId: project.propertyId,
          members: project.members.map(m => m.id),
          unitAssignments: project.unitAssignments,
          progress: project.progress,
          progressDetails: project.progressDetails,
          status: project.status || 'active',
        }
      : {
          propertyId: '',
          members: [],
          unitAssignments: [],
          progress: {
            kyc: 0,
            funding: 0,
            legal: 0,
            closing: 0,
          },
          progressDetails: {
            kyc: {
              title: 'Verifikasi KYC',
              percentage: 0,
              description: 'Proses verifikasi identitas dan dokumen KYC untuk semua anggota grup.',
              checklist: [],
              completedMembers: [],
            },
            funding: {
              title: 'Pendanaan Grup',
              percentage: 0,
              description: 'Pengumpulan dana dari semua anggota untuk pembelian properti.',
              checklist: [],
              completedMembers: [],
            },
            legal: {
              title: 'Legal & Dokumentasi',
              percentage: 0,
              description: 'Proses legal dan penyelesaian dokumen kepemilikan.',
              checklist: [],
              completedMembers: [],
            },
            closing: {
              title: 'Penutupan',
              percentage: 0,
              description: 'Proses akhir penutupan transaksi dan serah terima properti.',
              checklist: [],
              completedMembers: [],
            },
          },
          status: 'active',
        },
  });

  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({
    control: form.control,
    name: 'unitAssignments',
  });

  const selectedProperty = properties.find(p => p.id === form.watch('propertyId'));
  const selectedMembers = form.watch('members');
  const isFlexible = selectedProperty && !selectedProperty.totalUnits && selectedProperty.totalArea;

  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Dasar</TabsTrigger>
            <TabsTrigger value="members">Anggota</TabsTrigger>
            <TabsTrigger value="units">Unit</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedProperty && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Property Terpilih</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{selectedProperty.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProperty.location}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {selectedProperty.type === 'co-building' ? 'Co-Building' : 'Co-Owning'}
                    </p>
                    {isFlexible && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                        Model Fleksibel
                      </span>
                    )}
                  </div>
                  {isFlexible && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Total Luas: {selectedProperty.totalArea}{selectedProperty.unitMeasure}
                    </p>
                  )}
                  {!isFlexible && selectedProperty.totalUnits && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Total Unit: {selectedProperty.totalUnits} {selectedProperty.unitName}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <FormField
              control={form.control}
              name="members"
              render={() => (
                <FormItem>
                  <FormLabel>Anggota Project</FormLabel>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="members"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={user.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, user.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== user.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({user.profile.locationPreference})
                                </span>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            {isFlexible && (
              <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-300">
                <strong>Model Fleksibel:</strong> Untuk properti dengan model fleksibel, unitId digunakan sebagai nomor urut investor. 
                Pembagian luas dan harga akan ditentukan berdasarkan jumlah investor final.
              </div>
            )}
            <div className="space-y-4">
              {unitFields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Unit Assignment {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUnit(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`unitAssignments.${index}.userId`}
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
                              {selectedMembers.map((memberId) => {
                                const user = users.find(u => u.id === memberId);
                                return user ? (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ) : null;
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`unitAssignments.${index}.unitId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {isFlexible ? 'Nomor Urut' : selectedProperty?.unitName || 'Unit ID'}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {isFlexible 
                                ? 'Nomor urut investor (untuk model fleksibel)'
                                : `ID ${selectedProperty?.unitName || 'unit'} yang dialokasikan`
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`unitAssignments.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Harga</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                value={field.value ? formatCurrencyInput(field.value) : ''}
                                onChange={(e) => {
                                  const parsed = parseCurrencyInput(e.target.value);
                                  field.onChange(parsed);
                                }}
                                onBlur={field.onBlur}
                                placeholder="Contoh: 1.800.000.000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`unitAssignments.${index}.size`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ukuran (Opsional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendUnit({ userId: '', unitId: 1, price: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Unit Assignment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {(['kyc', 'funding', 'legal', 'closing'] as const).map((stage) => (
              <Card key={stage}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{stage}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`progress.${stage}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Progress (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`progressDetails.${stage}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`progressDetails.${stage}.percentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`progressDetails.${stage}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`progressDetails.${stage}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Active: Proyek sedang berjalan. Closed: Proyek ditutup, cicilan aktif. Completed: Proyek selesai sepenuhnya.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

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

