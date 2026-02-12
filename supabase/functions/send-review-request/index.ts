import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { requestId } = await req.json();
    if (!requestId) throw new Error("requestId is required");

    // Get the review request
    const { data: request, error: reqErr } = await supabase
      .from("review_requests")
      .select("*, customers(first_name, last_name, email)")
      .eq("id", requestId)
      .single();
    if (reqErr || !request) throw new Error("Review request not found");

    const email = request.customer_email || request.customers?.email;
    if (!email) throw new Error("Customer has no email address");

    // Get review platform link
    const { data: platformLink } = await supabase
      .from("review_platform_links")
      .select("review_url")
      .eq("dealer_id", request.dealer_id)
      .eq("platform", request.platform)
      .single();

    const reviewUrl = platformLink?.review_url;
    if (!reviewUrl) throw new Error(`No review link configured for ${request.platform}. Add it in Review Booster settings.`);

    // Get dealer info for branding
    const { data: dealer } = await supabase
      .from("dealers")
      .select("name, trading_name, email, logo_url")
      .eq("id", request.dealer_id)
      .single();

    const dealerName = dealer?.trading_name || dealer?.name || "Our Dealership";
    const customerName = request.customer_name || "Valued Customer";
    const vehicleInfo = request.vehicle_info || "";

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          ${dealer?.logo_url ? `<img src="${dealer.logo_url}" alt="${dealerName}" style="max-height: 60px; margin-bottom: 16px;" />` : ""}
          <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">${dealerName}</h1>
        </div>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">How was your experience?</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            Hi ${customerName},
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Thank you for choosing ${dealerName}${vehicleInfo ? ` for your ${vehicleInfo}` : ""}. We'd love to hear about your experience. Your feedback helps us improve and helps other customers make informed decisions.
          </p>
          <a href="${reviewUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Leave a Review
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            This will take you to ${request.platform.charAt(0).toUpperCase() + request.platform.slice(1)} to leave your review.
          </p>
        </div>
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px;">
          You received this email because you recently visited ${dealerName}. If you believe this was sent in error, please ignore it.
        </p>
      </div>
    `;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: `${dealerName} <onboarding@resend.dev>`,
        to: [email],
        subject: `We'd love your feedback — ${dealerName}`,
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      throw new Error(`Email send failed: ${errBody}`);
    }

    // Update request status
    await supabase.from("review_requests").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      review_link_url: reviewUrl,
    }).eq("id", requestId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
