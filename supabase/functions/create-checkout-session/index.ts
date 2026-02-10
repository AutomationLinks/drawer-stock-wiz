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
    const requestBody = await req.json();
    const { 
      name, 
      email, 
      phone, 
      organization,
      address,
      amount, 
      processingFee, 
      totalAmount, 
      frequency, 
      campaign,
      couponCode,
      isTestMode
    } = requestBody;

    // Determine which secret key to use based on test mode
    const stripeSecretKey = isTestMode 
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    const stripe = new Stripe(stripeSecretKey || '', {
      apiVersion: '2023-10-16',
    });

    console.log('Creating checkout session:', { name, email, amount, frequency, campaign, mode: isTestMode ? 'TEST' : 'LIVE' });

    // Get origin from request headers
    const origin = req.headers.get('origin') || 'http://localhost:8080';

    // Handle $0 donations (100% coupon case)
    if (totalAmount <= 0) {
      console.log('Zero amount donation detected - returning success directly');
      return new Response(JSON.stringify({
        type: 'zero_payment',
        message: 'Donation fully covered by coupon',
        successUrl: `${origin}/donate?success=true&amount=0&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

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

    let session;

    if (frequency === 'monthly') {
      // Create a subscription checkout session
      console.log('Creating subscription checkout session');
      
      // Create a price for this specific amount (minimum $0.50 for Stripe)
      const price = await stripe.prices.create({
        unit_amount: Math.max(50, Math.round(totalAmount * 100)), // Convert to cents, minimum $0.50
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: `Monthly Donation - ${campaign}`,
          description: `Monthly recurring donation to ${campaign}`,
        },
      });

      session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${origin}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/donate`,
        metadata: {
          name,
          email,
          phone,
          organization: organization || '',
          address: address || '',
          campaign,
          processingFee: processingFee.toString(),
          couponCode: couponCode || '',
          isTestMode: isTestMode ? 'true' : 'false',
          frequency: 'monthly',
          donationAmount: amount.toString(),
        },
      });

      console.log('Subscription checkout session created:', session.id);
    } else {
      // Create a one-time payment checkout session
      console.log('Creating one-time payment checkout session');
      
      session = await stripe.checkout.sessions.create({
        submit_type: 'donate',
        customer: customer.id,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Donation - ${campaign}`,
                description: `One-time donation to ${campaign}`,
              },
              unit_amount: Math.max(50, Math.round(totalAmount * 100)), // Convert to cents, minimum $0.50
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/donate?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/donate`,
        metadata: {
          name,
          email,
          phone,
          organization: organization || '',
          address: address || '',
          campaign,
          processingFee: processingFee.toString(),
          couponCode: couponCode || '',
          isTestMode: isTestMode ? 'true' : 'false',
          frequency: 'one-time',
          donationAmount: amount.toString(),
        },
      });

      console.log('One-time checkout session created:', session.id);
    }

    return new Response(JSON.stringify({
      type: 'checkout',
      url: session.url,
      sessionId: session.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
