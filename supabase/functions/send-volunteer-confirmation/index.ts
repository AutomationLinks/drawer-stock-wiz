import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VolunteerSignupData {
  first_name: string;
  last_name: string;
  email: string;
  event_id: string;
  quantity: number;
  comment?: string;
  event_date?: string;
  time_slot?: string;
  location?: string;
  location_address?: string;
}

interface ResendResponse {
  id: string;
}

async function sendEmail(params: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<ResendResponse> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

function generateICS(
  eventDate: string,
  timeSlot: string,
  location: string,
  locationAddress: string,
  volunteerEmail: string,
  volunteerName: string
): string {
  // Parse time slot like "10:00 AM – 12:00 PM"
  const [startTime, endTime] = timeSlot.split("–").map(t => t.trim());
  
  const parseTime = (time: string, date: string): string => {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    const dateObj = new Date(date);
    dateObj.setHours(hours, minutes, 0, 0);
    
    // Format as YYYYMMDDTHHMMSS
    return dateObj.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const dtstart = parseTime(startTime, eventDate);
  const dtend = parseTime(endTime, eventDate);
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `volunteer-${Date.now()}@thedrawer.org`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//The Drawer//Volunteer Signup//EN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:Volunteer at The Drawer - ${location}
LOCATION:${locationAddress}
DESCRIPTION:Thank you for volunteering with The Drawer! Please arrive 10 minutes early. Contact us at 877-829-5500 or info@thedrawer.org if you have any questions.
ORGANIZER;CN=The Drawer:mailto:info@thedrawer.org
ATTENDEE;CN=${volunteerName};RSVP=TRUE:mailto:${volunteerEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signupData: VolunteerSignupData = await req.json();
    
    console.log("Processing volunteer confirmation emails for:", signupData.email);

    // Get event details if not provided
    let eventDate = signupData.event_date;
    let timeSlot = signupData.time_slot;
    let location = signupData.location;
    let locationAddress = signupData.location_address;

    if (!eventDate || !timeSlot || !location || !locationAddress) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: event, error } = await supabase
        .from("volunteer_events")
        .select("event_date, time_slot, location, location_address")
        .eq("id", signupData.event_id)
        .single();

      if (error) throw error;
      
      eventDate = event.event_date;
      timeSlot = event.time_slot;
      location = event.location;
      locationAddress = event.location_address;
    }

    const volunteerName = `${signupData.first_name} ${signupData.last_name}`;
    const formattedDate = new Date(eventDate!).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // Generate ICS file
    const icsContent = generateICS(
      eventDate!,
      timeSlot!,
      location!,
      locationAddress!,
      signupData.email,
      volunteerName
    );

    // Convert ICS to base64 using TextEncoder
    const encoder = new TextEncoder();
    const icsBytes = encoder.encode(icsContent);
    const icsBase64 = btoa(String.fromCharCode(...icsBytes));

    // Email to Admin (Gina)
    const adminEmail = await sendEmail({
      from: "The Drawer Volunteer <info@thedrawer.org>",
      to: ["gina.lindquist@thedrawer.org"],
      subject: `New Volunteer Signup - ${volunteerName} for ${formattedDate}`,
      html: `
        <h2>New Volunteer Signup</h2>
        <p>A new volunteer has signed up for an upcoming event.</p>
        
        <h3>Volunteer Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${volunteerName}</li>
          <li><strong>Email:</strong> ${signupData.email}</li>
          <li><strong>Number of People:</strong> ${signupData.quantity}</li>
          ${signupData.comment ? `<li><strong>Comment:</strong> ${signupData.comment}</li>` : ''}
        </ul>
        
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${timeSlot}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Address:</strong> ${locationAddress}</li>
        </ul>
        
        <p>The calendar invite is attached to this email.</p>
        
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          You can manage all volunteer signups at your admin dashboard.
        </p>
      `,
      attachments: [
        {
          filename: "volunteer-event.ics",
          content: icsBase64,
        },
      ],
    });

    console.log("Admin email sent:", adminEmail);

    // Email to Volunteer
    const volunteerEmail = await sendEmail({
      from: "The Drawer <info@thedrawer.org>",
      to: [signupData.email],
      subject: "Thank You for Volunteering! Event Details Inside",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Thank You for Volunteering with The Drawer!</h2>
          
          <p>Hi ${signupData.first_name},</p>
          
          <p>We're excited to have you volunteer with us! This email confirms your volunteer registration.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Event Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Address:</strong> ${locationAddress}</p>
            <p><strong>Number of Volunteers:</strong> ${signupData.quantity}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important:</strong> Please arrive 10 minutes early to check in.</p>
          </div>
          
          <p>A calendar invite is attached to this email. Simply open the attachment to add this event to your calendar.</p>
          
          <h3>What to Expect:</h3>
          <ul>
            <li>Comfortable, casual clothing recommended</li>
            <li>We'll provide any necessary training and equipment</li>
            <li>Your contribution makes a real difference in our community</li>
          </ul>
          
          <p>If you have any questions or need to make changes to your registration, please contact us:</p>
          <p>
            📞 <strong>Phone:</strong> 877-829-5500<br>
            📧 <strong>Email:</strong> info@thedrawer.org
          </p>
          
          <p style="margin-top: 30px;">Thank you for your commitment to serving our community!</p>
          
          <p>
            Warmly,<br>
            <strong>The Drawer Team</strong>
          </p>
          
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            The Drawer Inc.<br>
            14147 Autumnwood Way, Rosemount, MN 55068<br>
            A 501(c)(3) Public Charity • EIN: 82-2834119
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "volunteer-event.ics",
          content: icsBase64,
        },
      ],
    });

    console.log("Volunteer email sent:", volunteerEmail);

    // Add volunteer to Resend audience
    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    if (audienceId) {
      try {
        const contactResponse = await fetch(
          `https://api.resend.com/audiences/${audienceId}/contacts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            },
            body: JSON.stringify({
              email: signupData.email,
              first_name: signupData.first_name,
              last_name: signupData.last_name,
              unsubscribed: false,
            }),
          }
        );
        const contactResult = await contactResponse.json();
        console.log("Added volunteer to Resend audience:", contactResult);
      } catch (audienceError) {
        console.error("Failed to add to audience (non-blocking):", audienceError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, adminEmail, volunteerEmail }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-volunteer-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
