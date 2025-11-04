import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { 
      name, 
      email, 
      phone, 
      organization, 
      amount, 
      processingFee, 
      totalAmount, 
      frequency, 
      campaign 
    } = await req.json();

    console.log('Processing payment:', { name, email, amount, frequency, campaign });

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Found existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          organization: organization || '',
        },
      });
      console.log('Created new customer:', customer.id);
    }

    let response;

    if (frequency === 'monthly') {
      // Create a subscription for monthly donations
      console.log('Creating monthly subscription');
      
      // Create a price for this specific amount
      const price = await stripe.prices.create({
        unit_amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `Monthly Donation - ${campaign}`,
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          name,
          phone,
          organization: organization || '',
          campaign,
          processingFee: processingFee.toString(),
        },
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      console.log('Subscription created:', subscription.id);

      response = {
        type: 'subscription',
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        customerId: customer.id,
      };
    } else {
      // Create a one-time payment intent
      console.log('Creating one-time payment intent');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        metadata: {
          name,
          email,
          phone,
          organization: organization || '',
          campaign,
          processingFee: processingFee.toString(),
        },
        description: `Donation to ${campaign}`,
      });

      console.log('Payment intent created:', paymentIntent.id);

      response = {
        type: 'payment',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId: customer.id,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});