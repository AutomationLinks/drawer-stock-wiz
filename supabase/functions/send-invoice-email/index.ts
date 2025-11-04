import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId }: SendInvoiceRequest = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "Invoice ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice with customer and items
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers (
          customer_name,
          email,
          billing_address
        ),
        invoice_items (
          item_name,
          quantity,
          price,
          total
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!invoice.customers?.email) {
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build items HTML
    const itemsHtml = invoice.invoice_items
      .map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.item_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$0.00</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$0.00</td>
        </tr>
      `)
      .join("");

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: "The Drawer <onboarding@resend.dev>",
      to: [invoice.customers.email],
      subject: `Invoice ${invoice.invoice_number} from The Drawer`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #1a1a1a; margin: 0 0 10px 0;">Invoice ${invoice.invoice_number}</h1>
              <p style="color: #666; margin: 0;">From The Drawer</p>
            </div>

            <div style="margin-bottom: 20px;">
              <p>Dear ${invoice.customers.customer_name},</p>
              <p>Thank you for your partnership with The Drawer. Please find your invoice details below.</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Quantity</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Rate</th>
                  <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-bottom: 20px;">
              <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">Total: $0.00</p>
            </div>

            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">Nonprofit Tax-Deductible Donation</p>
              <p style="margin: 0; font-size: 14px; color: #666;">
                All items are provided at no cost as part of our charitable mission. 
                This invoice serves as a donation receipt for your records.
              </p>
            </div>

            ${invoice.notes ? `
              <div style="margin-bottom: 20px;">
                <p style="font-weight: bold; margin: 0 0 5px 0;">Notes:</p>
                <p style="margin: 0; color: #666; white-space: pre-line;">${invoice.notes}</p>
              </div>
            ` : ""}

            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p>Thank you for supporting our community!</p>
              <p style="margin: 5px 0;">The Drawer</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice to mark email as sent
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
