
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingCard } from './PricingCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

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

interface Subscription {
  status: string;
}

export const PricingSection = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: prices, isLoading: isPricesLoading } = useQuery<Price[]>({
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

      if (error) {
        console.error('Error fetching prices:', error);
        throw error;
      }
      console.log('Fetched prices:', data);
      return data;
    },
  });

  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('workspace_id', session?.user?.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const getPlanFeatures = (priceId: string) => {
    switch (priceId) {
      case 'price_1Qs49tRepqC8oahubgFsDuHf': // Free plan
        return [
          '3 daily transcriptions',
          'Uploads up to 30 minutes per file',
          'Lower priority processing'
        ];
      case 'price_1Qs3rZRepqC8oahuQ4vCb2Eb': // Monthly plan
        return [
          'Unlimited transcriptions',
          'Files up to 10 hours in length',
          'Advanced AI summarization',
          'Priority processing',
          'Real-time collaboration',
          'Custom vocabulary support',
          'Premium support via chat/email'
        ];
      case 'price_1Qs3tpRepqC8oahuh0kSILbX': // Yearly plan
        return [
          'All Plus features included',
          'Files up to 10 hours in length',
          'Advanced AI summarization',
          'Priority processing',
          'Real-time collaboration',
          'Custom vocabulary support',
          'Premium support via chat/email',
          '50% savings with annual billing'
        ];
      default:
        return [];
    }
  };

  const handleSubscribeClick = async (priceId: string) => {
    if (!session) {
      navigate('/login');
      return;
    }

    // For free plan, redirect to simple-record directly
    if (priceId === 'price_1Qs49tRepqC8oahubgFsDuHf') {
      navigate('/simple-record');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';

  if (isPricesLoading || isSubscriptionLoading) {
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!prices || prices.length === 0) {
    console.log('No prices available');
    return null;
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
        {prices.map((price, index) => {
          const isPopular = index === 1;
          const isFree = price.unit_amount === 0;
          const buttonText = isFree ? 'Get Started' : 'Subscribe Now';

          return (
            <PricingCard
              key={price.id}
              name={price.product?.name || ''}
              description={price.product?.description || ''}
              price={price.unit_amount ? price.unit_amount / 100 : 0}
              interval={price.interval || ''}
              features={getPlanFeatures(price.id)}
              priceId={price.id}
              isPopular={isPopular}
              buttonText={buttonText}
              hasActiveSubscription={hasActiveSubscription}
              onSubscribeClick={() => handleSubscribeClick(price.id)}
            />
          );
        })}
      </div>
    </section>
  );
};
