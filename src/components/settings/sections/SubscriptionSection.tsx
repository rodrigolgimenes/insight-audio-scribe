
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreditCard } from 'lucide-react';

interface SubscriptionSectionProps {
  isFreePlan: boolean;
}

export const SubscriptionSection = ({ isFreePlan }: SubscriptionSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpgradeClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: 'price_1Qs3rZRepqC8oahuQ4vCb2Eb' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Subscription Plan</h2>
      </div>
      <Separator />
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-lg font-medium mb-4">
          Current Plan: {isFreePlan ? 'Free Plan' : 'Plus Plan'}
        </p>
        {isFreePlan && (
          <Button
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
          >
            Upgrade to Plus
          </Button>
        )}
      </div>
    </div>
  );
};
