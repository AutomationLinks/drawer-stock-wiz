import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface VolunteerSignup {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  quantity: number;
  event_id: string;
  reminder_sent: boolean;
}

interface VolunteerEvent {
  id: string;
  event_date: string;
  time_slot: string;
  location: string;
  location_address: string;
  event_name: string | null;
  event_type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tomorrow's date in YYYY-MM-DD format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Looking for events on: ${tomorrowStr}`);

    // Get all events happening tomorrow
    const { data: events, error: eventsError } = await supabase
      .from("volunteer_events")
      .select("*")
      .eq("event_date", tomorrowStr);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log("No events scheduled for tomorrow");
      return new Response(
        JSON.stringify({ message: "No events scheduled for tomorrow", reminders_sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${events.length} events for tomorrow`);
    const eventIds = events.map(e => e.id);

    // Get all signups for tomorrow's events where reminder hasn't been sent
    const { data: signups, error: signupsError } = await supabase
      .from("volunteer_signups")
      .select("*")
      .in("event_id", eventIds)
      .eq("reminder_sent", false);

    if (signupsError) {
      console.error("Error fetching signups:", signupsError);
      throw signupsError;
    }

    if (!signups || signups.length === 0) {
      console.log("No pending reminders to send");
      return new Response(
        JSON.stringify({ message: "No pending reminders to send", reminders_sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${signups.length} signups needing reminders`);

    // Create a map of events by ID for quick lookup
    const eventMap = new Map<string, VolunteerEvent>();
    for (const event of events) {
      eventMap.set(event.id, event);
    }

    let remindersSent = 0;
    const errors: string[] = [];

    // Send reminder email to each signup
    for (const signup of signups as VolunteerSignup[]) {
      const event = eventMap.get(signup.event_id);
      if (!event) {
        console.error(`Event not found for signup ${signup.id}`);
        continue;
      }

      const eventTitle = event.event_name || `Volunteer at The Drawer - ${event.location}`;
      const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      try {
        await resend.emails.send({
          from: "The Drawer <info@thedrawer.org>",
          to: [signup.email],
          subject: `Reminder: ${eventTitle} - Tomorrow!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Volunteer Reminder</h1>
              <p>Hi ${signup.first_name},</p>
              <p>This is a friendly reminder that you're signed up to volunteer <strong>tomorrow</strong>!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0;">${eventTitle}</h2>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${event.time_slot}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Address:</strong> ${event.location_address}</p>
                ${signup.quantity > 1 ? `<p><strong>Group Size:</strong> ${signup.quantity} people</p>` : ''}
              </div>
              
              <p>We're excited to see you! If you have any questions or need to cancel, please contact us as soon as possible.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #666; font-size: 14px;">
                <strong>The Drawer</strong><br>
                500 E Travelers Trail Suite 575<br>
                Burnsville, MN 55337<br>
                Phone: (612) 367-7839
              </p>
            </div>
          `,
        });

        // Mark reminder as sent
        await supabase
          .from("volunteer_signups")
          .update({ reminder_sent: true })
          .eq("id", signup.id);

        remindersSent++;
        console.log(`Reminder sent to ${signup.email} for event ${event.id}`);
      } catch (emailError: any) {
        console.error(`Failed to send reminder to ${signup.email}:`, emailError);
        errors.push(`${signup.email}: ${emailError.message}`);
      }
    }

    const response = {
      message: `Sent ${remindersSent} reminder emails`,
      reminders_sent: remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Reminder job complete:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-volunteer-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
