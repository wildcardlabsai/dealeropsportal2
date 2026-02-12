import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, dealership } = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Name and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const firstName = name.split(" ")[0] || name;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#6d28d9;border-radius:12px;padding:12px 16px;">
        <span style="color:#fff;font-weight:800;font-size:20px;">D</span>
      </div>
      <h1 style="color:#fff;margin:16px 0 0;font-size:24px;">
        Dealer<span style="color:#6d28d9;">Ops</span>
      </h1>
    </div>
    
    <div style="background:#111127;border:1px solid #1e1e3a;border-radius:16px;padding:40px 32px;text-align:center;">
      <h2 style="color:#fff;font-size:22px;margin:0 0 8px;">Thank you, ${firstName}!</h2>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We've received your demo request${dealership ? ` for <strong style="color:#fff;">${dealership}</strong>` : ""} and a member of our team will be in touch shortly to get you set up.
      </p>
      
      <div style="background:#0a0a1a;border-radius:12px;padding:24px;margin:24px 0;text-align:left;">
        <p style="color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">What happens next?</p>
        <table style="width:100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">✓ &nbsp;We'll review your request within 24 hours</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">✓ &nbsp;A team member will reach out to schedule a demo</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px;">✓ &nbsp;Your 14-day Pro trial will be activated</td>
          </tr>
        </table>
      </div>

      <p style="color:#6b7280;font-size:12px;margin:24px 0 0;">
        If you have any questions in the meantime, just reply to this email.
      </p>
    </div>

    <p style="text-align:center;color:#4b5563;font-size:11px;margin-top:32px;">
      © ${new Date().getFullYear()} DealerOps. All rights reserved.
    </p>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DealerOps <onboarding@resend.dev>",
        to: [email],
        subject: "Thanks for your interest in DealerOps!",
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
