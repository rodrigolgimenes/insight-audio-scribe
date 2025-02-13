import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingCard } from './PricingCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { EditablePricingText } from './EditablePricingText';

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

interface PlanText {
  name: string;
  description: string;
}

export const PricingSection = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [planTexts, setPlanTexts] = useState<Record<string, PlanText>>({
    free: {
      name: 'InsightScribe Free',
      description: '100% Free'
    },
    monthly: {
      name: 'InsightScribe Plus - Unlimited',
      description: 'Full features, billed monthly'
    },
    yearly: {
      name: 'InsightScribe Plus - Unlimited',
      description: 'Full features, billed yearly'
    }
  });

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
          '✅ 3 daily transcriptions',
          '⏳ Files up to 30 minutes',
          '⚡ Lower priority processing'
        ];
      case 'price_1Qs3rZRepqC8oahuQ4vCb2Eb': // Monthly plan
        return [
          '🔄 Unlimited transcriptions',
          '⏳ Files up to 10 hours in length',
          '🤖 Advanced AI summarization',
          '🚀 Priority processing',
          '🤝 Real-time collaboration',
          '📖 Custom vocabulary support',
          '🎟️ Premium support via chat/email'
        ];
      case 'price_1Qs3tpRepqC8oahuh0kSILbX': // Yearly plan
        return [
          '🔄 Unlimited transcriptions',
          '⏳ Files up to 10 hours in length',
          '🤖 Advanced AI summarization',
          '🚀 Priority processing',
          '🤝 Real-time collaboration',
          '📖 Custom vocabulary support',
          '🎟️ Premium support via chat/email'
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

    if (priceId === 'price_1Qs49tRepqC8oahubgFsDuHf') {
      navigate('/simple-record');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: priceId === 'price_1Qs3tpRepqC8oahuh0kSILbX' ? 'prod_Rlb6RWk7O8GE6M' : 'prod_Rlb3WhzzS78RUa'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handlePlanTextUpdate = (planType: string, field: 'name' | 'description', value: string) => {
    setPlanTexts(prev => ({
      ...prev,
      [planType]: {
        ...prev[planType],
        [field]: value
      }
    }));
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

  // Organize prices in the correct order
  const orderedPrices = [...prices].sort((a, b) => {
    if (a.id === 'price_1Qs3tpRepqC8oahuh0kSILbX') return 0; // Yearly plan in middle
    if (a.unit_amount === 0) return -1; // Free plan first
    return 1; // Monthly plan last
  });

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
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto items-start">
        {orderedPrices.map((price) => {
          const isPopular = price.id === 'price_1Qs3tpRepqC8oahuh0kSILbX';
          const isFree = price.unit_amount === 0;
          const isYearly = price.id === 'price_1Qs3tpRepqC8oahuh0kSILbX';
          
          const planType = isFree ? 'free' : (isYearly ? 'yearly' : 'monthly');
          const currentPlanText = planTexts[planType];

          let displayPrice = isFree ? 0 : isYearly ? 7.50 : 15;

          return (
            <PricingCard
              key={price.id}
              name={
                <EditablePricingText
                  initialText={currentPlanText.name}
                  className="text-xl font-bold"
                  onSave={(newText) => handlePlanTextUpdate(planType, 'name', newText)}
                />
              }
              description={
                <EditablePricingText
                  initialText={currentPlanText.description}
                  className="text-sm mt-2"
                  onSave={(newText) => handlePlanTextUpdate(planType, 'description', newText)}
                />
              }
              price={displayPrice}
              interval={isYearly ? 'month' : (price.interval || '')}
              features={getPlanFeatures(price.id)}
              priceId={price.id}
              isPopular={isPopular}
              buttonText={isFree ? 'Get Started' : 'Subscribe Now'}
              hasActiveSubscription={hasActiveSubscription}
              onSubscribeClick={() => handleSubscribeClick(price.id)}
            />
          );
        })}
      </div>
    </section>
  );
};
