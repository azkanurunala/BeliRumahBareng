'use client';

import { useState, useRef, useEffect } from 'react';
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
import type { Property } from '@/lib/types';
import { Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';

const propertySchema = z.object({
  name: z.string().min(1, 'Nama properti wajib diisi'),
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  price: z.number().min(1, 'Harga harus lebih dari 0'),
  location: z.string().min(1, 'Lokasi wajib diisi'),
  type: z.enum(['co-building', 'co-owning'], {
    required_error: 'Tipe properti wajib dipilih',
  }),
  totalArea: z.number().optional(),
  buildingArea: z.number().optional(),
  totalUnits: z.number().optional(),
  unitName: z.enum(['Lantai', 'Kavling', 'Kepemilikan']).optional(),
  unitSize: z.number().optional(),
  unitMeasure: z.string().optional(),
  plots: z.array(z.object({
    size: z.number().min(0, 'Ukuran harus positif'),
    price: z.number().min(0, 'Harga harus positif'),
  })).optional(),
  units: z.array(z.object({
    size: z.number().min(0, 'Ukuran harus positif'),
    price: z.number().min(0, 'Harga harus positif'),
  })).optional(),
  images: z.array(z.object({
    url: z.string().min(1, 'URL gambar wajib diisi'),
    hint: z.string().optional(),
  })).min(1, 'Minimal 1 gambar diperlukan'),
  planningInfo: z.object({
    sitePlanUrl: z.string().optional(),
    sitePlanHint: z.string().optional(),
    developmentPlan: z.string().optional(),
    environmentalAnalysis: z.string().optional(),
  }).optional(),
}).refine((data) => {
  // Co-Building: wajib totalArea (Luas Lahan), totalUnits, dan units array
  if (data.type === 'co-building') {
    return data.totalArea !== undefined && data.totalArea > 0 &&
           data.totalUnits !== undefined && data.totalUnits > 0 &&
           data.units !== undefined && data.units.length === data.totalUnits &&
           data.units.every(unit => unit.size > 0 && unit.price > 0);
  }
  return true;
}, {
  message: 'Luas Lahan, Total Unit, dan Data per Unit wajib diisi untuk tipe co-building',
  path: ['units'],
}).refine((data) => {
  // Co-Owning: wajib totalArea (Luas Lahan), totalUnits, dan plots
  if (data.type === 'co-owning') {
    const hasTotalArea = data.totalArea !== undefined && data.totalArea > 0;
    const hasTotalUnits = data.totalUnits !== undefined && data.totalUnits > 0;
    const hasPlots = data.plots !== undefined && data.plots.length === (data.totalUnits || 0);
    // Jika tidak flexible (ada totalUnits), wajib totalArea dan plots
    if (data.totalUnits && data.totalUnits > 0) {
      return hasTotalArea && hasPlots;
    }
    // Jika flexible (tidak ada totalUnits), hanya wajib totalArea
    return hasTotalArea;
  }
  return true;
}, {
  message: 'Luas Lahan wajib diisi untuk tipe co-owning',
  path: ['totalArea'],
});

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: PropertyFormValues) => void;
  onCancel?: () => void;
}

