
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PricingCard } from './PricingCard';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  status: string;
}

export const PricingSection = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      if (!session?.user) return null;
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .single();
      return data as Subscription;
    },
    enabled: !!session?.user,
  });

  const hasActiveSubscription = subscription?.status === 'active';

  const handleSubscribeClick = async (priceId: string) => {
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const plans = [
    {
      name: 'InsightScribe Free',
      description: '100% Free',
      price: 0,
      interval: '',
      priceId: 'free',
      features: [
        '3 daily transcriptions',
        'Files up to 30 minutes',
        'Lower priority processing'
      ],
      buttonText: 'Get Started'
    },
    {
      name: 'InsightScribe Plus - Unlimited',
      description: 'Full features, billed annually',
      price: 7.50,
      interval: 'month',
      priceId: 'prod_Rlb6RWk7O8GE6M',
      isPopular: true,
      features: [
        'Unlimited transcriptions',
        'Files up to 10 hours in length',
        'Advanced AI summarization',
        'Priority processing',
        'Real-time collaboration',
        'Custom vocabulary support',
        'Premium support via chat/email'
      ],
      buttonText: 'Subscribe Now'
    },
    {
      name: 'InsightScribe Plus - Unlimited',
      description: 'Full features, billed monthly',
      price: 15,
      interval: 'month',
      priceId: 'prod_Rlb3WhzzS78RUa',
      features: [
        'Unlimited transcriptions',
        'Files up to 10 hours in length',
        'Advanced AI summarization',
        'Priority processing',
        'Real-time collaboration',
        'Custom vocabulary support',
        'Premium support via chat/email'
      ],
      buttonText: 'Subscribe Now'
    }
  ];

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
        {plans.map((plan) => (
          <PricingCard
            key={plan.priceId}
            {...plan}
            hasActiveSubscription={hasActiveSubscription}
            onSubscribeClick={() => handleSubscribeClick(plan.priceId)}
          />
        ))}
      </div>
    </section>
  );
};
