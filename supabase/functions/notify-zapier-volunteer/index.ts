import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VolunteerData {
  first_name: string;
  last_name: string;
  email: string;
  event_date: string;
  event_time: string;
  location: string;
  location_address: string;
  quantity: number;
  comment?: string;
  date: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('ZAPIER_VOLUNTEER_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('ZAPIER_VOLUNTEER_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const volunteerData: VolunteerData = await req.json();
    console.log('Sending volunteer signup to Zapier:', { email: volunteerData.email, event_date: volunteerData.event_date });

    const zapierPayload = {
      type: 'volunteer_signup',
      first_name: volunteerData.first_name,
      last_name: volunteerData.last_name,
      email: volunteerData.email,
      event_date: volunteerData.event_date,
      event_time: volunteerData.event_time,
      location: volunteerData.location,
      location_address: volunteerData.location_address,
      quantity: volunteerData.quantity,
      comment: volunteerData.comment || null,
      date: volunteerData.date,
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

    console.log('Successfully sent volunteer signup to Zapier');

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
