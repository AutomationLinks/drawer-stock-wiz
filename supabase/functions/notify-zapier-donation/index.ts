import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DonationData {
  name: string;
  email: string;
  phone: string;
  organization?: string;
  address?: string;
  amount: number;
  frequency: string;
  campaign: string;
  date: string;
  test_mode: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('ZAPIER_DONATION_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('ZAPIER_DONATION_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const donationData: DonationData = await req.json();
    console.log('Sending donation contact to Zapier:', { email: donationData.email, amount: donationData.amount });

    const zapierPayload = {
      type: 'donation',
      name: donationData.name,
      email: donationData.email,
      phone: donationData.phone,
      organization: donationData.organization || null,
      address: donationData.address || null,
      amount: donationData.amount,
      frequency: donationData.frequency,
      campaign: donationData.campaign,
      date: donationData.date,
      test_mode: donationData.test_mode,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zapierPayload),
    });

    if (!response.ok) {
      console.error('Zapier webhook failed:', response.status, response.statusText);
      throw new Error(`Zapier webhook returned ${response.status}`);
    }

    console.log('Successfully sent donation contact to Zapier');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending to Zapier:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
