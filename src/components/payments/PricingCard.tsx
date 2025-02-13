
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  priceId: string;
  isPopular?: boolean;
  buttonText: string;
  hasActiveSubscription: boolean;
  onSubscribeClick: () => void;
}

export const PricingCard = ({
  name,
  description,
  price,
  interval,
  features,
  priceId,
  isPopular = false,
  buttonText,
  hasActiveSubscription,
  onSubscribeClick,
}: PricingCardProps) => {
  const { toast } = useToast();

  const handleSubscribe = () => {
    if (hasActiveSubscription && priceId !== 'price_1Qs49tRepqC8oahubgFsDuHf') {
      toast({
        title: "Active Subscription",
        description: "You already have an active subscription. Visit your account settings to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    onSubscribeClick();
  };

  const isYearlyPlan = interval === 'year' && price === 90;
  const monthlyEquivalent = isYearlyPlan ? 7.50 : null;

  return (
    <Card className={`w-full max-w-sm ${isPopular ? 'border-primary shadow-lg relative' : ''}`}>
      <CardHeader>
        {isPopular && (
          <div className="px-3 py-1 text-sm text-primary-foreground bg-primary rounded-full w-fit mb-2">
            Most Popular
          </div>
        )}
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {isYearlyPlan ? (
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                ${monthlyEquivalent.toFixed(2)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Billed annually (${price.toFixed(2)}/year)
              </div>
            </div>
          ) : (
            <div>
              <span className="text-4xl font-bold">${price}</span>
              {interval && (
                <span className="text-muted-foreground">/{interval}</span>
              )}
            </div>
          )}
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
          variant={isPopular ? "default" : "outline"}
          onClick={handleSubscribe}
          disabled={hasActiveSubscription && priceId !== 'price_1Qs49tRepqC8oahubgFsDuHf'}
        >
          {hasActiveSubscription && priceId !== 'price_1Qs49tRepqC8oahubgFsDuHf' ? 'Already Subscribed' : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
