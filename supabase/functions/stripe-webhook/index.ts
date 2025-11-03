import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  });

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log('Webhook event received:', event.type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle successful payment
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      console.log('Payment succeeded, saving to database:', paymentIntent.id);

      const { error } = await supabase.from('donations').insert({
        name: metadata.name,
        email: metadata.email,
        phone: metadata.phone,
        organization: metadata.organization || null,
        amount: parseFloat(((paymentIntent.amount - parseFloat(metadata.processingFee || '0') * 100) / 100).toFixed(2)),
        processing_fee: parseFloat(metadata.processingFee || '0'),
        total_amount: paymentIntent.amount / 100,
        frequency: 'one-time',
        campaign: metadata.campaign,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: paymentIntent.customer as string,
        status: 'completed',
      });

      if (error) {
        console.error('Error saving donation:', error);
      } else {
        console.log('Donation saved successfully');
      }
    }

    // Handle successful subscription
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscription = invoice.subscription;
      
      if (subscription) {
        const sub = await stripe.subscriptions.retrieve(subscription as string);
        const metadata = sub.metadata;

        console.log('Subscription payment succeeded:', subscription);

        const { error } = await supabase.from('donations').insert({
          name: metadata.name,
          email: invoice.customer_email || '',
          phone: metadata.phone,
          organization: metadata.organization || null,
          amount: parseFloat(((invoice.amount_paid - parseFloat(metadata.processingFee || '0') * 100) / 100).toFixed(2)),
          processing_fee: parseFloat(metadata.processingFee || '0'),
          total_amount: invoice.amount_paid / 100,
          frequency: 'monthly',
          campaign: metadata.campaign,
          stripe_subscription_id: subscription as string,
          stripe_customer_id: invoice.customer as string,
          status: 'completed',
        });

        if (error) {
          console.error('Error saving subscription donation:', error);
        } else {
          console.log('Subscription donation saved successfully');
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});