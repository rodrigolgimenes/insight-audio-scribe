
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingCard } from './PricingCard';
import { Rocket, Clock, Globe, Infinity } from 'lucide-react';

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

  const getPlanFeatures = (priceId: string) => {
    switch (priceId) {
      case 'price_free':
        return [
          '3 daily transcriptions',
          'Uploads up to 30 minutes per file',
          'Lower priority processing'
        ];
      case 'price_1Oq1ZSHUWJYWYdiNMHWZWjMS': // ID do plano mensal
        return [
          'Unlimited transcriptions',
          'Uploads up to 10 hours / 5GB per file',
          'Highest priority processing',
          'Translation into 134+ languages'
        ];
      case 'price_1Oq1ZsHUWJYWYdiNr0eteIMS': // ID do plano anual
        return [
          'Unlimited transcriptions',
          'Uploads up to 10 hours / 5GB per file',
          'Highest priority processing',
          'Translation into 134+ languages',
          'Save 50% with yearly billing'
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading pricing...</div>;
  }

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Simple, transparent pricing
        </h2>
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
            interval={price.interval || ''}
            features={getPlanFeatures(price.id)}
            priceId={price.id}
            isPopular={index === 1}
            buttonText={price.id === 'price_free' ? 'Get Started' : 'Subscribe Now'}
          />
        ))}
      </div>
    </section>
  );
};
