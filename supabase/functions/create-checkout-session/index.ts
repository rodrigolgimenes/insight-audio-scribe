
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { priceId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get or create Stripe customer
    let { data: customer } = await supabaseClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      const { data: userData } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      const stripeCustomer = await stripe.customers.create({
        email: userData?.email,
        name: userData?.full_name,
        metadata: {
          supabaseUUID: user.id,
        },
      });

      await supabaseClient
        .from('customers')
        .insert([{ id: user.id, stripe_customer_id: stripeCustomer.id }]);

      customer = { stripe_customer_id: stripeCustomer.id };
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.stripe_customer_id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