export function PropertyForm({ property, onSubmit, onCancel }: PropertyFormProps) {
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; hint: string }>>(
    property?.images || []
  );
  const [uploadedSitePlan, setUploadedSitePlan] = useState<{ url: string; hint: string } | null>(
    property?.planningInfo?.sitePlanUrl ? {
      url: property.planningInfo.sitePlanUrl,
      hint: property.planningInfo.sitePlanHint || '',
    } : null
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingSitePlan, setIsUploadingSitePlan] = useState(false);
  const imagesFileInputRef = useRef<HTMLInputElement>(null);
  const sitePlanFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
        defaultValues: property
      ? {
          name: property.name,
          description: property.description,
          price: property.price,
          location: property.location,
          type: property.type,
          totalArea: property.totalArea,
          buildingArea: property.buildingArea,
          totalUnits: property.totalUnits,
          unitName: property.unitName,
          unitSize: property.unitSize,
          unitMeasure: property.unitMeasure,
          images: property.images,
          planningInfo: property.planningInfo,
          plots: property.totalUnits && property.type === 'co-owning' 
            ? (property.unitPrices && property.unitPrices.length > 0
                ? property.unitPrices.map(plot => ({
                    size: plot.size || 0,
                    price: plot.price || 0,
                  }))
                : Array.from({ length: property.totalUnits }, (_, i) => ({
                    size: property.unitSize || 0,
                    price: property.price / (property.totalUnits || 1),
                  })))
            : undefined,
          units: property.totalUnits && property.type === 'co-building'
            ? (property.unitPrices && property.unitPrices.length > 0
                ? property.unitPrices.map(unit => ({
                    size: unit.size || 0,
                    price: unit.price || 0,
                  }))
                : Array.from({ length: property.totalUnits }, (_, i) => ({
                    size: property.unitSize || 0,
                    price: property.price / (property.totalUnits || 1),
                  })))
            : undefined,
        }
      : {
          name: '',
          description: '',
          price: 0,
          location: '',
          type: 'co-owning',
          images: [],
          plots: [],
          units: [],
        },
  });

  const watchType = form.watch('type');
  const watchTotalUnits = form.watch('totalUnits');
  const watchBuildingArea = form.watch('buildingArea');
  const watchUnitSize = form.watch('unitSize');
  const watchPrice = form.watch('price');
  const watchTotalArea = form.watch('totalArea');
  
  const { fields: plotFields, append: appendPlot, remove: removePlot } = useFieldArray({
    control: form.control,
    name: 'plots',
  });

  const { fields: unitFields, append: appendUnit, remove: removeUnit } = useFieldArray({
    control: form.control,
    name: 'units',
  });

  // Initialize plots when totalUnits changes for co-owning
  useEffect(() => {
    if (watchType === 'co-owning' && watchTotalUnits && watchTotalUnits > 0) {
      const currentPlots = form.getValues('plots') || [];
      if (currentPlots.length !== watchTotalUnits) {
        const newPlots = Array.from({ length: watchTotalUnits }, (_, i) => 
          currentPlots[i] || { size: 0, price: 0 }
        );
        form.setValue('plots', newPlots);
      }
    }
  }, [watchType, watchTotalUnits, form]);

  // Initialize units when totalUnits changes for co-building
  useEffect(() => {
    if (watchType === 'co-building' && watchTotalUnits && watchTotalUnits > 0) {
      const currentUnits = form.getValues('units') || [];
      if (currentUnits.length !== watchTotalUnits) {
        const newUnits = Array.from({ length: watchTotalUnits }, (_, i) => 
          currentUnits[i] || { size: 0, price: 0 }
        );
        form.setValue('units', newUnits);
      }
    }
  }, [watchType, watchTotalUnits, form]);

  // Auto-calculate buildingArea from sum of unit sizes (co-building)
  useEffect(() => {
    if (watchType === 'co-building' && unitFields.length > 0) {
      const totalSize = unitFields.reduce((sum, _, index) => {
        const unitSize = form.getValues(`units.${index}.size`) || 0;
        return sum + unitSize;
      }, 0);
      const currentBuildingArea = form.getValues('buildingArea') || 0;
      // Only update if the calculated value is significantly different (avoid infinite loops)
      // This allows auto-calculate from units when units change
      if (totalSize > 0 && Math.abs(currentBuildingArea - totalSize) > 0.01) {
        form.setValue('buildingArea', totalSize);
      }
    }
  }, [unitFields, watchType, form]);

  // Auto-calculate total price from plots/units
  useEffect(() => {
    if (watchType === 'co-owning' && plotFields.length > 0) {
      const totalPrice = plotFields.reduce((sum, _, index) => {
        const plotPrice = form.getValues(`plots.${index}.price`) || 0;
        return sum + plotPrice;
      }, 0);
      const currentPrice = form.getValues('price') || 0;
      // Only update if the calculated value is significantly different (avoid infinite loops)
      if (Math.abs(currentPrice - totalPrice) > 0.01) {
        form.setValue('price', totalPrice);
      }
    } else if (watchType === 'co-building' && unitFields.length > 0) {
      const totalPrice = unitFields.reduce((sum, _, index) => {
        const unitPrice = form.getValues(`units.${index}.price`) || 0;
        return sum + unitPrice;
      }, 0);
      const currentPrice = form.getValues('price') || 0;
      // Only update if the calculated value is significantly different (avoid infinite loops)
      if (Math.abs(currentPrice - totalPrice) > 0.01) {
        form.setValue('price', totalPrice);
      }
    }
  }, [plotFields, unitFields, watchType, form]);

  // Auto-calculate totalArea from sum of plot sizes (co-owning)
  useEffect(() => {
    if (watchType === 'co-owning' && plotFields.length > 0) {
      const totalSize = plotFields.reduce((sum, _, index) => {
        const plotSize = form.getValues(`plots.${index}.size`) || 0;
        return sum + plotSize;
      }, 0);
      const currentTotalArea = form.getValues('totalArea') || 0;
      // Only update if the calculated value is significantly different (avoid infinite loops)
      if (Math.abs(currentTotalArea - totalSize) > 0.01) {
        form.setValue('totalArea', totalSize);
      }
    }
  }, [plotFields, watchType, form]);

  // Sync total price to plots/units proportionally when manually edited
  useEffect(() => {
    if (watchType === 'co-owning' && plotFields.length > 0 && watchPrice && watchPrice > 0) {
      const currentTotal = plotFields.reduce((sum, _, index) => {
        return sum + (form.getValues(`plots.${index}.price`) || 0);
      }, 0);
      // Only sync if there's a significant difference (user manually edited total)
      if (currentTotal > 0 && Math.abs(currentTotal - watchPrice) > 0.01) {
        // Distribute proportionally based on current ratios
        plotFields.forEach((_, index) => {
          const currentPlotPrice = form.getValues(`plots.${index}.price`) || 0;
          const ratio = currentTotal > 0 ? currentPlotPrice / currentTotal : 1 / plotFields.length;
          form.setValue(`plots.${index}.price`, watchPrice * ratio);
        });
      }
    } else if (watchType === 'co-building' && unitFields.length > 0 && watchPrice && watchPrice > 0) {
      const currentTotal = unitFields.reduce((sum, _, index) => {
        return sum + (form.getValues(`units.${index}.price`) || 0);
      }, 0);
      // Only sync if there's a significant difference (user manually edited total)
      if (currentTotal > 0 && Math.abs(currentTotal - watchPrice) > 0.01) {
        // Distribute proportionally based on current ratios
        unitFields.forEach((_, index) => {
          const currentUnitPrice = form.getValues(`units.${index}.price`) || 0;
          const ratio = currentTotal > 0 ? currentUnitPrice / currentTotal : 1 / unitFields.length;
          form.setValue(`units.${index}.price`, watchPrice * ratio);
        });
      }
    }
  }, [watchPrice, plotFields, unitFields, watchType, form]);

  // Sync totalArea to plots proportionally when manually edited (co-owning)
  useEffect(() => {
    if (watchType === 'co-owning' && plotFields.length > 0 && watchTotalArea && watchTotalArea > 0) {
      const currentTotal = plotFields.reduce((sum, _, index) => {
        return sum + (form.getValues(`plots.${index}.size`) || 0);
      }, 0);
      // Only sync if there's a significant difference (user manually edited total)
      if (currentTotal > 0 && Math.abs(currentTotal - watchTotalArea) > 0.01) {
        // Distribute proportionally based on current ratios
        plotFields.forEach((_, index) => {
          const currentPlotSize = form.getValues(`plots.${index}.size`) || 0;
          const ratio = currentTotal > 0 ? currentPlotSize / currentTotal : 1 / plotFields.length;
          form.setValue(`plots.${index}.size`, watchTotalArea * ratio);
        });
      }
    }
  }, [watchTotalArea, plotFields, watchType, form]);

  // Sync buildingArea to units proportionally when manually edited (co-building)
  useEffect(() => {
    if (watchType === 'co-building' && unitFields.length > 0 && watchBuildingArea && watchBuildingArea > 0) {
      const currentTotal = unitFields.reduce((sum, _, index) => {
        return sum + (form.getValues(`units.${index}.size`) || 0);
      }, 0);
      // Only sync if there's a significant difference (user manually edited total)
      if (currentTotal > 0 && Math.abs(currentTotal - watchBuildingArea) > 0.01) {
        // Distribute proportionally based on current ratios
        unitFields.forEach((_, index) => {
          const currentUnitSize = form.getValues(`units.${index}.size`) || 0;
          const ratio = currentTotal > 0 ? currentUnitSize / currentTotal : 1 / unitFields.length;
          form.setValue(`units.${index}.size`, watchBuildingArea * ratio);
        });
      }
    }
  }, [watchBuildingArea, unitFields, watchType, form]);

  // Update form when uploadedImages change
  useEffect(() => {
    if (uploadedImages.length > 0) {
      form.setValue('images', uploadedImages);
    }
  }, [uploadedImages, form]);

  // Update form when uploadedSitePlan change
  useEffect(() => {
    if (uploadedSitePlan) {
      form.setValue('planningInfo.sitePlanUrl', uploadedSitePlan.url);
      form.setValue('planningInfo.sitePlanHint', uploadedSitePlan.hint);
    }
  }, [uploadedSitePlan, form]);

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedImages((prev) => [...prev, ...result.data]);
        form.setValue('images', [...uploadedImages, ...result.data]);
        toast({
          title: 'Berhasil',
          description: `${result.data.length} gambar berhasil diupload`,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload gambar',
      });
    } finally {
      setIsUploadingImages(false);
      if (imagesFileInputRef.current) {
        imagesFileInputRef.current.value = '';
      }
    }
  };

  const handleSitePlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSitePlan(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedSitePlan(result.data);
        form.setValue('planningInfo.sitePlanUrl', result.data.url);
        form.setValue('planningInfo.sitePlanHint', result.data.hint);
        toast({
          title: 'Berhasil',
          description: 'Denah lokasi berhasil diupload',
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading site plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload denah',
      });
    } finally {
      setIsUploadingSitePlan(false);
      if (sitePlanFileInputRef.current) {
        sitePlanFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  const handleRemoveSitePlan = () => {
    setUploadedSitePlan(null);
    form.setValue('planningInfo.sitePlanUrl', '');
    form.setValue('planningInfo.sitePlanHint', '');
  };

  const handleSubmit = (data: PropertyFormValues) => {
    // Validate images
    if (uploadedImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Minimal 1 gambar diperlukan',
      });
      return;
    }

    // Use uploaded images
    data.images = uploadedImages;

    // Use uploaded site plan if available
    if (uploadedSitePlan) {
      if (!data.planningInfo) {
        data.planningInfo = {
          sitePlanUrl: '',
          sitePlanHint: '',
          developmentPlan: '',
          environmentalAnalysis: '',
        };
      }
      data.planningInfo.sitePlanUrl = uploadedSitePlan.url;
      data.planningInfo.sitePlanHint = uploadedSitePlan.hint;
    }

    // Ensure totalArea and buildingArea are included in the data
    // These are already in the form data, but we ensure they're properly formatted
    if (data.totalArea !== undefined) {
      data.totalArea = Number(data.totalArea);
    }
    if (data.buildingArea !== undefined) {
      data.buildingArea = Number(data.buildingArea);
    }

    // Auto-set unitName berdasarkan tipe
    if (data.type === 'co-building') {
      data.unitName = 'Lantai';
      // Process units array untuk co-building
      if (data.units && data.units.length > 0) {
        const totalPrice = data.units.reduce((sum, unit) => sum + (unit.price || 0), 0);
        const totalSize = data.units.reduce((sum, unit) => sum + (unit.size || 0), 0);
        data.price = totalPrice;
        // Use manual buildingArea if provided, otherwise use calculated from sum of unit sizes
        if (!data.buildingArea || data.buildingArea === 0) {
          data.buildingArea = totalSize;
        }
        // Store individual unit prices and sizes
        (data as any).unitPrices = data.units;
      }
      // Remove units from final data as it's not part of Property type
      delete (data as any).units;
    } else if (data.type === 'co-owning') {
      data.unitName = 'Kavling';
      // Calculate average unitSize and total price from plots
      if (data.plots && data.plots.length > 0) {
        const totalSize = data.plots.reduce((sum, plot) => sum + (plot.size || 0), 0);
        const totalPrice = data.plots.reduce((sum, plot) => sum + (plot.price || 0), 0);
        data.unitSize = totalSize / data.plots.length;
        data.price = totalPrice;
        // Store individual plot prices and sizes
        (data as any).unitPrices = data.plots;
      }
      // Remove plots from final data as it's not part of Property type
      delete (data as any).plots;
    }
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
              <FormLabel>Nama Properti</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokasi</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Properti</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe properti" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="co-building">Bangunan</SelectItem>
                  <SelectItem value="co-owning">Lahan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchType === 'co-building' && (
          <>
            <FormField
              control={form.control}
              name="totalUnits"
              render={({ field }) => {
                const { value, onChange, onBlur, ...restField } = field;
                return (
                  <FormItem>
                    <FormLabel>Total Unit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...restField}
                        value={value ?? ''}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          onChange(newValue);
                          form.setValue('unitName', 'Lantai');
                          // Initialize units array
                          if (newValue > 0) {
                            const currentUnits = form.getValues('units') || [];
                            const newUnits = Array.from({ length: newValue }, (_, i) => 
                              currentUnits[i] || { size: 0, price: 0 }
                            );
                            form.setValue('units', newUnits);
                          }
                        }}
                        onBlur={onBlur}
                      />
                    </FormControl>
                    <FormDescription>
                      Jumlah unit yang akan dibangun
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {watchTotalUnits && watchTotalUnits > 0 && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">Data per Unit</FormLabel>
                </div>
                <div className="space-y-3">
                  {unitFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                      <div className="font-medium text-sm">Unit {index + 1}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`units.${index}.size`}
                          render={({ field }) => {
                            const { value, onChange, onBlur, ...restField } = field;
                            return (
                              <FormItem>
                                <FormLabel className="text-xs">Luas (m²)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...restField}
                                    value={value ?? ''}
                                    onChange={(e) => {
                                      const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                      onChange(newValue);
                                    }}
                                    onBlur={onBlur}
                                    placeholder="0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name={`units.${index}.price`}
                          render={({ field }) => {
                            const { value, onChange, onBlur, ...restField } = field;
                            return (
                              <FormItem>
                                <FormLabel className="text-xs">Harga</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    {...restField}
                                    value={value ? value.toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\./g, '');
                                      const numValue = parseFloat(value) || 0;
                                      onChange(numValue);
                                    }}
                                    onBlur={onBlur}
                                    placeholder="0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <FormLabel className="text-base font-semibold">Total</FormLabel>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => {
                    const { value, onChange, onBlur, ...restField } = field;
                    return (
                      <FormItem>
                        <FormLabel>Luas Lahan (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...restField}
                            value={value ?? ''}
                            onChange={(e) => {
                              const newValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              onChange(newValue);
                            }}
                            onBlur={onBlur}
                            placeholder="Contoh: 1000"
                          />
                        </FormControl>
                        <FormDescription>
                          Total luas lahan properti
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="buildingArea"
                  render={({ field }) => {
                    const { value, onChange, onBlur, ...restField } = field;
                    return (
                      <FormItem>
                        <FormLabel>Luas Bangunan (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...restField}
                            value={value ?? ''}
                            onChange={(e) => {
                              const newValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              onChange(newValue);
                            }}
                            onBlur={onBlur}
                            placeholder="Akan terhitung otomatis"
                          />
                        </FormControl>
                        <FormDescription>
                          Total luas bangunan (akan terhitung otomatis dari jumlah semua unit)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Total (IDR)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={field.value ? formatCurrencyInput(field.value) : ''}
                          onChange={(e) => {
                            const parsed = parseCurrencyInput(e.target.value);
                            field.onChange(parsed);
                          }}
                          onBlur={field.onBlur}
                          placeholder="Akan terhitung otomatis"
                        />
                      </FormControl>
                      <FormDescription>
                        Total harga (akan terhitung otomatis dari jumlah semua unit)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {watchType === 'co-owning' && (
          <>
            <FormField
              control={form.control}
              name="totalUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Unit (Kavling)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                        form.setValue('unitName', 'Kavling');
                        // Initialize plots array
                        if (value > 0) {
                          const currentPlots = form.getValues('plots') || [];
                          const newPlots = Array.from({ length: value }, (_, i) => 
                            currentPlots[i] || { size: 0, price: 0 }
                          );
                          form.setValue('plots', newPlots);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Jumlah kavling yang akan dibagi
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchTotalUnits && watchTotalUnits > 0 && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">Data per Kavling</FormLabel>
                </div>
                <div className="space-y-3">
                  {plotFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                      <div className="font-medium text-sm">Kavling {index + 1}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`plots.${index}.size`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Ukuran (m²)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  value={field.value || ''}
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`plots.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Harga</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  value={field.value ? field.value.toLocaleString('id-ID') : ''}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\./g, '');
                                    const numValue = parseFloat(value) || 0;
                                    field.onChange(numValue);
                                  }}
                                  onBlur={field.onBlur}
                                  placeholder="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Section */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
              <FormLabel className="text-base font-semibold">Total</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => {
                    const { value, onChange, onBlur, ...restField } = field;
                    return (
                      <FormItem>
                        <FormLabel>Luas Lahan (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...restField}
                            value={value ?? ''}
                            onChange={(e) => {
                              const newValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              onChange(newValue);
                            }}
                            onBlur={onBlur}
                            placeholder="Akan terhitung otomatis"
                          />
                        </FormControl>
                        <FormDescription>
                          Total luas lahan (akan terhitung otomatis dari jumlah semua kavling)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Total (IDR)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={field.value ? formatCurrencyInput(field.value) : ''}
                          onChange={(e) => {
                            const parsed = parseCurrencyInput(e.target.value);
                            field.onChange(parsed);
                          }}
                          onBlur={field.onBlur}
                          placeholder="Akan terhitung otomatis"
                        />
                      </FormControl>
                      <FormDescription>
                        Total harga (akan terhitung otomatis dari jumlah semua kavling)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-4">
          <FormLabel>Gambar Properti</FormLabel>
          <div className="space-y-4">
            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={image.url}
                        alt={image.hint || `Gambar ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {image.hint && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{image.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div>
              <input
                ref={imagesFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImagesUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imagesFileInputRef.current?.click()}
                disabled={isUploadingImages}
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Gambar
                  </>
                )}
              </Button>
              <FormDescription className="mt-2">
                Upload gambar properti (JPEG, PNG, WebP). Maksimal 5MB per gambar.
              </FormDescription>
            </div>
          </div>
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Informasi Perencanaan (Opsional)</FormLabel>
          
          {/* Site Plan Upload */}
          <div className="space-y-2">
            <FormLabel>Denah Lokasi</FormLabel>
            {uploadedSitePlan ? (
              <div className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={uploadedSitePlan.url}
                    alt={uploadedSitePlan.hint || 'Denah lokasi'}
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveSitePlan}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadedSitePlan.hint && (
                  <p className="text-xs text-muted-foreground mt-1">{uploadedSitePlan.hint}</p>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={sitePlanFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleSitePlanUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => sitePlanFileInputRef.current?.click()}
                  disabled={isUploadingSitePlan}
                >
                  {isUploadingSitePlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload Denah Lokasi
                    </>
                  )}
                </Button>
                <FormDescription className="mt-2">
                  Upload denah lokasi (JPEG, PNG, WebP). Maksimal 5MB.
                </FormDescription>
              </div>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="planningInfo.sitePlanHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hint Denah (Opsional)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Deskripsi singkat denah"
                    onChange={(e) => {
                      field.onChange(e);
                      if (uploadedSitePlan) {
                        setUploadedSitePlan({ ...uploadedSitePlan, hint: e.target.value });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planningInfo.developmentPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rencana Pengembangan</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} rows={6} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="planningInfo.environmentalAnalysis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Analisis Lingkungan</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value || ''} rows={6} />
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

