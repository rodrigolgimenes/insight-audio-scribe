
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

  const isYearlyPlan = priceId === 'price_1Qs3tpRepqC8oahuh0kSILbX';
  const isFree = price === 0;

  return (
    <Card 
      className={`w-full transform transition-all duration-200 hover:translate-y-[-4px] ${
        isPopular ? 'border-primary shadow-lg relative scale-105 lg:scale-110' : ''
      }`}
    >
      <CardHeader>
        {isPopular && (
          <div className="px-3 py-1 text-sm text-primary-foreground bg-primary rounded-full w-fit mb-2">
            Most Popular
          </div>
        )}
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <CardDescription className="text-sm mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          {isYearlyPlan ? (
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                ${price.toFixed(2)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Billed annually ($90.00/year)
              </div>
            </div>
          ) : (
            <div className="text-4xl font-bold">
              ${price}
              {!isFree && interval && (
                <span className="text-lg font-normal text-muted-foreground">/{interval}</span>
              )}
            </div>
          )}
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full transition-all duration-200 ${
            isPopular 
              ? 'bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg' 
              : 'hover:bg-gray-100'
          }`}
          variant={isPopular ? "default" : "outline"}
          onClick={handleSubscribe}
          disabled={hasActiveSubscription && priceId !== 'price_1Qs49tRepqC8oahubgFsDuHf'}
          size="lg"
        >
          {hasActiveSubscription && priceId !== 'price_1Qs49tRepqC8oahubgFsDuHf' 
            ? 'Already Subscribed' 
            : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
