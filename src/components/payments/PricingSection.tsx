
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingCard } from './PricingCard';

interface Product {
  name: string | null;
  description: string | null;
}

interface Price {
  id: string;
  unit_amount: number | null;
  interval: string | null;
  product: Product | null;
}

export const PricingSection = () => {
  const { data: prices, isLoading } = useQuery<Price[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prices')
        .select(`
          id,
          unit_amount,
          interval,
          product:product_id (
            name,
            description
          )
        `)
        .eq('active', true)
        .order('unit_amount');

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading pricing...</div>;
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that best fits your needs
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {prices?.map((price, index) => (
          <PricingCard
            key={price.id}
            name={price.product?.name || ''}
            description={price.product?.description || ''}
            price={price.unit_amount ? price.unit_amount / 100 : 0}
            interval={price.interval || 'month'}
            features={[
              'Feature 1',
              'Feature 2',
              'Feature 3',
            ]}
            priceId={price.id}
            isPopular={index === 1}
          />
        ))}
      </div>
    </div>
  );
};
