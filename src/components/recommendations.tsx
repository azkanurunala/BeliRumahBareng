'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getRecommendationsAction } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { PersonalizedPropertyRecommendationsOutput } from '@/ai/flows/personalized-property-recommendations';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
  minPrice: z.coerce.number().min(0, { message: 'Minimum price must be positive.' }),
  maxPrice: z.coerce.number().min(0, { message: 'Maximum price must be positive.' }),
  investmentGoals: z.string().min(10, { message: 'Goals must be at least 10 characters.' }),
}).refine(data => data.maxPrice > data.minPrice, {
    message: "Maximum price must be greater than minimum price.",
    path: ["maxPrice"],
});

export default function Recommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedPropertyRecommendationsOutput['recommendations']>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      location: 'Surabaya',
      minPrice: 300000000,
      maxPrice: 800000000,
      investmentGoals: 'A first home for my young family with long-term capital appreciation.',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setRecommendations([]);
    const result = await getRecommendationsAction({
        location: data.location,
        priceRange: { min: data.minPrice, max: data.maxPrice },
        investmentGoals: data.investmentGoals
    });

    if (result.success && result.data) {
        setRecommendations(result.data.recommendations);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "An unknown error occurred.",
        });
    }
    setIsLoading(false);
  }

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(price);

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <p className="text-muted-foreground">
        Enter your preferences below and our AI will find properties that are a great fit for you.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jakarta, Bandung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="minPrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Min Price (IDR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 300000000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="maxPrice"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Max Price (IDR)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </div>
          <FormField
            control={form.control}
            name="investmentGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Investment Goals</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Long-term rental, first home" {...field} />
                </FormControl>
                <FormDescription>
                  Describe what you're looking for in a property.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Recommendations
          </Button>
        </form>
      </Form>

      {isLoading && (
         <div className="mt-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Our AI is searching for your perfect property...</p>
         </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Here are your top recommendations:</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recommendations.map(rec => (
              <Card key={rec.propertyId} className='overflow-hidden'>
                <CardHeader>
                    <CardTitle className="text-base">{rec.propertyName}</CardTitle>
                    <CardDescription className='flex items-center text-xs'>
                        <MapPin className="mr-1 h-3 w-3" /> {rec.location}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{rec.propertyDescription}</p>
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-primary">{formatPrice(rec.propertyPrice)}</p>
                    <div className="text-right">
                        <p className="font-bold text-green-600">{rec.suitabilityScore}/100</p>
                        <p className="text-xs text-muted-foreground">Suitability</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
