
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await supabaseClient
          .from('subscriptions')
          .upsert({
            id: subscription.id,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          });
        break;
      case 'product.created':
      case 'product.updated':
        const product = event.data.object;
        await supabaseClient
          .from('products')
          .upsert({
            id: product.id,
            active: product.active,
            name: product.name,
            description: product.description,
            image: product.images?.[0] ?? null,
            metadata: product.metadata,
          });
        break;
      case 'price.created':
      case 'price.updated':
        const price = event.data.object;
        await supabaseClient
          .from('prices')
          .upsert({
            id: price.id,
            product_id: price.product,
            active: price.active,
            currency: price.currency,
            description: price.nickname,
            type: price.type,
            unit_amount: price.unit_amount,
            interval: price.recurring?.interval ?? null,
            interval_count: price.recurring?.interval_count ?? null,
            trial_period_days: price.recurring?.trial_period_days ?? null,
            metadata: price.metadata,
          });
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
